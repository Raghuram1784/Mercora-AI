import { prisma, Decimal } from "../config/database.js";
import { CreateOrderInput, OrderResponseData } from "./order.types.js";
import { generateOrderNumber } from "./order-number.js";
import { OrderMapper } from "./order.mapper.js";
import { AuditService } from "../audit/audit.service.js";
import { CommerceEventType, CommerceEventSource } from "../generated/prisma/index.js";
import { CartService } from "../services/cart.service.js";
import {
  CartNotFoundError,
  EmptyCartError,
  InvalidCartStatusError,
  InsufficientStockError,
  ProductUnavailableError,
  VariantRequiredError,
  InvalidVariantError,
  OrderNotFoundError,
  IdempotencyConflictError,
  InvalidOrderStatusError,
} from "./order.errors.js";

export class OrderService {
  /**
   * Atomically creates an internal Order from an active Cart.
   * - Validates active products, stock, and variant requirements.
   * - Takes authoritative backend price snapshots.
   * - Enforces idempotency and unique cart-to-order mapping.
   * - Transitions Cart status from ACTIVE to CHECKOUT_PENDING.
   * - Returns order with status PENDING_PAYMENT.
   */
  static async createOrder(input: CreateOrderInput): Promise<OrderResponseData> {
    const { cartId, customerId: inputCustomerId, idempotencyKey } = input;

    if (!cartId || typeof cartId !== "string") {
      throw new CartNotFoundError("Valid cartId is required to create an order.");
    }

    // 1. Pre-transaction Idempotency check
    if (idempotencyKey && typeof idempotencyKey === "string" && idempotencyKey.trim().length > 0) {
      const existingByKey = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true },
      });

      if (existingByKey) {
        if (existingByKey.cartId === cartId) {
          return OrderMapper.toResponse(existingByKey);
        } else {
          throw new IdempotencyConflictError(
            "Idempotency key has already been used for a different cart."
          );
        }
      }
    }

    // 2. Pre-transaction Existing Pending Order for Cart check
    const existingByCart = await prisma.order.findFirst({
      where: { cartId, status: "PENDING_PAYMENT" },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    if (existingByCart) {
      return OrderMapper.toResponse(existingByCart);
    }

    // 3. Atomic Database Transaction
    try {
      const createdOrder = await prisma.$transaction(async (tx) => {
        // Re-fetch Cart with full Product & Variant details
        const cart = await tx.cart.findUnique({
          where: { id: cartId },
          include: {
            customer: true,
            items: {
              include: {
                product: {
                  include: {
                    variants: true,
                  },
                },
                variant: true,
              },
            },
          },
        });

        if (!cart) {
          throw new CartNotFoundError("Cart not found.");
        }

        // Customer Identity Trust Invariant: Use authoritative cart.customerId
        if (inputCustomerId && cart.customerId !== inputCustomerId) {
          throw new CartNotFoundError("Cart does not belong to the authenticated customer.");
        }

        // Cart Status Guard
        if (cart.status !== "ACTIVE") {
          throw new InvalidCartStatusError(
            `Cart is not active for order creation (current status: ${cart.status}).`
          );
        }

        // Empty Cart Guard
        if (!cart.items || cart.items.length === 0) {
          throw new EmptyCartError("Cannot create an order from an empty cart.");
        }

        let subtotal = new Decimal("0.00");
        const itemSnapshots: any[] = [];

        // Validate each item, stock, variants, and pricing
        for (const item of cart.items) {
          const product = item.product;

          // Product Active Guard
          if (!product || !product.active) {
            throw new ProductUnavailableError(
              `Product '${product?.name || item.productId}' is currently inactive or unavailable.`
            );
          }

          // Variant Requirement & Validity Guard
          const activeVariants = (product.variants || []).filter((v) => v.active);
          const hasActiveVariants = activeVariants.length > 0;

          if (hasActiveVariants && !item.variantId) {
            throw new VariantRequiredError(
              `Product '${product.name}' requires a variant selection before checkout.`
            );
          }

          if (item.variantId) {
            const variant = item.variant;
            if (!variant || !variant.active || variant.productId !== product.id) {
              throw new InvalidVariantError(
                `Selected variant for product '${product.name}' is invalid or inactive.`
              );
            }
          }

          // Authoritative Stock Selection: Variant stock for variant items, Product stock for non-variant items
          const authoritativeStock = item.variantId ? item.variant!.stock : product.stock;

          if (authoritativeStock <= 0) {
            throw new InsufficientStockError(`Product '${product.name}' is out of stock.`);
          }

          if (item.quantity > authoritativeStock) {
            throw new InsufficientStockError(
              `Requested quantity (${item.quantity}) for '${product.name}' exceeds available stock (${authoritativeStock}).`
            );
          }

          // Authoritative Price Selection: variant.price (if non-null) fallback to product.price
          const unitPrice =
            item.variantId && item.variant?.price ? item.variant.price : product.price;

          const totalPrice = unitPrice.mul(item.quantity);
          subtotal = subtotal.add(totalPrice);

          itemSnapshots.push({
            productId: product.id,
            productName: product.name,
            sku: item.variant?.sku || null,
            variantId: item.variantId || null,
            variantName: item.variant?.name || null,
            quantity: item.quantity,
            unitPrice,
            totalPrice,
            source: (item as any).source || "DIRECT",
            sourceEventId: (item as any).sourceEventId || null,
          });
        }

        const shippingCharge = new Decimal("0.00");
        const total = subtotal.add(shippingCharge);
        const orderNumber = generateOrderNumber();

        // Create Order and OrderItem snapshots atomically
        const order = await tx.order.create({
          data: {
            orderNumber,
            idempotencyKey: idempotencyKey || null,
            customerId: cart.customerId,
            cartId: cart.id,
            status: "PENDING_PAYMENT",
            subtotal,
            shippingCharge,
            total,
            currency: "INR",
            items: {
              create: itemSnapshots,
            },
          },
          include: {
            items: true,
          },
        });

        // Atomically transition Cart status from ACTIVE to CHECKOUT_PENDING
        await tx.cart.update({
          where: { id: cart.id },
          data: { status: "CHECKOUT_PENDING" },
        });

        // Record ORDER_CREATED audit event inside transaction
        await AuditService.recordEvent(
          {
            eventKey: `order-created:${order.id}`,
            type: CommerceEventType.ORDER_CREATED,
            source: CommerceEventSource.SYSTEM,
            customerId: cart.customerId,
            cartId: cart.id,
            orderId: order.id,
            metadata: {
              orderNumber: order.orderNumber,
              total: order.total.toString(),
              itemCount: order.items.length,
            },
          },
          tx
        );

        return order;
      });

      return OrderMapper.toResponse(createdOrder);
    } catch (err: any) {
      // Prisma Unique Race Condition Catch (P2002 on cartId or idempotencyKey)
      if (err.code === "P2002") {
        const existingRaceOrder = await prisma.order.findFirst({
          where: {
            OR: [
              ...(idempotencyKey ? [{ idempotencyKey }] : []),
              { cartId },
            ],
          },
          include: { items: true },
        });

        if (existingRaceOrder) {
          return OrderMapper.toResponse(existingRaceOrder);
        }
      }
      throw err;
    }
  }

  /**
   * Retrieves an Order by its internal UUID id.
   */
  static async getOrderById(orderId: string, customerId?: string): Promise<OrderResponseData> {
    if (!orderId) {
      throw new OrderNotFoundError("Order ID is required.");
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new OrderNotFoundError(`Order with ID '${orderId}' not found.`);
    }

    if (customerId && order.customerId !== customerId) {
      throw new OrderNotFoundError(`Order not found or access unauthorized.`);
    }

    return OrderMapper.toResponse(order);
  }

  /**
   * Retrieves an Order by its unique orderNumber string (e.g. MRC-20260830-7A9F2E4B).
   */
  static async getOrderByNumber(orderNumber: string, customerId?: string): Promise<OrderResponseData> {
    if (!orderNumber) {
      throw new OrderNotFoundError("Order number is required.");
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      throw new OrderNotFoundError(`Order '${orderNumber}' not found.`);
    }

    if (customerId && order.customerId !== customerId) {
      throw new OrderNotFoundError(`Order not found or access unauthorized.`);
    }

    return OrderMapper.toResponse(order);
  }

  /**
   * Controlled cancellation of an unpaid pending checkout.
   * Atomically transitions Order: PENDING_PAYMENT -> CANCELLED, and Cart: CHECKOUT_PENDING -> ACTIVE.
   * Rejects if the Order is already PAID or not in PENDING_PAYMENT status.
   */
  static async cancelPendingCheckout(
    targetId: string,
    customerId?: string
  ): Promise<{ order: OrderResponseData; cart: any }> {
    if (!targetId) {
      throw new OrderNotFoundError("Order ID or Cart ID is required.");
    }

    // Try finding order by ID first, fallback to pending order by cartId
    let order = await prisma.order.findUnique({
      where: { id: targetId },
      include: { items: true },
    });

    if (!order) {
      order = await prisma.order.findFirst({
        where: { cartId: targetId, status: "PENDING_PAYMENT" },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!order) {
      throw new OrderNotFoundError(`No pending order found for ID '${targetId}'.`);
    }

    if (customerId && order.customerId !== customerId) {
      throw new OrderNotFoundError(`Order not found or access unauthorized.`);
    }

    if (order.status === "PAID") {
      throw new InvalidOrderStatusError("Cannot cancel a paid order.");
    }

    if (order.status !== "PENDING_PAYMENT") {
      throw new InvalidOrderStatusError(
        `Cannot cancel checkout for order with status '${order.status}'. Only PENDING_PAYMENT orders can be cancelled.`
      );
    }

    // Atomic transaction: Order PENDING_PAYMENT -> CANCELLED, Cart CHECKOUT_PENDING -> ACTIVE
    const [updatedOrder, updatedCart] = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
        include: { items: true },
      });

      let c = null;
      if (order.cartId) {
        c = await tx.cart.update({
          where: { id: order.cartId },
          data: { status: "ACTIVE" },
        });
      }

      return [o, c];
    });

    // Fetch formatted cart response if cart was updated
    let formattedCart = null;
    if (order.cartId) {
      formattedCart = await CartService.getCart(order.cartId);
    }

    return {
      order: OrderMapper.toResponse(updatedOrder),
      cart: formattedCart,
    };
  }
}

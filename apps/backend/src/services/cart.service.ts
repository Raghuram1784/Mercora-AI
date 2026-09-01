import { prisma, Decimal } from "../config/database.js";
import { AddCartItemInput } from "../types/cart.types.js";
import { ConflictError, NotFoundError } from "./customer.service.js";
import { AuditService } from "../audit/audit.service.js";
import { CommerceEventType, CommerceEventSource } from "../generated/prisma/index.js";

export class CartService {
  static async createOrGetActiveCart(customerId: string) {
    // Validate customer exists and is active in a transaction
    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new NotFoundError("CUSTOMER_NOT_FOUND: Customer not found.");
      }

      if (!customer.active) {
        throw new ConflictError("CUSTOMER_INACTIVE: Customer is inactive.");
      }

      // Check for active cart
      const existingCart = await tx.cart.findFirst({
        where: { customerId, status: "ACTIVE" },
      });

      if (existingCart) {
        return existingCart;
      }

      // Create new active cart
      return tx.cart.create({
        data: { customerId, status: "ACTIVE" },
      });
    });
  }

  static async getCart(cartId: string) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
          },
        },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundError("CART_NOT_FOUND: Cart not found.");
    }

    let subtotal = new Decimal("0.00");
    let itemCount = 0;

    const items = cart.items.map((item) => {
      // 1. Availability check
      let available = true;
      let reason = "AVAILABLE";
      let availableStock = 0;

      if (!item.product || !item.product.active) {
        available = false;
        reason = "PRODUCT_INACTIVE";
      } else if (item.variantId && (!item.variant || !item.variant.active)) {
        available = false;
        reason = "VARIANT_INACTIVE";
      } else {
        const stock = item.variantId ? item.variant!.stock : item.product.stock;
        availableStock = stock;
        if (stock === 0) {
          available = false;
          reason = "OUT_OF_STOCK";
        } else if (item.quantity > stock) {
          available = false;
          reason = "INSUFFICIENT_STOCK";
        }
      }

      // 2. Pricing selection: variant.price (if non-null) fallback to product.price
      const unitPrice =
        item.variantId && item.variant?.price
          ? item.variant.price
          : item.product.price;

      const lineTotal = unitPrice.mul(item.quantity);

      if (available) {
        subtotal = subtotal.add(lineTotal);
        itemCount += item.quantity;
      }

      return {
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
        },
        variant: item.variantId
          ? {
              id: item.variant!.id,
              name: item.variant!.name,
              sku: item.variant!.sku,
            }
          : null,
        quantity: item.quantity,
        unitPrice: unitPrice.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
        availability: {
          available,
          reason,
          stock: availableStock,
        },
      };
    });

    return {
      id: cart.id,
      status: cart.status,
      customer: {
        id: cart.customer.id,
        name: cart.customer.name,
      },
      items,
      summary: {
        itemCount,
        subtotal: subtotal.toFixed(2),
        currency: "INR",
      },
    };
  }

  static async addCartItem(cartId: string, data: AddCartItemInput) {
    const { productId, variantId, quantity } = data;

    return prisma.$transaction(async (tx) => {
      // 1. Validate Cart exists and is ACTIVE
      const cart = await tx.cart.findUnique({
        where: { id: cartId },
      });

      if (!cart) {
        throw new NotFoundError("CART_NOT_FOUND: Cart not found.", "CART_NOT_FOUND");
      }

      if (cart.status !== "ACTIVE") {
        throw new ConflictError("CART_NOT_ACTIVE: Item cannot be added to a non-active cart.", "CART_NOT_ACTIVE");
      }

      // 2. Validate Product exists and is active
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product || !product.active) {
        throw new NotFoundError("PRODUCT_NOT_FOUND: Product is either inactive or does not exist.", "PRODUCT_NOT_FOUND");
      }

      // Enforce variant required constraint if active variants exist
      const activeVariantCount = await tx.productVariant.count({
        where: { productId, active: true },
      });

      if (activeVariantCount > 0 && !variantId) {
        throw new ConflictError(
          "VARIANT_REQUIRED: Product contains active variants. A specific variant configuration must be selected.",
          "VARIANT_REQUIRED"
        );
      }

      // 3. Validate Variant if supplied
      let variantStock = product.stock;
      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
        });

        if (!variant || !variant.active) {
          throw new NotFoundError("VARIANT_NOT_FOUND: Variant is either inactive or does not exist.", "VARIANT_NOT_FOUND");
        }

        if (variant.productId !== product.id) {
          throw new ConflictError("VARIANT_PRODUCT_MISMATCH: Variant does not belong to the requested product.", "VARIANT_PRODUCT_MISMATCH");
        }

        variantStock = variant.stock;
      }

      // 4. Check for existing item with exact same product and variant config
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId,
          productId,
          variantId: variantId || null,
        },
      });

      const targetQuantity = existingItem
        ? existingItem.quantity + quantity
        : quantity;

      // 5. Stock validation against combined target quantity
      if (targetQuantity > variantStock) {
        throw new ConflictError("INSUFFICIENT_STOCK: The requested quantity exceeds currently available stock.", "INSUFFICIENT_STOCK");
      }

      // 6. Server-validate AI attribution claim
      const validatedAttribution = await AuditService.validateAttribution({
        customerId: cart.customerId,
        cartId: cart.id,
        productId: product.id,
        source: data.source,
        sourceEventId: data.sourceEventId,
      });

      const finalSource = validatedAttribution.source;
      const finalSourceEventId = validatedAttribution.sourceEventId || null;

      // 7. Calculate accepted uplift & record audit event if validated AI attribution
      if (validatedAttribution.valid && finalSource !== "DIRECT") {
        let acceptedUplift: number | undefined = undefined;
        let eventType: CommerceEventType = CommerceEventType.AI_ITEM_ADDED_TO_CART;

        const effectiveUnitPrice = Number(product.price);
        const lineItemValue = effectiveUnitPrice * quantity;

        if (finalSource === "AI_CROSS_SELL") {
          eventType = CommerceEventType.CROSS_SELL_ACCEPTED;
          acceptedUplift = lineItemValue;
        } else if (finalSource === "AI_ACCESSORY") {
          eventType = CommerceEventType.ACCESSORY_ACCEPTED;
          acceptedUplift = lineItemValue;
        } else if (finalSource === "AI_UPSELL") {
          eventType = CommerceEventType.UPSELL_ACCEPTED;
          const sourceProdId = validatedAttribution.event?.sourceProductId;
          if (sourceProdId) {
            const sourceProd = await tx.product.findUnique({ where: { id: sourceProdId } });
            if (sourceProd && Number(product.price) > Number(sourceProd.price)) {
              acceptedUplift = (Number(product.price) - Number(sourceProd.price)) * quantity;
            }
          }
        }

        await AuditService.recordEvent(
          {
            type: eventType,
            source: CommerceEventSource.CUSTOMER,
            merchantId: product.merchantId,
            customerId: cart.customerId,
            cartId: cart.id,
            productId: product.id,
            sourceProductId: validatedAttribution.event?.sourceProductId || null,
            targetProductId: product.id,
            acceptedUplift,
            metadata: {
              sourceEventId: finalSourceEventId,
              quantity,
            },
          },
          tx
        );
      }

      if (existingItem) {
        return tx.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: targetQuantity,
            source: finalSource as any,
            sourceEventId: finalSourceEventId,
          },
        });
      } else {
        return tx.cartItem.create({
          data: {
            cartId,
            productId,
            variantId: variantId || null,
            quantity,
            source: finalSource as any,
            sourceEventId: finalSourceEventId,
          },
        });
      }
    });
  }

  static async updateCartItem(cartId: string, itemId: string, quantity: number) {
    return prisma.$transaction(async (tx) => {
      // 1. Validate Cart exists and is ACTIVE
      const cart = await tx.cart.findUnique({
        where: { id: cartId },
      });

      if (!cart) {
        throw new NotFoundError("CART_NOT_FOUND: Cart not found.");
      }

      if (cart.status !== "ACTIVE") {
        throw new ConflictError("CART_NOT_ACTIVE: Cart is not active.");
      }

      // 2. Validate CartItem exists and belongs to the cart
      const item = await tx.cartItem.findUnique({
        where: { id: itemId },
        include: { product: true, variant: true },
      });

      if (!item || item.cartId !== cartId) {
        throw new NotFoundError("CART_ITEM_NOT_FOUND: Cart item not found in the specified cart.");
      }

      // 3. Re-verify Product and Variant are active
      if (!item.product || !item.product.active) {
        throw new ConflictError("PRODUCT_INACTIVE: Product is currently inactive.");
      }

      if (item.variantId && (!item.variant || !item.variant.active)) {
        throw new ConflictError("VARIANT_INACTIVE: Variant is currently inactive.");
      }

      // 4. Validate stock limits
      const maxStock = item.variantId ? item.variant!.stock : item.product.stock;
      if (quantity > maxStock) {
        throw new ConflictError("INSUFFICIENT_STOCK: The requested quantity exceeds available stock.");
      }

      return tx.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    });
  }

  static async removeCartItem(cartId: string, itemId: string) {
    return prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { id: cartId },
      });

      if (!cart) {
        throw new NotFoundError("CART_NOT_FOUND: Cart not found.");
      }

      if (cart.status !== "ACTIVE") {
        throw new ConflictError("CART_NOT_ACTIVE: Cart is not active.");
      }

      const item = await tx.cartItem.findUnique({
        where: { id: itemId },
      });

      if (!item || item.cartId !== cartId) {
        throw new NotFoundError("CART_ITEM_NOT_FOUND: Cart item not found in the specified cart.");
      }

      return tx.cartItem.delete({
        where: { id: itemId },
      });
    });
  }
}

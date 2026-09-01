import { OrderResponseData, OrderItemResponse } from "./order.types.js";

export class OrderMapper {
  static toResponse(order: any): OrderResponseData {
    const items: OrderItemResponse[] = (order.items || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku || null,
      variantId: item.variantId || null,
      variantName: item.variantName || null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice).toFixed(2),
      totalPrice: Number(item.totalPrice).toFixed(2),
      source: item.source || "DIRECT",
      sourceEventId: item.sourceEventId || null,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      idempotencyKey: order.idempotencyKey || null,
      customerId: order.customerId,
      cartId: order.cartId || null,
      status: order.status,
      subtotal: Number(order.subtotal).toFixed(2),
      shippingCharge: Number(order.shippingCharge).toFixed(2),
      total: Number(order.total).toFixed(2),
      currency: order.currency || "INR",
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : String(order.updatedAt),
      items,
    };
  }
}

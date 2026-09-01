export class AuditMapper {
  static toEventDTO(event: any): any {
    return {
      id: event.id,
      eventKey: event.eventKey,
      type: event.type,
      source: event.source,
      merchantId: event.merchantId,
      customerId: event.customerId,
      cartId: event.cartId,
      orderId: event.orderId,
      paymentId: event.paymentId,
      productId: event.productId,
      sourceProductId: event.sourceProductId,
      targetProductId: event.targetProductId,
      suggestionType: event.suggestionType,
      potentialUplift: event.potentialUplift ? event.potentialUplift.toString() : null,
      acceptedUplift: event.acceptedUplift ? event.acceptedUplift.toString() : null,
      metadata: event.metadata || {},
      createdAt: event.createdAt ? event.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  static toEventListDTO(events: any[]): any[] {
    return events.map((e) => AuditMapper.toEventDTO(e));
  }
}

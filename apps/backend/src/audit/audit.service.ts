import { prisma } from "../config/database.js";
import { RecordCommerceEventInput, ValidateAttributionInput, ValidateAttributionResult } from "./audit.types.js";
import { CommerceEventType, CartItemSource } from "../generated/prisma/index.js";

const SENSITIVE_KEYS_REGEX = /secret|signature|hmac|password|token|auth|key_secret/i;

function sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
  if (!metadata) return undefined;
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS_REGEX.test(key)) {
      continue; // Never log secrets or signatures
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class AuditService {
  /**
   * Appends an audit event to the CommerceEvent ledger. Supports transaction clients and eventKey deduplication.
   */
  static async recordEvent(input: RecordCommerceEventInput, tx?: any): Promise<any> {
    const db = tx || prisma;

    if (input.eventKey) {
      const existing = await db.commerceEvent.findUnique({
        where: { eventKey: input.eventKey },
      });
      if (existing) {
        return existing;
      }
    }

    const sanitizedMeta = sanitizeMetadata(input.metadata);

    try {
      const event = await db.commerceEvent.create({
        data: {
          eventKey: input.eventKey || null,
          type: input.type,
          source: input.source,
          merchantId: input.merchantId || null,
          customerId: input.customerId || null,
          cartId: input.cartId || null,
          orderId: input.orderId || null,
          paymentId: input.paymentId || null,
          productId: input.productId || null,
          sourceProductId: input.sourceProductId || null,
          targetProductId: input.targetProductId || null,
          suggestionType: input.suggestionType || null,
          potentialUplift: input.potentialUplift !== undefined ? String(input.potentialUplift) : null,
          acceptedUplift: input.acceptedUplift !== undefined ? String(input.acceptedUplift) : null,
          metadata: sanitizedMeta || undefined,
        },
      });

      return event;
    } catch (err: any) {
      if (err.code === "P2002" && input.eventKey) {
        // Idempotent catch on unique eventKey race condition
        return db.commerceEvent.findUnique({ where: { eventKey: input.eventKey } });
      }
      console.error("AuditService.recordEvent error:", err);
      return null;
    }
  }

  /**
   * Server-validates AI attribution claims.
   * Never trusts client-supplied source without a valid matching CommerceEvent.
   */
  static async validateAttribution(input: ValidateAttributionInput): Promise<ValidateAttributionResult> {
    const { customerId, cartId, productId, source, sourceEventId } = input;

    // Direct items or missing attribution -> DIRECT
    if (!source || source === "DIRECT" || !sourceEventId || typeof sourceEventId !== "string" || sourceEventId.trim() === "") {
      return { valid: true, source: "DIRECT" };
    }

    // Must be a recognized AI source
    const recognizedSources: CartItemSource[] = [
      "AI_RECOMMENDATION",
      "AI_UPSELL",
      "AI_CROSS_SELL",
      "AI_ACCESSORY",
    ];

    if (!recognizedSources.includes(source as CartItemSource)) {
      return { valid: false, source: "DIRECT" };
    }

    // Fetch candidate source CommerceEvent from DB
    const event = await prisma.commerceEvent.findUnique({
      where: { id: sourceEventId },
    });

    if (!event) {
      return { valid: false, source: "DIRECT" };
    }

    // Validate ownership / session context
    if (customerId && event.customerId && event.customerId !== customerId) {
      return { valid: false, source: "DIRECT" };
    }
    if (cartId && event.cartId && event.cartId !== cartId) {
      return { valid: false, source: "DIRECT" };
    }

    // Validate event type matching
    const expectedTypeMap: Record<string, CommerceEventType[]> = {
      AI_RECOMMENDATION: [CommerceEventType.AI_RECOMMENDATION_RETURNED],
      AI_UPSELL: [CommerceEventType.UPSELL_SHOWN],
      AI_CROSS_SELL: [CommerceEventType.CROSS_SELL_SHOWN],
      AI_ACCESSORY: [CommerceEventType.ACCESSORY_SHOWN],
    };

    const allowedTypes = expectedTypeMap[source] || [];
    if (!allowedTypes.includes(event.type)) {
      return { valid: false, source: "DIRECT" };
    }

    // Validate product match
    let productMatch = false;
    if (event.targetProductId && event.targetProductId === productId) {
      productMatch = true;
    } else if (event.productId && event.productId === productId) {
      productMatch = true;
    } else if (event.metadata && typeof event.metadata === "object") {
      const meta = event.metadata as any;
      if (Array.isArray(meta.recommendedProductIds) && meta.recommendedProductIds.includes(productId)) {
        productMatch = true;
      } else if (Array.isArray(meta.productIds) && meta.productIds.includes(productId)) {
        productMatch = true;
      }
    }

    if (!productMatch) {
      return { valid: false, source: "DIRECT" };
    }

    return {
      valid: true,
      source: source as CartItemSource,
      sourceEventId: event.id,
      event,
    };
  }
}

import { groq } from "./groq.client.js";
import { config } from "../config/env.js";
import { SYSTEM_PROMPT } from "./prompts/system-prompt.js";
import { getGroqToolsConfig, executeTool } from "./tool-registry.js";
import { AgentHistoryMessage, ChatRequest, AgentAction, AgentTimings } from "./agent.types.js";
import { CartService } from "../services/cart.service.js";
import { ProductService } from "../services/product.service.js";
import { AuditService } from "../audit/audit.service.js";
import { CommerceEventType, CommerceEventSource } from "../generated/prisma/index.js";

export class AgentService {
  static async processMessage(req: ChatRequest): Promise<{
    message: string;
    actions: AgentAction[];
    products?: any[];
    pendingAction?: any;
    cart?: any;
    timings?: AgentTimings;
  }> {
    const { message, customerId, cartId, history = [] } = req;

    console.log(`[AgentService] Processing message: "${message}", customerId: ${customerId || "none"}, cartId: ${cartId || "none"}`);

    // 1. Validate Customer-Cart Ownership beforehand if both are supplied
    if (customerId && cartId) {
      try {
        const cart = await CartService.getCart(cartId);
        if (cart.customer.id !== customerId) {
          throw new Error("Cart does not belong to the supplied customer.");
        }
      } catch (err: any) {
        console.error(`[AgentService] Ownership validation failed: ${err.message}`);
        throw new Error(`Cart ownership validation failed: ${err.message}`);
      }
    }

    // 2. Enforce limits: max 10 history messages
    let sanitizedHistory = history.slice(-10);

    // Remove duplicate trailing user message if history accidentally includes the current user message
    if (
      sanitizedHistory.length > 0 &&
      sanitizedHistory[sanitizedHistory.length - 1].role === "user" &&
      sanitizedHistory[sanitizedHistory.length - 1].content.trim() === message.trim()
    ) {
      sanitizedHistory = sanitizedHistory.slice(0, -1);
    }

    // 3. Evaluate Cart Action Intent Authorization Gate
    // Check if the current user message contains explicit cart modification intent
    const cleanMsg = message.toLowerCase();
    const hasDirectIntent = 
      cleanMsg.includes("add") || 
      cleanMsg.includes("cart") || 
      cleanMsg.includes("buy") || 
      cleanMsg.includes("take") || 
      cleanMsg.includes("put") || 
      cleanMsg.includes("get") ||
      cleanMsg.includes("do it") ||
      cleanMsg.includes("go ahead") ||
      // Direct positive answers
      cleanMsg === "yes" || cleanMsg === "yep" || cleanMsg === "yeah" || cleanMsg === "sure" || cleanMsg === "ok" || cleanMsg === "okay";

    // Check if the last assistant message prompted for a choice/confirmation
    const lastAssistantMsg = sanitizedHistory
      .filter((m) => m.role === "assistant")
      .pop()?.content?.toLowerCase() || "";

    const isRespondingToChoice = 
      lastAssistantMsg.includes("choose") || 
      lastAssistantMsg.includes("select") || 
      lastAssistantMsg.includes("variant") || 
      lastAssistantMsg.includes("option") ||
      lastAssistantMsg.includes("color") ||
      lastAssistantMsg.includes("would you like");

    const isAuthorized = hasDirectIntent || isRespondingToChoice;

    // 4. Construct message payload for Groq
    const currentMessages: any[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n[SESSION_CONTEXT]\n- Customer ID: ${customerId || "unknown"}\n- Active Cart ID: ${cartId || "unknown"}` },
      ...sanitizedHistory.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name,
        tool_call_id: m.tool_call_id,
        tool_calls: m.tool_calls,
      })),
      { role: "user", content: message },
    ];

    const actions: AgentAction[] = [];
    const resolvedProductsMap = new Map<string, any>();
    let attemptedProductId: string | null = null;
    let pendingAction: any = null;
    let cartData: any = null;

    // Timing instrumentation (development-only breakdown)
    const startTime = performance.now();
    let initialGroqMs = 0;
    let finalGroqMs = 0;
    const toolsMs: Record<string, number> = {};

    let rounds = 0;
    const maxRounds = 4;

    while (rounds < maxRounds) {
      rounds++;
      console.log(`[AgentService] Tool Loop Round ${rounds}/${maxRounds}`);

      // Call Groq (with bounded exponential backoff for 429 and transient 5xx, max 2 retries)
      let response;
      const MAX_RETRIES = 2;
      const BASE_DELAY_MS = 2000;
      const MAX_DELAY_MS = 8000;

      const groqCallStart = performance.now();

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          response = await groq.chat.completions.create({
            model: config.GROQ_MODEL,
            messages: currentMessages,
            tools: getGroqToolsConfig(),
            tool_choice: "auto",
            temperature: 0.1,
            max_tokens: 350,
          });
          break;
        } catch (err: any) {
          const status = err?.status || err?.statusCode;
          const isRateLimit = status === 429;
          const isTransient5xx = typeof status === "number" && status >= 500 && status < 600;
          const shouldRetry = (isRateLimit || isTransient5xx) && attempt < MAX_RETRIES;

          if (shouldRetry) {
            // Increasing delay with exponential backoff + jitter, capped
            const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt);
            const jitter = Math.floor(Math.random() * 500);
            const delay = Math.min(exponentialDelay + jitter, MAX_DELAY_MS);

            console.warn(
              `[AgentService] ${isRateLimit ? "Rate limit (429)" : `Transient server error (${status})`} from Groq. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            // Non-transient client errors (400, 401, 403, 404) or exhausted retries fail fast
            console.error(
              `[AgentService] Unretryable Groq error (status: ${status}): ${err.message}`
            );
            throw err;
          }
        }
      }

      const groqCallDuration = performance.now() - groqCallStart;
      if (rounds === 1) {
        initialGroqMs = groqCallDuration;
      } else {
        finalGroqMs += groqCallDuration;
      }

      if (!response || !response.choices || response.choices.length === 0) {
        throw new Error("Received empty completion response from Groq.");
      }

      const responseMessage = response.choices[0].message;

      // Append assistant's response to messages list
      currentMessages.push(responseMessage);

      // Check if LLM requested function calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          const name = toolCall.function.name;
          const rawArgs = toolCall.function.arguments;
          let args: any = {};

          try {
            args = JSON.parse(rawArgs);
          } catch (e) {
            console.error(`[AgentService] Failed to parse tool args: ${rawArgs}`);
          }

          console.log(`[AgentService] Tool requested: "${name}" with args:`, args);

          // Enforce cart mutation gate at authorization level
          if (name === "add_to_cart" && !isAuthorized) {
            console.log(`[AgentService] Cart mutation BLOCKED due to ambiguous intent.`);
            attemptedProductId = args.productId;
            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name,
              content: JSON.stringify({
                success: false,
                error: "AMBIGUOUS_INTENT",
                message: "Cart action blocked. The user has not explicitly authorized adding this item to the cart. Please recommend the product and ask the user to confirm if they want to add it to their cart.",
              }),
            });
            actions.push({
              tool: name,
              status: "failure",
              summary: "Add to cart blocked: Ambiguous customer intent",
            });
            continue;
          }

          // Enforce variant selection gate for products with active variants
          if (name === "add_to_cart" && args.productId) {
            try {
              const prod = await ProductService.getProductById(args.productId);
              if (prod && prod.variants && prod.variants.length > 0) {
                const variantMatch = args.variantId && prod.variants.some((v) =>
                  v.id === args.variantId && (
                    cleanMsg.includes(v.name.toLowerCase()) ||
                    cleanMsg.includes(v.sku.toLowerCase()) ||
                    Object.values(v.attributes || {}).some((val) => typeof val === "string" && cleanMsg.includes(val.toLowerCase()))
                  )
                );

                if (!variantMatch) {
                  attemptedProductId = args.productId;
                  console.log(`[AgentService] add_to_cart requires explicit user variant selection for ${args.productId}`);
                  currentMessages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name,
                    content: JSON.stringify({
                      success: false,
                      error: "VARIANT_REQUIRED",
                      message: "Product contains active variants. Please ask the user to select a variant option.",
                    }),
                  });
                  actions.push({
                    tool: name,
                    status: "failure",
                    summary: "Add to cart requires explicit variant selection",
                  });
                  continue;
                }
              }
            } catch (e) {
              console.error("[AgentService] Failed to validate variant gate:", e);
            }
          }

          // Enforce order creation gate at authorization level
          const hasOrderIntent =
            cleanMsg.includes("order") ||
            cleanMsg.includes("checkout") ||
            cleanMsg.includes("proceed") ||
            cleanMsg.includes("buy now") ||
            cleanMsg.includes("place order");

          if (name === "create_order" && !hasOrderIntent) {
            console.log(`[AgentService] Order creation BLOCKED due to unconfirmed order intent.`);
            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name,
              content: JSON.stringify({
                success: false,
                error: "AMBIGUOUS_INTENT",
                message: "Order creation blocked. The user has not explicitly requested to create an order or proceed to checkout.",
              }),
            });
            actions.push({
              tool: name,
              status: "failure",
              summary: "Create order blocked: Requires explicit customer order intent",
            });
            continue;
          }

          // Record AI_RECOMMENDATION_REQUESTED when recommend_products is invoked
          if (name === "recommend_products") {
            await AuditService.recordEvent({
              type: CommerceEventType.AI_RECOMMENDATION_REQUESTED,
              source: CommerceEventSource.AI,
              customerId,
              cartId,
              metadata: {
                category: args.category,
                maxPrice: args.maxPrice,
                useCases: args.useCases,
                desiredFeatures: args.desiredFeatures,
              },
            });
          }

          // Execute Tool
          const toolStart = performance.now();
          try {
            const toolResult = await executeTool(name, args, { customerId, cartId });
            const toolDuration = performance.now() - toolStart;
            toolsMs[name] = (toolsMs[name] || 0) + toolDuration;
            console.log(`[AgentService] Tool "${name}" succeeded (${toolDuration.toFixed(1)}ms)`);
            
            // Record AI_RECOMMENDATION_RETURNED only after deterministic results are successfully produced
            if (name === "recommend_products" && toolResult?.recommendations && Array.isArray(toolResult.recommendations)) {
              const recProductIds = toolResult.recommendations.map((r: any) => r.product?.id).filter(Boolean);
              const topProduct = toolResult.recommendations[0]?.product;

              const recEvent = await AuditService.recordEvent({
                type: CommerceEventType.AI_RECOMMENDATION_RETURNED,
                source: CommerceEventSource.AI,
                merchantId: topProduct?.merchantId,
                customerId,
                cartId,
                productId: topProduct?.id,
                metadata: {
                  category: args.category,
                  maxPrice: args.maxPrice,
                  resultCount: toolResult.recommendations.length,
                  recommendedProductIds: recProductIds,
                  topProductId: topProduct?.id,
                },
              });

              for (const rec of toolResult.recommendations) {
                const p = rec.product;
                if (p && p.id) {
                  resolvedProductsMap.set(p.id, {
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    category: p.category,
                    price: p.price,
                    rating: p.rating,
                    imageUrl: p.imageUrl,
                    hasVariants: p.hasVariants,
                    source: "recommendation",
                    aiAttributionSource: "AI_RECOMMENDATION",
                    sourceEventId: recEvent?.id,
                    rank: rec.rank,
                    score: rec.score,
                    label: rec.label,
                    reasons: rec.reasons,
                  });
                }
              }
            }

            // Capture & record UPSELL_SHOWN results
            if (name === "get_upsell_suggestions" && toolResult?.upsells && Array.isArray(toolResult.upsells)) {
              for (const u of toolResult.upsells) {
                const p = u.targetProduct;
                const sourceP = u.sourceProduct;
                const potentialDelta = u.potentialUplift || (p && sourceP ? Number(p.price) - Number(sourceP.price) : undefined);

                const upsellEvent = await AuditService.recordEvent({
                  type: CommerceEventType.UPSELL_SHOWN,
                  source: CommerceEventSource.AI,
                  merchantId: p?.merchantId,
                  customerId,
                  cartId,
                  sourceProductId: sourceP?.id,
                  targetProductId: p?.id,
                  suggestionType: "UPSELL",
                  potentialUplift: potentialDelta,
                  metadata: {
                    improvements: u.improvements || [],
                  },
                });

                if (p && p.id && !resolvedProductsMap.has(p.id)) {
                  resolvedProductsMap.set(p.id, {
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    category: p.category,
                    price: p.price,
                    rating: p.rating,
                    imageUrl: p.imageUrl,
                    hasVariants: p.hasVariants,
                    source: "upsell",
                    aiAttributionSource: "AI_UPSELL",
                    sourceEventId: upsellEvent?.id,
                    score: u.score,
                    label: "Upgrade Available",
                    reasons: u.improvements || [],
                  });
                }
              }
            }

            // Capture & record CROSS_SELL_SHOWN and ACCESSORY_SHOWN results
            if (name === "get_cross_sell_suggestions" && toolResult?.crossSells && Array.isArray(toolResult.crossSells)) {
              for (const cs of toolResult.crossSells) {
                const p = cs.targetProduct;
                const sourceP = cs.sourceProduct;
                const relType = (cs.type === "ACCESSORY" || cs.relationType === "ACCESSORY") ? "ACCESSORY" : "CROSS_SELL";
                const eventType = relType === "ACCESSORY" ? CommerceEventType.ACCESSORY_SHOWN : CommerceEventType.CROSS_SELL_SHOWN;

                const csEvent = await AuditService.recordEvent({
                  type: eventType,
                  source: CommerceEventSource.AI,
                  merchantId: p?.merchantId,
                  customerId,
                  cartId,
                  sourceProductId: sourceP?.id,
                  targetProductId: p?.id,
                  suggestionType: relType as any,
                  potentialUplift: p?.price ? Number(p.price) : undefined,
                  metadata: {
                    relationType: relType,
                    reason: cs.reason,
                  },
                });

                if (p && p.id && !resolvedProductsMap.has(p.id)) {
                  resolvedProductsMap.set(p.id, {
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    category: p.category,
                    price: p.price,
                    rating: p.rating,
                    imageUrl: p.imageUrl,
                    hasVariants: p.hasVariants,
                    source: relType === "ACCESSORY" ? "accessory" : "cross-sell",
                    aiAttributionSource: relType === "ACCESSORY" ? "AI_ACCESSORY" : "AI_CROSS_SELL",
                    sourceEventId: csEvent?.id,
                    label: relType === "ACCESSORY" ? "Recommended Accessory" : "Pairs Great With This",
                    reasons: cs.reason ? [cs.reason] : [],
                  });
                }
              }
            }

            // Capture search results & record AI_RECOMMENDATION_RETURNED audit event
            if (name === "search_products" && toolResult?.products && Array.isArray(toolResult.products) && toolResult.products.length > 0) {
              const recProductIds = toolResult.products.map((p: any) => p.id).filter(Boolean);
              const topProduct = toolResult.products[0];

              const recEvent = await AuditService.recordEvent({
                type: CommerceEventType.AI_RECOMMENDATION_RETURNED,
                source: CommerceEventSource.AI,
                merchantId: topProduct?.merchantId,
                customerId,
                cartId,
                productId: topProduct?.id,
                metadata: {
                  searchQuery: args.search,
                  category: args.category,
                  maxPrice: args.maxPrice,
                  resultCount: toolResult.products.length,
                  recommendedProductIds: recProductIds,
                  topProductId: topProduct?.id,
                },
              });

              for (const p of toolResult.products) {
                if (!resolvedProductsMap.has(p.id)) {
                  resolvedProductsMap.set(p.id, {
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    category: p.category,
                    price: p.price,
                    rating: p.rating,
                    imageUrl: p.imageUrl,
                    hasVariants: p.hasVariants,
                    source: "recommendation",
                    aiAttributionSource: "AI_RECOMMENDATION",
                    sourceEventId: recEvent?.id,
                  });
                }
              }
            }

            // Capture single product details
            if (name === "get_product_details" && toolResult?.product) {
              const p = toolResult.product;
              resolvedProductsMap.set(p.id, {
                id: p.id,
                name: p.name,
                brand: p.brand,
                category: p.category,
                price: p.price,
                rating: p.rating,
                imageUrl: p.imageUrl,
                hasVariants: p.hasVariants,
                source: "details",
              });
            }

            // Capture cart state mutations
            if ((name === "add_to_cart" || name === "get_cart") && toolResult?.cart) {
              cartData = toolResult.cart;
            }

            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name,
              content: JSON.stringify(toolResult),
            });

            actions.push({
              tool: name,
              status: "success",
              summary: `Executed ${name} successfully.`,
            });
          } catch (err: any) {
            const toolDuration = performance.now() - toolStart;
            toolsMs[name] = (toolsMs[name] || 0) + toolDuration;
            console.error(`[AgentService] Tool "${name}" failed (${toolDuration.toFixed(1)}ms): ${err.message}`);
            if (name === "add_to_cart") {
              attemptedProductId = args.productId;
            }
            
            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name,
              content: JSON.stringify({
                success: false,
                error: err.code || "TOOL_EXECUTION_FAILED",
                message: err.message,
              }),
            });

            actions.push({
              tool: name,
              status: "failure",
              summary: `Failed to execute ${name}: ${err.message}`,
            });
          }
        }
      } else {
        // No more tool calls requested, we build output
        break;
      }
    }

    // Resolve structured products (deduplicated, capped at 6, concurrent resolution)
    const rawCandidateList = Array.from(resolvedProductsMap.values()).slice(0, 6);
    const finalProducts = await Promise.all(
      rawCandidateList.map(async (rp) => {
        const recMetadata = {
          source: rp.source,
          aiAttributionSource: rp.aiAttributionSource,
          sourceEventId: rp.sourceEventId,
          rank: rp.rank,
          score: rp.score,
          label: rp.label,
          reasons: rp.reasons,
        };

        if (rp.source === "details") {
          try {
            const fullProduct = await ProductService.getProductById(rp.id);
            if (fullProduct) {
              return {
                id: fullProduct.id,
                name: fullProduct.name,
                brand: fullProduct.brand,
                category: fullProduct.category,
                price: fullProduct.price,
                rating: fullProduct.rating,
                imageUrl: fullProduct.imageUrl,
                hasVariants: fullProduct.variants.length > 0,
                ...recMetadata,
              };
            }
          } catch (e) {
            console.error(`[AgentService] Failed to load full details for ${rp.id}:`, e);
          }
        }

        return {
          id: rp.id,
          name: rp.name,
          brand: rp.brand,
          category: rp.category,
          price: rp.price,
          rating: rp.rating,
          imageUrl: rp.imageUrl,
          hasVariants: Boolean(rp.hasVariants),
          ...recMetadata,
        };
      })
    );

    // Deterministic pendingAction SELECT_VARIANT Resolution
    let targetProductIdForVariant = attemptedProductId;

    if (!targetProductIdForVariant && (hasDirectIntent || isAuthorized)) {
      const candidateList = Array.from(resolvedProductsMap.values());

      if (candidateList.length === 1) {
        targetProductIdForVariant = candidateList[0].id;
      } else if (candidateList.length > 1) {
        const matched = candidateList.filter((p) => {
          const nameLower = p.name.toLowerCase();
          return (
            cleanMsg.includes(nameLower) ||
            nameLower.split(" ").some((w: string) => w.length > 3 && cleanMsg.includes(w))
          );
        });
        if (matched.length === 1) {
          targetProductIdForVariant = matched[0].id;
        }
      }

      if (!targetProductIdForVariant) {
        try {
          const { products: allProds } = await ProductService.getProducts({ limit: 100, offset: 0 });
          const matchedProds = allProds.filter((p: any) => {
            const nameLower = p.name.toLowerCase();
            return (
              cleanMsg.includes(nameLower) ||
              (nameLower.split(" ").length >= 2 &&
                cleanMsg.includes(nameLower.split(" ")[0]) &&
                cleanMsg.includes(nameLower.split(" ")[1]))
            );
          });
          if (matchedProds.length === 1) {
            targetProductIdForVariant = matchedProds[0].id;
          }
        } catch (e) {
          console.error("[AgentService] Catalog match lookup failed:", e);
        }
      }
    }

    if (targetProductIdForVariant) {
      try {
        const fullProd = await ProductService.getProductById(targetProductIdForVariant);
        if (fullProd && fullProd.variants && fullProd.variants.length > 0) {
          const executedAdd = actions.find(
            (a) => a.tool === "add_to_cart" && a.status === "success"
          );

          if (!executedAdd) {
            pendingAction = {
              type: "SELECT_VARIANT",
              productId: fullProd.id,
              productName: fullProd.name,
              variants: fullProd.variants.map((v) => ({
                id: v.id,
                name: v.name,
                sku: v.sku,
                price: v.price,
                stock: v.stock,
                attributes: v.attributes,
              })),
            };

            // Ensure target product is in finalProducts so frontend receives attribution & price metadata
            const existingInFinal = finalProducts.find((p) => p.id === fullProd.id);
            if (!existingInFinal) {
              const rp = resolvedProductsMap.get(fullProd.id);
              finalProducts.push({
                id: fullProd.id,
                name: fullProd.name,
                brand: fullProd.brand,
                category: fullProd.category,
                price: fullProd.price,
                rating: fullProd.rating,
                imageUrl: fullProd.imageUrl,
                hasVariants: true,
                source: rp?.source || "recommendation",
                aiAttributionSource: rp?.aiAttributionSource || "AI_RECOMMENDATION",
                sourceEventId: rp?.sourceEventId,
                rank: undefined,
                score: undefined,
                label: undefined,
                reasons: undefined,
              });
            }
          }
        }
      } catch (e) {
        console.error("[AgentService] Failed to build SELECT_VARIANT pendingAction:", e);
      }
    }

    // Pull active cart data to sync frontend cart context
    if (cartId && !cartData) {
      try {
        const currentCart = await CartService.getCart(cartId);
        cartData = {
          id: currentCart.id,
          status: currentCart.status,
          items: currentCart.items.map((item) => ({
            id: item.id,
            productId: item.product.id,
            productName: item.product.name,
            variantId: item.variant?.id || null,
            variantName: item.variant?.name || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            available: item.availability.available,
          })),
          summary: currentCart.summary,
        };
      } catch (e) {
        console.error("[AgentService] Failed to fetch cart context:", e);
      }
    }

    const finalResponseMsg = currentMessages[currentMessages.length - 1];
    const totalToolsMs = Object.values(toolsMs).reduce((sum, v) => sum + v, 0);
    const totalMs = performance.now() - startTime;

    const timings: AgentTimings = {
      initialGroqMs: Number(initialGroqMs.toFixed(1)),
      toolsMs: Object.fromEntries(
        Object.entries(toolsMs).map(([k, v]) => [k, Number(v.toFixed(1))])
      ),
      totalToolsMs: Number(totalToolsMs.toFixed(1)),
      finalGroqMs: Number(finalGroqMs.toFixed(1)),
      totalMs: Number(totalMs.toFixed(1)),
    };

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[AgentService Timing] Total: ${timings.totalMs}ms | Initial Groq: ${timings.initialGroqMs}ms | Tools: ${timings.totalToolsMs}ms | Final Groq: ${timings.finalGroqMs}ms`
      );
    }

    return {
      message: finalResponseMsg?.content || "",
      actions,
      products: finalProducts,
      pendingAction,
      cart: cartData,
      timings,
    };
  }
}

# Mercora AI - 5-Minute Pitch & Video Demo Script
## Razorpay AI Buildathon | Track 01 - AI Growth & Agentic Commerce

This document outlines the scene-by-scene recording script and narrative flow for the 5-minute public video pitch for **Mercora AI**.

---

## Pitch Structure Overview (5:00 Total Duration)

| Time | Section | Narrative Focus | Screen Visual |
|---|---|---|---|
| **0:00 - 0:20** | **Problem & Differentiator** | E-commerce friction vs. unconstrained LLM risk | Title slide + Mercora core value proposition |
| **0:20 - 0:40** | **More Than a Chatbot** | Separating conversational AI from backend commerce authority | Bounded Actions table & architecture concept |
| **0:40 - 2:20** | **Live Customer Flow** | AI request $\rightarrow$ deterministic recommendation $\rightarrow$ Add Travel Headphones $\rightarrow$ variant modal $\rightarrow$ explicit customer selection $\rightarrow$ cart $\rightarrow$ checkout $\rightarrow$ Razorpay Test Mode | Live storefront (`/shop`), Ask AI drawer, variant selection modal, Razorpay Test Checkout overlay |
| **2:20 - 3:05** | **Payment Verification & Analytics** | Payment verification $\rightarrow$ successful order $\rightarrow$ Merchant Dashboard $\rightarrow$ AI-Assisted Revenue $\rightarrow$ AI-Assisted Orders $\rightarrow$ CommerceEvent audit trail | Razorpay payment success $\rightarrow$ Order confirmation modal $\rightarrow$ Merchant Dashboard (`/merchant`) analytics cards |
| **3:05 - 3:40** | **Architecture & Authority Boundaries** | LLM interprets, Backend decides, Customer authorizes, Razorpay processes, Server verifies, Audit trail records | System Architecture Mermaid diagram & Security Controls |
| **3:40 - 4:15** | **Deterministic Recommendation & Decision Trace** | Mathematical 100-pt scoring & end-to-end decision trace | Recommendation engine scoring formula & Agent Decision Trace diagram |
| **4:15 - 4:40** | **Graceful Payment Failure Recovery** | Razorpay dismissal $\rightarrow$ `CHECKOUT_PENDING` $\rightarrow$ Retry Payment / Cancel Checkout | Dismiss Razorpay overlay $\rightarrow$ Order pending modal $\rightarrow$ Retry / Cancel actions |
| **4:40 - 4:55** | **Real Engineering Failure Story** | Multi-turn variant continuation issue $\rightarrow$ history/pending-state diagnosis $\rightarrow$ deterministic `SELECT_VARIANT` backend gate fix | Variant modal trigger & `SELECT_VARIANT` state flow |
| **4:55 - 5:00** | **Closing & Repository** | Summary & public GitHub repository link | Repository link + closing slide |

---

## Scene-by-Scene Script

### Scene 1: Problem Statement & Mercora Differentiator (0:00 - 0:20)
- **Voiceover**: *"Welcome to Mercora AI. Traditional e-commerce forces users through manual search filters, while letting a Generative AI agent independently set prices, override inventory, or execute payments introduces unacceptable commerce risk. Mercora AI resolves this through Bounded Agentic Commerce."*
- **Visual**: Title slide with logo, followed by Mercora differentiator overview.

### Scene 2: More Than a Shopping Chatbot (0:20 - 0:40)
- **Voiceover**: *"Mercora is more than a shopping chatbot. We deliberately separate probabilistic AI reasoning from deterministic commerce authority. The LLM interprets natural language intent and explains results, while backend services own recommendation ranking, inventory checks, pricing, cart mutations, order creation, payment verification, and merchant revenue attribution."*
- **Visual**: Show Bounded Money Actions comparison table.

### Scene 3: Live Customer Shopping Flow (0:40 - 2:20)
- **Voiceover**: *"Let us watch a live shopping interaction. A customer asks Mercora AI: 'Which headphones should I buy under ₹5,000 for travel?'. Groq extracts structured intent criteria, which is evaluated deterministically by our backend Recommendation Engine out of 100 points. Mercora recommends Travel Headphones with grounded 'Best Match' reasons. The customer types 'Add the Travel Headphones to my cart'. Because Travel Headphones contains active variants, the backend detects the product, generates a deterministic SELECT_VARIANT action, and opens our frontend variant modal. The customer explicitly selects the Red/Black variant and clicks Add to Cart. They proceed to checkout using Razorpay Test Mode."*
- **Visual**: Open storefront (`/shop`) $\rightarrow$ open Ask AI drawer $\rightarrow$ enter travel headphones prompt $\rightarrow$ view recommendations $\rightarrow$ ask to add item $\rightarrow$ show variant modal $\rightarrow$ select Red/Black $\rightarrow$ open cart drawer $\rightarrow$ launch Razorpay Test Checkout.

### Scene 4: Payment Verification & Merchant Analytics (2:20 - 3:05)
- **Voiceover**: *"Upon payment completion, Razorpay credentials and HMAC-SHA256 signatures are verified server-side before transitioning the internal order to PAID and converting the cart. On the Merchant Dashboard, store owners track Paid Revenue, Paid Orders, AI-Assisted Revenue, Accepted Growth, and an append-only CommerceEvent audit trail, providing auditable AI-assisted revenue attribution."*
- **Visual**: Complete test payment in Razorpay overlay $\rightarrow$ show order confirmation modal $\rightarrow$ navigate to `/merchant` $\rightarrow$ inspect revenue KPI cards, growth metrics, and audit log stream.

### Scene 5: Architecture & Authority Boundaries (3:05 - 3:40)
- **Voiceover**: *"Our architectural principle is: LLM interprets, Backend decides, Customer authorizes, Razorpay processes, Server verifies, Audit trail records. The LLM can never override stock, alter prices, calculate order totals, or mark orders paid."*
- **Visual**: System Architecture Mermaid diagram and security boundaries.

### Scene 6: Deterministic Recommendation & Agent Decision Trace (3:40 - 4:15)
- **Voiceover**: *"Mercora does not let the LLM fabricate rankings out of thin air. Candidates are scored across category match, budget, features, use case, ratings, and stock. Every transaction forms an auditable decision trace from intent parsing down to payment signature verification and merchant attribution."*
- **Visual**: Recommendation math scoring formula and Agent Decision Trace flowchart.

### Scene 7: Graceful Payment Failure Recovery (4:15 - 4:40)
- **Voiceover**: *"If a customer closes Razorpay before completing payment, Mercora does not treat the order as failed or paid. The internal order remains PENDING_PAYMENT, the cart stays safely CHECKOUT_PENDING, and the customer can either retry payment or cancel checkout to edit their cart. Delayed verifications for cancelled orders are rejected by the server."*
- **Visual**: Dismiss Razorpay modal $\rightarrow$ show pending order recovery modal with Retry Payment and Cancel Checkout buttons.

### Scene 8: Real Engineering Failure Story (4:40 - 4:55)
- **Voiceover**: *"During production testing, Mercora could correctly recommend a product, but a multi-turn add-to-cart request for products with variants exposed a continuation-state issue. The model could ask for a variant conversationally without producing the deterministic SELECT_VARIANT state, and the current user turn could also be duplicated in conversation history. Instead of adding more prompt logic, we moved variant selection behind a deterministic backend gate. The backend now resolves the authoritative product, detects real variants, and returns SELECT_VARIANT. The frontend opens the real variant modal using catalog variant IDs. This prevents the AI from guessing variants while preserving AI attribution through cart, order, and payment."*
- **Visual**: Screen recording or code diagram highlighting the deterministic `SELECT_VARIANT` backend gate and variant modal trigger.

### Scene 9: Closing & Repository (4:55 - 5:00)
- **Voiceover**: *"Mercora AI brings explainable, safe, and growth-oriented agentic commerce to life with Razorpay. Thank you!"*
- **Visual**: Public GitHub repository link (`https://github.com/Raghuram1784/Mercora-AI`) and closing slide.

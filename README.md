# Mercora AI - Agentic Commerce & Merchant Growth Platform

> **Razorpay AI Buildathon Submission**  
> **Track 01 - AI Growth & Agentic Commerce**

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test_Mode-blue.svg)](https://razorpay.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.0-indigo.svg)](https://www.prisma.io/)
[![Neon DB](https://img.shields.io/badge/Neon-PostgreSQL-green.svg)](https://neon.tech/)
[![Groq AI](https://img.shields.io/badge/Groq-openai%2Fgpt--oss--20b-violet.svg)](https://groq.com/)

---

## 🌐 Live Demo

- **Customer Storefront:** https://mercora-ai.vercel.app
- **Backend API:** https://mercora-ai-backend.vercel.app
- **Health Check:** https://mercora-ai-backend.vercel.app/api/health
- **Merchant Dashboard:** https://mercora-ai.vercel.app/merchant
- **GitHub Repository:** https://github.com/Raghuram1784/Mercora-AI

---

## 🎥 5-Minute Pitch Video

**Razorpay AI Buildathon Pitch Video:** `PITCH_VIDEO_LINK_PENDING`

> The final 5-minute walkthrough demonstrates the live customer journey, bounded agent behavior, deterministic recommendation and variant safety, Razorpay Test Mode payment, server-side payment verification, graceful failure handling, AI-assisted revenue attribution and the merchant audit trail.

---

## ⚡ Try Mercora in 60 Seconds

1. Open the [Mercora storefront](https://mercora-ai.vercel.app).
2. Open **Mercora AI** and ask:
   > Which headphones should I buy under ₹5000 for travel?
3. Ask:
   > Add the Travel Headphones to my cart
4. Select a product variant in the deterministic variant modal and add it to the cart.
5. Proceed to checkout using **Razorpay Test Mode**.
6. After payment verification, open the **Merchant Dashboard** at:
   https://mercora-ai.vercel.app/merchant
7. Inspect the paid order, AI-assisted revenue attribution, and CommerceEvent audit trail.

This single flow demonstrates conversational discovery, deterministic recommendation, explicit purchase authorization, authoritative variant selection, Razorpay payment verification, and server-validated AI revenue attribution.

---

## 📸 End-to-End Demo

The following are real screenshots from the deployed Mercora AI production demo operating with Razorpay Test Mode:

### 1. Customer Storefront

![Mercora AI Storefront](docs/screenshots/01-storefront.png)

*Production storefront where customers browse the catalog and launch the Mercora AI shopping assistant.*

### 2. AI Product Recommendation

![Mercora AI Recommendation](docs/screenshots/02-ai-recommendation.png)

*A natural-language shopping request is converted into structured criteria and processed by Mercora's deterministic recommendation engine.*

### 3. Explicit Authorization & Variant Safety

![Mercora Variant Safety](docs/screenshots/03-variant-safety.png)

*After the customer explicitly asks to add the product, Mercora requires an authoritative variant selection instead of allowing the AI to guess a product configuration.*

### 4. Razorpay Test Payment

![Razorpay Payment Success](docs/screenshots/04a-razorpay-payment-success.png)

*The customer successfully completes the payment through Razorpay Test Mode.*

### 5. Server-Verified Mercora Order

![Mercora Verified Order](docs/screenshots/04b-payment-verified-order-confirmed.png)

*Mercora verifies the Razorpay payment server-side before marking the internal order PAID and confirming the transaction.*

### 6. Merchant Analytics & Attribution

![Mercora Merchant Dashboard](docs/screenshots/05-merchant-dashboard.png)

*The merchant dashboard shows verified commerce performance, AI-assisted attribution, paid orders, revenue, growth metrics and audit evidence.*

> **End-to-end proof:** Customer intent → AI-assisted discovery → deterministic recommendation → explicit authorization → variant selection → cart → internal order → Razorpay Test payment → server verification → paid order → merchant attribution and audit trail.

---

## ✅ Why Mercora Clears the Track 01 Bar

| Razorpay Track 01 Requirement | Mercora Evidence |
|---|---|
| **Explainable money actions** | Recommendation reasons, deterministic rankings, backend-authoritative prices and order totals |
| **Bounded AI behavior** | The LLM cannot set prices, override stock, mark payments successful, or directly mutate financial state |
| **Explicit gating** | Cart mutations, variant selection, checkout, and Razorpay payment require customer authorization |
| **Audit trail** | Append-only `CommerceEvent` records trace recommendation, cart, order, payment and conversion events |
| **Graceful failure recovery** | Razorpay dismissal preserves `PENDING_PAYMENT` / `CHECKOUT_PENDING` state with retry and cancel recovery paths |
| **Merchant growth** | Upsells, cross-sells, AI-assisted orders, AI-assisted revenue and accepted growth are tracked separately |
| **Working end-to-end build** | Public Vercel storefront, Express backend, Neon PostgreSQL and Razorpay Test Mode are deployed and functional |

---

## 📌 Executive Summary & Pitch

**Mercora AI** is an agentic commerce platform that enables customers to discover products conversationally, receive mathematically ranked recommendations, approve personalized growth suggestions (upsells & cross-sells), and complete secure checkouts through **Razorpay Test Mode**.

For merchants, Mercora provides auditable, server-validated AI revenue attribution, AI-assisted order tracking, accepted growth metrics, payment completion analytics, and an append-only `CommerceEvent` audit trail.

---

## 💥 The Problem

1. **E-Commerce Discovery Friction**: Traditional search requires shoppers to manually browse dozens of pages, compare specifications across tabs, and build carts step-by-step.
2. **Unconstrained LLM Financial Risk**: Allowing a Generative AI agent to independently set prices, override stock, or autonomously trigger financial payments introduces unacceptable commerce risk.
3. **Unexplainable AI Efficacy**: Merchants lack proof that AI recommendations drive genuine top-line revenue rather than merely generating conversational chatter.

---

## 🚀 The Mercora Solution

Mercora resolves this dilemma through **Bounded Agentic Commerce**:

$$\text{Natural Language Intent} \xrightarrow{\text{LLM}} \text{Intent Parsing} \xrightarrow{\text{Backend}} \text{Deterministic Tools} \xrightarrow{\text{User}} \text{Explicit Approval} \xrightarrow{\text{Server}} \text{Authoritative Order} \xrightarrow{\text{Razorpay}} \text{Verified Payment}$$

- **The LLM interprets intent & explains results.**
- **The backend deterministic engines enforce all business rules, prices, rankings, and stock.**
- **The customer explicitly authorizes every cart mutation & payment.**
- **Razorpay executes test payments with server-side HMAC-SHA256 verification.**
- **The CommerceEvent audit trail tracks every step for auditable merchant analytics.**

### More Than a Shopping Chatbot

Mercora deliberately separates probabilistic AI reasoning from deterministic commerce authority:

1. **Groq (`openai/gpt-oss-20b`)** interprets natural-language recommendation requests into structured criteria.
2. **RecommendationService** applies deterministic mathematical filters and ranking.
3. **Structured product results** are returned directly to the frontend.
4. **Explicit commerce actions** are bounded by deterministic server-side authorization and validation gates.
5. **Clear explicit add commands** use the deterministic backend fast path without an additional LLM call.

Intent-aware tool routing and deterministic terminal paths minimize unnecessary LLM calls while keeping commerce authority on the backend.

---

## 🏆 Razorpay Buildathon Alignment (Track 01)

### 1. Agentic Commerce
Natural language shopping requests ("*Best over-ear headphones under ₹5,000 for travel*") trigger structured tool execution workflows (`recommend_products`, `get_cross_sell_suggestions`, `add_to_cart`, `create_order`).

### 2. Merchant Growth
Curated, bounded upsell and cross-sell suggestions expand Average Order Value (AOV). Mercora tracks **Potential Growth**, **Accepted Growth**, and **Realized Paid Revenue** as separate, auditable metrics.

### 3. Bounded & Explainable Money Actions
Mercora strictly isolates the Generative AI model from authoritative financial logic:

| Money / State Action | AI Can Suggest? | Customer Approval? | Backend Authority |
|---|---|---|---|
| **Product Recommendation** | Yes (structured criteria) | No purchase yet | `RecommendationService` (Deterministic Scoring) |
| **Add Item to Cart** | Yes (intent parsing) | **Required** | `CartService` (Stock & Active validation) |
| **Set / Override Price** | **NO** | N/A | Database `Product` / `ProductVariant` table |
| **Calculate Order Total** | **NO** | N/A | `OrderService` (`variant.price ?? product.price`) |
| **Execute Payment** | **NO** | **Required** | Razorpay Standard Checkout Overlay |
| **Verify & Mark Paid** | **NO** | N/A | `PaymentService` (Server HMAC-SHA256 Verification) |

### 4. Razorpay Test Mode Integration
Mercora creates Razorpay orders server-side (`razorpay.orders.create`) and verifies HMAC signatures using `crypto.createHmac("sha256", secret)` before performing any order state transition (`PENDING_PAYMENT` $\rightarrow$ `PAID`) or cart conversion (`CHECKOUT_PENDING` $\rightarrow$ `CONVERTED`).

The sequence is strictly enforced:
$$\text{Razorpay Success Overlay} \longrightarrow \text{Server HMAC-SHA256 Verification} \longrightarrow \text{Order State } \texttt{PAID} \longrightarrow \text{Cart State } \texttt{CONVERTED} \longrightarrow \text{Dashboard Analytics}$$

Mercora marks an internal order `PAID` **only** after server-side signature verification succeeds.

### 5. Graceful Failure Example

If a customer closes Razorpay before completing payment, Mercora does not treat the transaction as failed or paid. The internal order remains `PENDING_PAYMENT`, the cart remains safely `CHECKOUT_PENDING`, and the customer can either retry the same payment flow or cancel checkout and return the cart to `ACTIVE`.

Late verification against a cancelled order is rejected by the backend.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    U["Customer Browser"]
    F["React + Vite Frontend - Vercel"]
    API["Express + TypeScript API - Vercel sin1"]
    AG["AgentService"]
    G["Groq - openai/gpt-oss-20b"]
    TR["Tool Registry"]
    SEARCH["Catalog Search"]
    REC["Recommendation Engine"]
    GROWTH["Upsell and Cross-Sell Engine"]
    CART["Cart Service"]
    ORDER["Order Service"]
    RP["Razorpay Test Mode"]
    VERIFY["Payment Verification"]
    DB[(Neon PostgreSQL - Singapore)]
    EVENTS["CommerceEvent Audit Log"]
    DASH["Merchant Dashboard"]

    U --> F
    F --> API

    API --> AG
    AG --> G
    AG --> TR

    TR --> SEARCH
    TR --> REC
    TR --> GROWTH
    TR --> CART

    CART --> ORDER
    ORDER --> RP
    RP --> VERIFY

    SEARCH --> DB
    REC --> DB
    GROWTH --> DB
    CART --> DB
    ORDER --> DB
    VERIFY --> DB

    DB --> EVENTS
    EVENTS --> DASH
```

### Core Architecture Principle
> **LLM interprets. Backend decides. Customer authorizes. Razorpay processes. Server verifies. Audit trail records.**

---

## 🎯 Deterministic Recommendation Engine

The LLM **never** fabricates product rankings or scores out of thin air. 

1. **Groq API (`openai/gpt-oss-20b`)** converts natural language user queries into structured criteria (`category`, `maxPrice`, `useCases`, `desiredFeatures`).
2. **Recommendation Engine** (`apps/backend/src/recommendation`) evaluates candidates against hard constraints and computes a mathematical score out of 100 points:

$$\text{Score} = \text{Category Match}(25) + \text{Budget Match}(25) + \text{Feature Match}(20) + \text{Use Case Match}(15) + \text{Rating}(10) + \text{Stock}(5)$$

3. **Backend** returns structured product cards directly to the frontend with deterministic labels (`Best Match`, `Best Value`, `Strong Alternative`).

---

## 🎨 Production-Safe Variant Selection Flow

Mercora enforces a deterministic variant continuation pipeline to eliminate LLM hallucination and state drop-off during item selection:

```text
AI Recommendation (AI_RECOMMENDATION_RETURNED Event -> sourceEventId)
        ↓
Explicit Customer Add Intent ("Add Travel Headphones")
        ↓
Fast-Path Resolves Authoritative Product (0 Groq Calls)
        ↓
Active Variants Detected
        ↓
SELECT_VARIANT Pending Action (sourceEventId Preserved)
        ↓
Frontend Variant Modal
        ↓
Customer Selects Real Variant
        ↓
CartService.addCartItem (Server-Validates Attribution)
        ↓
Item Added to Cart
```

- **AI does not invent or guess variant IDs**: The model is barred from hallucinating color or configuration UUIDs.
- **AI does not silently choose options**: Variant choices are never assumed without explicit customer selection.
- **Backend-authoritative data**: All product IDs, variant IDs, stock levels, and prices are fetched directly from PostgreSQL.
- **Attribution continuity**: AI attribution (`source`, `aiAttributionSource`, `sourceEventId`) is server-validated via `AuditService.validateAttribution` and preserved through modal configuration down to cart, order, and payment verification. Client-side attribution claims are never blindly trusted.

---

## 📈 Deterministic Growth Engine & Auditable AI Attribution

The Growth Engine (`apps/backend/src/growth`) generates complementary cross-sells and higher-tier upsells:
- **Price Delta Capping**: Upsells are strictly capped at $\le 1.4\times$ current product price.
- **Cart De-duplication**: Items already present in the user's cart are automatically excluded.
- **Customer Authorization**: The AI presents suggestions with grounded feature diffs ("*For ₹1,000 more, gain Active Noise Cancellation*"); the user must explicitly click to accept.

### Server-Validated Revenue Attribution Flow

```text
AI_RECOMMENDATION_RETURNED (Generates sourceEventId)
        ↓
Explicit Add Request
        ↓
sourceEventId Preserved in SELECT_VARIANT
        ↓
Variant Modal Selection
        ↓
CartService.addCartItem
        ↓
AuditService.validateAttribution (Validates Event & Product Match)
        ↓
Validated CartItemSource (AI_RECOMMENDATION)
        ↓
Internal Order Item
        ↓
Razorpay Test Payment
        ↓
Server HMAC Verification -> PAYMENT_VERIFIED
        ↓
Merchant Analytics Dashboard
```

The **Merchant Dashboard** uses server-validated event and attribution data to report real-time store performance metrics:
- **Paid Revenue**: Verified revenue from successfully completed Razorpay payments.
- **Paid Orders**: Count of orders transitioning from `PENDING_PAYMENT` to `PAID`.
- **AI-Assisted Orders & Revenue**: Paid orders originating from AI recommendations or growth suggestions.
- **Accepted Growth**: Measured uplift from accepted upsells and cross-sells.
- **Recent Orders & Audit Log**: Real-time stream of customer transactions and auditable commerce events.

---

## 🔎 Example Agent Decision Trace

```mermaid
flowchart TD
    REQ["Customer Request: Headphones under ₹5,000 for travel"]
    INTENT["Intent Parsing: Category Headphones, Budget ≤ ₹5,000, Use Case Travel"]
    REC["Deterministic Recommendation: Travel Headphones - BEST MATCH"]
    AUTH["Customer Authorization: Add Travel Headphones to cart"]
    GATE["Variant Safety Gate: Active variants detected - AI cannot guess variant"]
    SEL["Customer Selection: Variant Red/Black selected"]
    CART["Cart Mutation: Authorized item added - Attribution AI_RECOMMENDATION"]
    ORDER["Internal Order Creation: Order status PENDING_PAYMENT"]
    PAY["Razorpay Test Mode: Customer completes payment"]
    VERIFY["Server Verification: HMAC-SHA256 signature verified"]
    STATE["Final State: Order PAID - Cart CONVERTED"]
    ATTR["Merchant Attribution: AI revenue in Dashboard - CommerceEvent logged"]

    REQ --> INTENT
    INTENT --> REC
    REC --> AUTH
    AUTH --> GATE
    GATE --> SEL
    SEL --> CART
    CART --> ORDER
    ORDER --> PAY
    PAY --> VERIFY
    VERIFY --> STATE
    STATE --> ATTR
```

> **Illustrative decision trace:** This example represents Mercora's implemented AI-assisted purchase flow. The LLM interprets customer intent, while authoritative product selection, variant validation, pricing, inventory, order state and payment verification remain controlled by backend services. AI attribution is preserved through the commerce flow and recorded through the CommerceEvent audit trail.

---

## ☁️ Production Deployment

| Layer | Platform | Production Configuration |
|---|---|---|
| **Frontend** | Vercel | React 18, Vite, Single-Page App rewrites |
| **Backend** | Vercel Functions | Express, Fluid Compute, Singapore (`sin1`) region |
| **Database** | Neon PostgreSQL | Serverless PostgreSQL, Singapore region, Prisma 7 |
| **AI Engine** | Groq API | Model: `openai/gpt-oss-20b` |
| **Payments** | Razorpay | Test Mode |

- **Customer Storefront:** https://mercora-ai.vercel.app
- **Backend API:** https://mercora-ai-backend.vercel.app

---

## 🛡️ Gracefully Handled Failures & Edge Cases

Mercora AI was validated against multiple engineering and transactional failure modes during development and deployment:

1. **Database Provider Recovery**:
   Supabase connection and pooler instabilities occurred across early deployment attempts. The database architecture was migrated to Neon PostgreSQL for serverless connection stability.
2. **Prisma Production Migration Recovery**:
   A production migration encountered an existing `CartStatus` enum conflict on Neon PostgreSQL. The migration chain was repaired non-destructively without resetting production state or modifying final schema targets.
3. **Production Enum Drift**:
   A `CommerceEventType` enum mismatch caused early Merchant API 500 errors. A canonical incremental migration aligned PostgreSQL database enums with application types.
4. **Production Groq Deployment Mismatch**:
   The deployed AI initially experienced model configuration drift. Production was standardized to `openai/gpt-oss-20b` served via Groq.
5. **TypeScript / Groq SDK Deployment Failure**:
   Clean Vercel backend builds exposed Groq SDK import compatibility and TypeScript resolution differences. The import was corrected and TypeScript was pinned to 5.5.4.
6. **Agent Conversation State & Variant Continuation**:
   A multi-turn variant selection flow exposed fragile LLM continuation state. The production flow was upgraded to a deterministic `SELECT_VARIANT` backend response that triggers an authoritative frontend variant modal.
7. **Deployment Latency Optimization**:
   Backend execution initially ran in Washington while Neon DB was hosted in Singapore. Moving Vercel Functions to Singapore (`sin1`) placed backend compute next to the database, reducing typical deployed AI interaction latency to 2-4 seconds.
8. **Razorpay Modal Dismissal & Late-Payment Guard**:
   Closing the Razorpay modal leaves the cart safely locked in `CHECKOUT_PENDING` and the order in `PENDING_PAYMENT`. Users can retry payment or cancel to unlock the cart. Late payment verifications for cancelled orders are rejected immediately (`INVALID_ORDER_STATUS`).
9. **Groq Free-Tier Production Hardening**:
   Production testing showed that repeatedly attaching the entire agent tool registry to multi-round LLM requests generated unnecessary token throughput. Mercora was optimized using intent-aware tool exposure, a six-message history window, concise response budgets, tool-free secondary synthesis where needed, terminal read-only recommendation paths, and deterministic zero-LLM explicit cart authorization paths. This reduced unnecessary model calls without weakening price, inventory, variant, cart, order, payment, attribution or authorization controls.

*(Read full engineering retrospectives in [`docs/failures.md`](docs/failures.md))*

---

## 🛠️ Tech Stack

| Component | Technologies Used |
|---|---|
| **Frontend** | React 18, TypeScript 5.5.4, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Node.js, Express, TypeScript 5.5.4, Zod |
| **AI Layer** | Groq API (`openai/gpt-oss-20b`) |
| **Database & ORM** | Neon PostgreSQL, Prisma 7 |
| **Payments** | Razorpay Test Mode (Server-side HMAC-SHA256 Verification) |
| **Deployment** | Vercel Frontend, Vercel Express Backend (Fluid Compute, Singapore `sin1`) |

---

## 📁 Repository Structure

```text
Mercora-AI/
├── apps/
│   ├── frontend/         # React + Vite frontend application
│   └── backend/          # Express API server & agent controller
├── prisma/
│   ├── migrations/       # Non-destructive production migrations
│   ├── schema.prisma     # Canonical data model (Product, Cart, Order, CommerceEvent)
│   └── seed.ts           # Authoritative 40-product seed script
├── docs/
│   ├── screenshots/      # Production demo screenshot evidence
│   │   ├── 01-storefront.png
│   │   ├── 02-ai-recommendation.png
│   │   ├── 03-variant-safety.png
│   │   ├── 04a-razorpay-payment-success.png
│   │   ├── 04b-payment-verified-order-confirmed.png
│   │   └── 05-merchant-dashboard.png
│   ├── architecture.md   # Deep-dive architecture & data flows
│   ├── ai-design.md       # Agent tool boundaries & LLM design rules
│   ├── failures.md       # Real engineering failure retrospectives
│   ├── demo-script.md    # 5-minute video pitch recording script
│   └── submission-checklist.md # Razorpay Buildathon submission tracking
├── scratch/              # Automated validation & regression test scripts
│   ├── test-agent-intent-gate.ts     # Intent safety gating suite (11/11 passing)
│   ├── test-agent-token-budget.ts    # Groq token budget suite (5/5 passing)
│   ├── test-attribution-fast-path.ts # AI attribution preservation suite (2/2 passing)
│   ├── test-phase9-failures.ts       # Payment verification failure test suite
│   ├── test-phase9-e2e.ts            # Purchasing flow test suite
│   ├── test-variant-continuation.ts  # Deterministic variant continuation suite
│   └── validate-product-media.ts     # Catalog product media validation
├── .env.example          # Environment variable template
├── .gitignore            # Git exclusion rules
├── LICENSE               # MIT License
├── package.json          # Monorepo workspace configuration
└── README.md             # Project documentation
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
- Node.js v18+ & npm
- PostgreSQL database (Local or Neon PostgreSQL)
- Groq API Key, with `openai/gpt-oss-20b` configured as the AI model
- Razorpay Test Key ID & Key Secret

### 1. Clone & Install
```bash
git clone https://github.com/Raghuram1784/Mercora-AI.git
cd Mercora-AI
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mercora"
DIRECT_URL="postgresql://user:password@localhost:5432/mercora"
GROQ_API_KEY="gsk_your_groq_api_key"
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

> **Note on Database Connection Strings:**
> - `DATABASE_URL`: Used by runtime application services (supports connection pooling).
> - `DIRECT_URL`: Used by Prisma CLI for DDL migrations (`npx prisma migrate deploy`).

### 3. Run Database Migrations & Seed Catalog
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 4. Start Local Development Server
```bash
npm run dev
```
- Frontend will be available at: `http://localhost:5173`
- Backend API will be available at: `http://localhost:5000`

---

## 🧪 Testing & Automated Validation

Execute automated regression suites:
```bash
# Test agent intent safety gating (11/11 passing)
npx tsx scratch/test-agent-intent-gate.ts

# Test Groq token-budget routing & tool schema optimization (5/5 passing)
npx tsx scratch/test-agent-token-budget.ts

# Test fast-path AI attribution validation & preservation (2/2 passing)
npx tsx scratch/test-attribution-fast-path.ts

# Test payment verification failure modes, signature checks, idempotency, late verification guards
npx tsx scratch/test-phase9-failures.ts

# Test end-to-end purchasing flows (Direct, AI-assisted, Sequential purchases, Analytics reconciliation)
npx tsx scratch/test-phase9-e2e.ts

# Test deterministic SELECT_VARIANT behavior, real variant IDs, attribution preservation & history contract
npx tsx scratch/test-variant-continuation.ts

# Validate 40/40 real physical product photography files and zero duplicate primary photos
npx tsx scratch/validate-product-media.ts
```

### 🧪 Validation Evidence

Mercora was validated beyond the happy-path demo:

- Agent intent safety gating: 11/11 tests passing (`scratch/test-agent-intent-gate.ts`)
- Groq token-budget routing: 5/5 tests passing (`scratch/test-agent-token-budget.ts`)
- Fast-path AI attribution validation: 2/2 tests passing (`scratch/test-attribution-fast-path.ts`)
- Deterministic recommendation scenarios covering budget, category, product grounding and repeatability
- Impossible-budget validation with no constraint violation
- Recommendation requests that do not mutate the cart without customer authorization
- Server-side rejection of forged AI attribution
- CommerceEvent idempotency and deduplication validation
- AI-assisted order attribution validation
- Razorpay dismissal, retry and cancelled-order protection
- Deterministic variant-continuation regression coverage
- Product-media validation across the seeded catalog

Detailed validation scripts and implementation notes are available under `scratch/` and `docs/phases/`.

---

## 🔒 Security Controls

- **Server-Only Secrets**: `RAZORPAY_KEY_SECRET`, `GROQ_API_KEY`, and Neon database credentials strictly remain on the server and are never exposed to the client.
- **HMAC Signature Verification**: `crypto.createHmac("sha256")` validates Razorpay responses using constant-time string comparisons.
- **Controlled Error Payloads**: Error middleware strips stack traces in production JSON responses.
- **Backend Pricing & Stock Validation**: All prices and stock limits are validated against PostgreSQL at checkout time.
- **Explicit Authorization Gates**: Cart additions, variant selections, and order creations require explicit user authorization.

---

## ✅ Buildathon Submission Status

| Item | Status |
|---|---|
| Track 01 implementation | ✅ Complete |
| Production storefront | ✅ Live |
| Production backend | ✅ Live |
| Razorpay Test Mode integration | ✅ Verified |
| Server-side payment verification | ✅ Verified |
| Agent intent safety | ✅ Validated |
| AI attribution | ✅ Server validated |
| Graceful payment recovery | ✅ Implemented |
| End-to-end screenshots | ✅ Added |
| 5-minute pitch video | ⏳ Link pending final upload |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

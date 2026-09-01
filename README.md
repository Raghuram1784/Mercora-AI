# Mercora AI — Agentic Commerce & Merchant Growth Platform

> **Razorpay AI Buildathon Submission**  
> **Track 01 — AI Growth & Agentic Commerce**

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test_Mode-blue.svg)](https://razorpay.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.0-indigo.svg)](https://www.prisma.io/)
[![Neon DB](https://img.shields.io/badge/Neon-PostgreSQL-green.svg)](https://neon.tech/)

---

## 📌 Executive Summary & Pitch

**Mercora AI** is an agentic commerce platform that enables customers to discover products conversationally, receive mathematically ranked recommendations, approve personalized growth suggestions (upsells & cross-sells), and complete secure checkouts through **Razorpay Test Mode**.

For merchants, Mercora provides 100% explainable AI revenue attribution, AI-assisted order tracking, accepted growth metrics, payment completion analytics, and an immutable `CommerceEvent` audit trail.

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
- **The CommerceEvent audit trail tracks every step for 100% explainable merchant analytics.**

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

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    U[Customer / Browser] --> F[React 18 + Vite Frontend]
    F --> API[Express TypeScript Backend]

    API --> AG[Agent Controller / AgentService]
    AG --> G[Groq LLM Llama-3.3-70b]
    AG --> TR[Tool Registry]

    TR --> SEARCH[Catalog Search Service]
    TR --> REC[Deterministic Recommendation Engine]
    TR --> GROWTH[Upsell / Cross-Sell Growth Engine]
    TR --> CART[Cart Service]

    CART --> ORDER[Order Service]
    ORDER --> RP[Razorpay Test Mode API]
    RP --> VERIFY[Payment Verification Service]

    SEARCH --> DB[(Neon PostgreSQL DB)]
    REC --> DB
    GROWTH --> DB
    CART --> DB
    ORDER --> DB
    VERIFY --> DB

    DB --> EVENTS[CommerceEvent Audit Log]
    EVENTS --> DASH[Merchant Intelligence Dashboard]
```

### Core Architecture Principle
> **LLM interprets. Backend decides. Customer authorizes. Razorpay processes. Server verifies. Audit trail records.**

---

## 🎯 Deterministic Recommendation Engine

The LLM **never** fabricates product rankings or scores out of thin air. 

1. **Groq LLM** converts natural language user queries into structured criteria (`category`, `maxPrice`, `useCases`, `desiredFeatures`).
2. **Recommendation Engine** (`apps/backend/src/recommendation`) evaluates candidates against hard constraints and computes a mathematical score out of 100 points:

$$\text{Score} = \text{Category Match}(25) + \text{Budget Match}(25) + \text{Feature Match}(20) + \text{Use Case Match}(15) + \text{Rating}(10) + \text{Stock}(5)$$

3. **LLM** receives the ranked products alongside backend-generated reasons (`Best Match`, `Best Value`, `Strong Alternative`) and presents them conversationally.

---

## 📈 Deterministic Growth Engine

The Growth Engine (`apps/backend/src/growth`) generates complementary cross-sells and higher-tier upsells:
- **Price Delta Capping**: Upsells are strictly capped at $\le 1.4\times$ current product price.
- **Cart De-duplication**: Items already present in the user's cart are automatically excluded.
- **Customer Authorization**: The AI presents suggestions with grounded feature diffs ("*For ₹1,000 more, gain Active Noise Cancellation*"); the user must explicitly click to accept.

---

## 📜 CommerceEvent Audit Trail

Every critical interaction generates an immutable `CommerceEvent` row in PostgreSQL:

```text
AI_RECOMMENDATION_REQUESTED ➔ AI_RECOMMENDATION_RETURNED ➔ ACCESSORY_SHOWN ➔ ACCESSORY_ACCEPTED ➔ ORDER_CREATED ➔ PAYMENT_STARTED ➔ PAYMENT_VERIFIED ➔ CART_CONVERTED
```

This event stream powers the **Merchant Dashboard**, enabling store owners to audit AI influence, measure accepted growth uplift, and analyze conversion funnels.

---

## 🛡️ Gracefully Handled Failures & Edge Cases

Mercora AI is battle-tested against real-world failure modes:

1. **Razorpay Modal Dismissal / User Drop-Off**:
   Closing the Razorpay modal leaves the cart safely locked in `CHECKOUT_PENDING` and the order in `PENDING_PAYMENT`. The UI presents two explicit recovery paths:
   - **Retry Payment**: Reuses the pending Mercora order and re-launches Razorpay overlay.
   - **Cancel Checkout & Edit Cart**: Cancels the order (`CANCELLED`), unlocks the cart back to `ACTIVE`, and restores editing controls.
2. **Late-Payment Guard**:
   If a delayed payment verification attempt arrives for a `CANCELLED` order, the backend server rejects it immediately (`INVALID_ORDER_STATUS`), preventing revenue inflation or double cart conversion.
3. **Prisma Production Enum Migration Sync**:
   Resolved PostgreSQL enum drift on Neon DB using non-destructive incremental DDL migrations.

*(Read full engineering retrospectives in [`docs/failures.md`](docs/failures.md))*

---

## 🛠️ Tech Stack

| Component | Technologies Used |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Zod |
| **AI Layer** | Groq API (`llama-3.3-70b-versatile`) |
| **Database & ORM** | Neon PostgreSQL, Prisma 7 |
| **Payments** | Razorpay Test Mode (Server-side HMAC Verification) |

---

## 📁 Repository Structure

```text
Mercora-AI/
├── apps/
│   ├── frontend/         # React + Vite frontend application
│   └── backend/          # Express API server & agent controller
├── prisma/
│   ├── migrations/       # 5 non-destructive production migrations
│   ├── schema.prisma     # Canonical data model (Product, Cart, Order, CommerceEvent)
│   └── seed.ts           # Authoritative 40-product seed script
├── docs/
│   ├── architecture.md   # Deep-dive architecture & data flows
│   ├── ai-design.md       # Agent tool boundaries & LLM design rules
│   ├── failures.md       # Real engineering failure retrospectives
│   ├── demo-script.md    # 5-minute video pitch recording script
│   └── submission-checklist.md # Razorpay Buildathon submission tracking
├── scratch/              # Automated validation & failure test scripts
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
- Groq API Key
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
GROQ_API_KEY="gsk_your_groq_api_key"
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

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
# Test payment verification failure modes, signature checks, idempotency, late verification guards
npx tsx scratch/test-phase9-failures.ts

# Test end-to-end purchasing flows (Direct, AI-assisted, Sequential purchases, Analytics reconciliation)
npx tsx scratch/test-phase9-e2e.ts

# Validate 40/40 real physical product photography files and zero duplicate primary photos
npx tsx scratch/validate-product-media.ts
```

---

## 🔒 Security Controls

- **Server-Only Secrets**: `RAZORPAY_KEY_SECRET` and `GROQ_API_KEY` are strictly server-side and never exposed to the client.
- **HMAC Signature Verification**: `crypto.createHmac("sha256")` validates Razorpay responses using constant-time string comparisons.
- **Controlled Error Payloads**: Error middleware strips stack traces in production JSON responses.
- **Backend Pricing & Stock Validation**: All prices and stock limits are checked against PostgreSQL at checkout time.

---

## 🎥 Demo Video & Live Deployment

- **5-Minute Pitch Video**: *(To be added post-deployment following [`docs/demo-script.md`](docs/demo-script.md))*
- **Live Production URL**: *(To be added post-deployment)*

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

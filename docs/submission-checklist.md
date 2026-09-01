# Razorpay AI Buildathon - Submission Checklist
## Track 01: AI Growth & Agentic Commerce

This checklist tracks the readiness status for public submission to the **Razorpay AI Buildathon**.

---

## 1. Repository & Security Readiness (Completed)

- [x] **Public GitHub Repository Initialized**: Target `https://github.com/Raghuram1784/Mercora-AI`
- [x] **Secret Audit Passed**: Zero API keys (`GROQ_API_KEY`), database credentials (`DATABASE_URL`), or Razorpay secrets (`RAZORPAY_KEY_SECRET`) committed in tracked files.
- [x] **Environment File Integrity**: `.env` and `.env.*` excluded via `.gitignore`. `.env.example` templates created with non-sensitive placeholders.
- [x] **Local Product Photography**: All 40 products serve high-definition real product photography stored locally under `apps/frontend/public/products/<slug>/`. Legacy generated SVG artwork completely removed.
- [x] **Prisma Migration History Tracked**: All non-destructive Prisma database migrations tracked in `prisma/migrations/`.
- [x] **Full Production Build Passed**: `npm run build` succeeds with 0 TypeScript compilation or Vite build errors across workspace.

---

## 2. Production Deployment & Live Infrastructure (Completed)

- [x] **Frontend Deployed to Vercel**: `https://mercora-ai.vercel.app` (React 18, Vite, Single-Page App rewrites enabled).
- [x] **Backend Deployed to Vercel Functions**: `https://mercora-ai-backend.vercel.app` (Express API, Fluid Compute enabled, Singapore `sin1` region).
- [x] **Health Check Endpoint Verified**: `https://mercora-ai-backend.vercel.app/api/health` returning operational status.
- [x] **Neon PostgreSQL Production Database Configured**: Serverless PostgreSQL hosted in Singapore region, colocated with Vercel backend compute.
- [x] **Production Migrations Deployed**: Prisma migrations applied non-destructively to production Neon database.
- [x] **Production Catalog Seeded**: 40 products across 6 categories available and verified in live database.
- [x] **Groq AI Working**: Standardized production LLM provider using `openai/gpt-oss-20b`.
- [x] **Razorpay Test Mode Working**: Server-side order creation and HMAC-SHA256 signature verification operational.
- [x] **Live AI-Assisted Purchase Verified**: Complete flow tested from natural language recommendation through variant selection, Razorpay payment, and merchant attribution.
- [x] **Merchant Dashboard Operational**: Live metrics tracking Paid Revenue, Paid Orders, AI-Assisted Revenue, Accepted Growth Uplift, and CommerceEvent audit log.
- [x] **AI-Assisted Attribution Verified**: `sourceEventId` and `AI_RECOMMENDATION` attribution preserved from drawer interaction to checkout and dashboard.
- [x] **README Production URLs Added**: Storefront, backend API, health check, quick-start guide, and Mermaid diagrams updated in `README.md`.
- [x] **Failure Recovery Tested**: Razorpay modal dismissal recovery, pending order lock, late-payment rejection, and deterministic variant continuation validated.

---

## 3. Architectural & Feature Requirements (Completed)

- [x] **Agentic Commerce Engine**: Natural language intent interpretation coupled with deterministic tool execution (`search_products`, `get_product_details`, `get_cart`, `add_to_cart`, `recommend_products`, `get_upsell_suggestions`, `get_cross_sell_suggestions`, `create_order`).
- [x] **Bounded Money Actions**: LLM cannot set prices, override stock, compute order totals, execute payments, or mark orders as paid. Backend services enforce 100% authority.
- [x] **Razorpay Test Mode Integration**: Server-side order creation (`razorpay.orders.create`) and HMAC-SHA256 signature verification (`crypto.createHmac`).
- [x] **Merchant Growth Engine**: Deterministic upsell, cross-sell, and accessory suggestions driving measurable merchant growth metrics.
- [x] **CommerceEvent Audit Trail**: Complete event trail (`AI_RECOMMENDATION_REQUESTED`, `ORDER_CREATED`, `PAYMENT_STARTED`, `PAYMENT_VERIFIED`, `CART_CONVERTED`) supporting auditable AI attribution.
- [x] **Merchant Dashboard**: Analytics tracking Paid Revenue, Paid Orders, AI-Assisted Revenue, and Accepted Growth Uplift.
- [x] **Gracefully Handled Failures**: Dismissed checkout recovery, pending order state lock, late-payment verification rejection, and Prisma production enum drift.

---

## 4. Documentation Requirements (Completed)

- [x] **Polished Root README**: Buildathon alignment, Bounded Actions table, Mermaid architecture diagram, Agent Decision Trace, local setup guide, validation evidence.
- [x] **System Architecture**: `docs/architecture.md`
- [x] **AI Design & Boundaries**: `docs/ai-design.md`
- [x] **Real Failure Retrospective**: `docs/failures.md`
- [x] **5-Minute Pitch Recording Plan**: `docs/demo-script.md`
- [x] **Submission Checklist**: `docs/submission-checklist.md`

---

## Final Submission Tasks

- [ ] Capture and add final product screenshots to repository documentation
- [ ] Record final 5-minute Buildathon pitch video
- [ ] Verify video sharing permissions
- [ ] Perform final production smoke test
- [ ] Perform final repository secret scan
- [ ] Submit Razorpay AI Buildathon form

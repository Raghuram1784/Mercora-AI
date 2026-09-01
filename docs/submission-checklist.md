# Razorpay AI Buildathon — Submission Checklist
## Track 01: AI Growth & Agentic Commerce

This checklist tracks the readiness status for public submission to the **Razorpay AI Buildathon**.

---

## 1. Repository & Security Readiness (Completed)

- [x] **Public GitHub Repository Initialized**: Target `https://github.com/Raghuram1784/Mercora-AI`
- [x] **Secret Audit Passed**: Zero API keys (`GROQ_API_KEY`), database credentials (`DATABASE_URL`), or Razorpay secrets (`RAZORPAY_KEY_SECRET`) committed in tracked files.
- [x] **Environment File Integrity**: `.env` and `.env.*` excluded via `.gitignore`. `.env.example` templates created with non-sensitive placeholders.
- [x] **Local Product Photography**: All 40 products serve high-definition real product photography stored locally under `apps/frontend/public/products/<slug>/`. Legacy generated SVG artwork completely removed.
- [x] **Prisma Migration History Tracked**: All 5 non-destructive Prisma database migrations tracked in `prisma/migrations/`.
- [x] **Full Production Build Passed**: `npm run build` succeeds with 0 TypeScript compilation or Vite build errors across workspace.

---

## 2. Architectural & Feature Requirements (Completed)

- [x] **Agentic Commerce Engine**: Natural language intent interpretation coupled with deterministic tool execution (`search_products`, `get_product_details`, `get_cart`, `add_to_cart`, `recommend_products`, `get_upsell_suggestions`, `get_cross_sell_suggestions`, `create_order`).
- [x] **Bounded Money Actions**: LLM cannot set prices, override stock, compute order totals, execute payments, or mark orders as paid. Backend services enforce 100% authority.
- [x] **Razorpay Test Mode Integration**: Server-side order creation (`razorpay.orders.create`) and HMAC-SHA256 signature verification (`crypto.createHmac`).
- [x] **Merchant Growth Engine**: Deterministic upsell, cross-sell, and accessory suggestions driving measurable merchant growth metrics.
- [x] **CommerceEvent Audit Trail**: Complete event trail (`AI_RECOMMENDATION_REQUESTED`, `ORDER_CREATED`, `PAYMENT_STARTED`, `PAYMENT_VERIFIED`, `CART_CONVERTED`) supporting 100% explainable AI attribution.
- [x] **Merchant Dashboard**: Obsolescence-free analytics tracking Paid Revenue, Paid Orders, AI-Assisted Revenue, and Accepted Growth Uplift.
- [x] **Gracefully Handled Failures**: Dismissed checkout recovery, pending order state lock, late-payment verification rejection, and Prisma production enum drift.

---

## 3. Documentation Requirements (Completed)

- [x] **Polished Root README**: Buildathon alignment, Bounded Actions table, Mermaid architecture diagram, AI design principles, local setup guide.
- [x] **System Architecture**: `docs/architecture.md`
- [x] **AI Design & Boundaries**: `docs/ai-design.md`
- [x] **Real Failure Retrospective**: `docs/failures.md`
- [x] **5-Minute Pitch Recording Plan**: `docs/demo-script.md`
- [x] **Submission Checklist**: `docs/submission-checklist.md`

---

## 4. Post-Deployment Completion Tasks (Pending Final Deployment)

- [ ] **Deploy Backend**: Deploy Express backend to production host (e.g. Render / Railway).
- [ ] **Deploy Frontend**: Deploy React + Vite frontend to Vercel / Netlify.
- [ ] **Configure Production Neon Database**: Execute `npx prisma migrate deploy` and `npx prisma db seed` on production Neon PostgreSQL database.
- [ ] **Verify Live Razorpay Test Mode**: Perform live purchase end-to-end on deployed frontend.
- [ ] **Update README Live URLs**: Add live production frontend and backend URLs to `README.md`.
- [ ] **Record 5-Minute Pitch Video**: Record video demo following `docs/demo-script.md`.
- [ ] **Add Pitch Video Link**: Update `README.md` and `docs/demo-script.md` with final video URL (YouTube / Loom).
- [ ] **Final Repository Commit & Push**: Commit final live URLs and submit Buildathon form.

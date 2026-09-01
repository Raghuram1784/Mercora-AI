# Mercora AI - 5-Minute Pitch & Video Demo Script
## Razorpay AI Buildathon | Track 01 - AI Growth & Agentic Commerce

This document outlines the scene-by-scene recording script and narrative flow for the 5-minute public video pitch for **Mercora AI**.

---

## Pitch Structure Overview (5:00 Total Duration)

| Time | Section | Narrative Focus | Screen Visual |
|---|---|---|---|
| **0:00 - 0:30** | **Problem & Concept** | E-commerce friction vs. LLM financial risk | Title slide + Architecture Diagram |
| **0:30 - 1:00** | **Storefront & Catalog** | 40-product responsive shop & real media | Storefront (`/shop`), category pills, filters |
| **1:00 - 1:50** | **Mercora AI Recommendation** | Intent interpretation + deterministic ranking | Ask AI Drawer, structured product cards, badges |
| **1:50 - 2:30** | **Growth & Accessories** | Upsell / Cross-sell / Accessory suggestions | Variant modal, complementary accessories |
| **2:30 - 3:20** | **Razorpay Test Checkout** | Bounded money action + server verification | Cart drawer, Order modal, Razorpay Test Checkout |
| **3:20 - 4:00** | **Merchant Dashboard** | AI attribution, revenue metrics & audit log | Merchant Dashboard (`/merchant`), analytics cards |
| **4:00 - 4:35** | **Architecture & Authority** | Bounded Money Actions & security controls | Architecture diagram & Bounded Actions table |
| **4:35 - 4:55** | **Failure Handling** | Dismissed checkout recovery & late-payment guard | Razorpay modal dismissal $\rightarrow$ Retry / Cancel flow |
| **4:55 - 5:00** | **Closing** | Summary & repository link | Repository link + closing slide |

---

## Scene-by-Scene Script

### Scene 1: Introduction & Problem Statement (0:00 - 0:30)
- **Voiceover**: *"Welcome to Mercora AI. Traditional e-commerce forces users through rigid filters and text searches, while letting an LLM autonomously handle prices, inventory, or payments introduces massive commerce risk. Mercora AI solves this by introducing Bounded Agentic Commerce—where AI interprets intent, backend services enforce authority, and Razorpay handles verified payment execution."*
- **Visual**: Title slide with logo, followed by animated architecture overview.

### Scene 2: Customer Storefront & Real Media (0:30 - 1:00)
- **Voiceover**: *"Here is the Mercora customer storefront. We feature a complete 40-product catalog across headphones, earbuds, smartwatches, speakers, power banks, and accessories—all backed by clean, real product photography stored locally."*
- **Visual**: Scroll through `/shop`, select category pills (*Headphones*, *Accessories*), click product search.

### Scene 3: Mercora AI Assistant & Deterministic Recommendations (1:00 - 1:50)
- **Voiceover**: *"When a customer asks Mercora AI: 'What are the best wireless headphones for travel under ₹5,000?', the LLM does NOT calculate scores or guess prices. Instead, Groq extracts structured intent criteria, which is passed to our backend Recommendation Engine. The backend ranks products deterministically out of 100 points based on budget, category, use case, and rating—returning structured cards with 'Best Match' badges."*
- **Visual**: Open Ask AI drawer, click prompt, show stream of response and structured product recommendation cards.

### Scene 4: Growth Engine & Accessory Suggestions (1:50 - 2:30)
- **Voiceover**: *"Mercora also drives merchant growth. When looking at a product, our Growth Engine deterministically recommends complementary accessories—like a Braided USB-C Cable—or higher-tier upgrades with grounded feature comparisons. Crucially, the AI never auto-mutates the cart; the customer explicitly authorizes every addition."*
- **Visual**: Open product page, view variant swatches, inspect accessory suggestions, click 'Add to Cart'.

### Scene 5: Order Creation & Razorpay Test Checkout (2:30 - 3:20)
- **Voiceover**: *"When the customer is ready to buy, Mercora creates an internal server-authoritative Order with status PENDING_PAYMENT. The customer proceeds to Razorpay Test Mode checkout. Upon payment completion, Razorpay credentials and HMAC-SHA256 signatures are verified server-side before transitioning the order to PAID and converting the cart."*
- **Visual**: Open Cart drawer $\rightarrow$ click Continue to Payment $\rightarrow$ show Order Created modal $\rightarrow$ launch Razorpay Test Checkout overlay $\rightarrow$ enter test credentials $\rightarrow$ complete payment $\rightarrow$ view Order Confirmation.

### Scene 6: Merchant Growth & Observability Dashboard (3:20 - 4:00)
- **Voiceover**: *"For merchants, Mercora provides complete observability. On the Merchant Dashboard, store owners can track Paid Revenue, Paid Orders, AI-Assisted Revenue, and Accepted Growth Uplift. Every single transaction and AI interaction is recorded in an append-only CommerceEvent audit trail, providing 100% explainable attribution."*
- **Visual**: Navigate to `/merchant`, inspect KPI cards, view dual-axis revenue trend chart, scroll through Commerce Audit Log.

### Scene 7: Bounded Money Actions & System Architecture (4:00 - 4:35)
- **Voiceover**: *"Our core design principle is: LLM interprets, Backend decides, Customer authorizes, Razorpay processes, Server verifies. The LLM can never set prices, override stock, calculate order totals, or mark orders as paid."*
- **Visual**: Show Bounded Money Actions table from README/docs.

### Scene 8: Failure Recovery & Edge Case Handling (4:35 - 4:55)
- **Voiceover**: *"Mercora handles failures gracefully. If a customer dismisses the Razorpay checkout overlay, the cart is safely locked in CHECKOUT_PENDING, preventing duplicate order creation. The user can either Retry Payment or Cancel Checkout to edit their cart. If a delayed payment verification arrives for a cancelled order, the server rejects it immediately."*
- **Visual**: Open checkout modal $\rightarrow$ dismiss Razorpay modal $\rightarrow$ show Retry / Cancel UI options.

### Scene 9: Closing (4:55 - 5:00)
- **Voiceover**: *"Mercora AI brings explainable, safe, and growth-oriented agentic commerce to life with Razorpay. Thank you!"*
- **Visual**: GitHub repository link (`https://github.com/Raghuram1784/Mercora-AI`) and closing slide.

# Phase 4B: Premium Agentic Shopping Experience (AI Assistant Drawer)

## Objective
Phase 4B establishes a dedicated, premium AI-driven shopping assistant drawer integrated directly into the Shop page experience. It allows users to query, compare, and modify their shopping carts through a controlled natural-language interface while preserving security and transaction boundaries.

---

## Frontend Architecture

### 1. Types & Client Services
* **[`types/agent.ts`](file:///c:/Users/Raghu%20Ram/Desktop/Mercora%20AI/apps/frontend/src/types/agent.ts)**: Declares shapes for messages, logs, action traces, and SELECT_VARIANT pending action states.
* **[`services/agent.service.ts`](file:///c:/Users/Raghu%20Ram/Desktop/Mercora%20AI/apps/frontend/src/services/agent.service.ts)**: Client service wrapping `/api/agent/chat`. It cleanses the outbound payload so that *only* the last 10 `{ role, content }` elements are transmitted, preserving LLM context boundaries.

### 2. Error Boundary
* **[`agent-error-boundary.tsx`](file:///c:/Users/Raghu%20Ram/Desktop/Mercora%20AI/apps/frontend/src/components/agent/agent-error-boundary.tsx)**: Class-based boundary capturing unexpected rendering crashes and rendering a compact, styled inline notification card:
  ```text
  Mercora AI couldn't display this response. [ Try Again ]
  ```
  This traps errors locally inside the assistant drawer, keeping the rest of the Shop page fully functional.

### 3. Drawer Layout & UI
* **Header Trigger & FAB**:
  * Mounted a sparkles ✨ AI button next to the Cart button in the navigation bar.
  * Optionally displays a floating violet action button at the bottom-right of the viewport.
  * Clicking either trigger slides open the assistant drawer without route changes.
* **AIAssistantDrawer**:
  * Width: `440px-480px` on desktop, opening as a full viewport sheet on mobile.
  * Backdrop: slide-in glass sheet overlaying the Shop page with Framer Motion.
  * Messages list with internal scroll and sticky composer locked at the bottom.
  * suggested starting prompts inside empty drawer:
    * Headphones under ₹3,000
    * Fitness smartwatch
    * Travel speaker
    * 20,000mAh power bank
    * Clicking a suggested prompt button submits the query directly.
* **Inline Mini Product Cards**:
  * Displays horizontal mini cards returned under `data.products` directly within the conversation stream:
    ```text
    [image]  Product Name (Brand)
             ₹price
             View Details | Add to Cart / Choose Options
    ```
  * Clicking `View Details` navigates to `/products/:productId` and closes the drawer.
  * Clicking `Choose Options` opens the variant selector modal.
  * Clicking `Add to Cart` runs direct additions.

---

## Testing & Scenarios
Manual tests completed successfully:
1. **Drawer Toggles**: Sparkles button and FAB toggle drawer open/close.
2. **Suggested Prompting**: Suggested cards submit prompt search calls directly.
3. **Responsive Sheets**: Drawer fits `440px-480px` sidebar grids on desktop, and mobile stacks overlays.
4. **Variant Modals**: Modals open, validate stock, and add items with immediate cart synchronizations.

# AI Workflow & Engineering Verification

This document details how AI assistance was leveraged during the development of the Ajaia Collaborative Document Editor MVP, the rigorous verification methods applied, and key architectural choices where AI-generated drafts were rejected or refactored.

---

## 1. How AI Was Leveraged

AI was utilized as a senior pair programmer focused on rapid delivery under strict time constraints:
1. **Scaffolding Complete Working Files**: Generating clean, strictly-typed TypeScript schemas, Tailwind components, and Next.js App Router handlers with zero placeholders.
2. **ProseMirror/TipTap Toolbar Wiring**: Synthesizing the command chain for TipTap formatting buttons (heading levels, underline extensions, list toggling) and clean styling.
3. **ACL Security Edge Cases**: Formulating test scenarios for boundary conditions (e.g., self-sharing prevention, editor attempting to delete/share, unshared user getting 403 Forbidden).
4. **Markdown & Text Parsing**: Crafting a lightweight regex-based inline parser in `lib/utils.ts` to convert `.txt` and `.md` file uploads into TipTap-compatible HTML without introducing heavy external runtime dependencies.

---

## 2. Verification Methods & Quality Assurance

To ensure the codebase is robust and production-ready:
1. **Automated Unit Testing (`tests/access-control.test.ts`)**:
   - Comprehensive Vitest test suite executing in isolated Node environments.
   - Verifies owner privileges, editor write permissions, viewer read-only locks, and unshared 403 rejections.
   - Verifies rejection of illegal sharing attempts (non-owner sharing, self-sharing, invalid emails).
2. **Type Safety & Schema Validation**:
   - Explicit TypeScript types across storage, API routes, and components (`User`, `Document`, `CollaboratorRole`, `AccessPermission`).
   - Strict TypeScript compiler options with zero `any` leaks in critical path storage methods.
3. **SSR Hydration Guarding**:
   - TipTap depends on browser DOM APIs; rendering TipTap directly during Next.js server-side rendering often leads to React hydration mismatches.
   - Verified that dynamic import with `ssr: false` and `immediatelyRender: false` was used to ensure seamless hydration.
4. **State Persistence Verification**:
   - Guaranteed that document modifications, new creations, and share grants persist to `data/documents.json`, ensuring page refreshes and server reloads retain all user state.

---

## 3. Rejected AI Drafts & Refinements

During the prompt and iteration phases, several initial AI suggestions were rejected in favor of more practical, robust engineering patterns:

### A. Rejected: Volatile In-Memory `Map` Storage
* **Initial AI Suggestion**: Use a standard JavaScript `const store = new Map()` in memory.
* **Why Rejected**: In Next.js App Router (especially in development mode), route files are frequently re-evaluated, which resets in-memory variables. Furthermore, browser refreshes would wipe out documents created by the evaluator.
* **Refined Implementation**: Implemented a JSON filesystem storage engine in `lib/storage.ts` that writes to `data/documents.json` with in-memory caching. This guarantees persistence across page reloads and server restarts without requiring database setup.

### B. Rejected: Heavy External WebSocket Server for MVP
* **Initial AI Suggestion**: Include a custom WebSocket server running alongside Next.js for character-by-character live sync.
* **Why Rejected**: Adding WebSockets to an MVP assessment introduces unnecessary operational failure points (port conflicts, broken proxies, fragile reconnect loops) and violates the tight time constraint.
* **Refined Implementation**: Implemented an 800ms debounced auto-save loop communicating with REST endpoints. This is stable, provides deterministic state, and accurately reflects real-world auto-saving patterns (like Notion and Google Docs background sync).

### C. Rejected: Client-Only Permission Checks
* **Initial AI Suggestion**: Hide UI buttons on the client if a user is not an owner or editor, without validating in the API routes.
* **Why Rejected**: Client-only checks are insecure and allow malicious or curious users to bypass restrictions via direct `curl` or `fetch` calls.
* **Refined Implementation**: Dual-layer defense: The UI reflects the user's role (read-only editor, disabled share button), and the API routes (`PATCH`, `DELETE`, `POST /share`) strictly validate permissions against `lib/storage.ts` and return `403 Forbidden` if unauthorized.

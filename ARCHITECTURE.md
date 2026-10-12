# System Architecture & Technical Tradeoffs

This document outlines the architectural decisions, design tradeoffs, system slice prioritization, and future scaling considerations for the Ajaia Collaborative Document Editor MVP.

---

## 1. System Slice & Scope Prioritization

Under the assessment's tight time constraints, our primary engineering objective was to deliver a vertically integrated **working vertical slice** with zero placeholders rather than a wide, shallow, or buggy skeleton.

### Prioritized in MVP (P0):
1. **End-to-End Rich Text Editing**: Full TipTap (ProseMirror engine) integration with custom toolbar controls (Bold, Italic, Underline, H1, H2, Lists, Code, Quotes).
2. **Debounced Auto-Save & State Feedback**: 800ms debounce loop that prevents server write thrashing while providing immediate user feedback (`Saving...` → `Saved` / `Error`).
3. **Robust Access Control Matrix (RBAC)**: Enforced both at API route boundaries and UI presentation layers:
   - `Owner`: Read, Write, Delete, Share.
   - `Editor`: Read, Write.
   - `Viewer`: Read-only (editor physically locked).
   - `Unshared User`: 403 Forbidden with security error view.
4. **Instant Multi-Persona Mock Auth**: Simulated session dropdown (Alice, Bob, Charlie) that passes user context across both client and server headers (`x-user-id`).
5. **Direct File Import**: Native browser file ingestion supporting `.txt` and `.md` with an in-memory parser converting raw text to semantic HTML.
6. **Automated Verification**: Fast Vitest suite validating access control, permission delegation, and boundary conditions.

### Deferred to Future Phases (P1/P2):
- **Live Peer-to-Peer CRDTs (Yjs / Liveblocks)**: WebSockets and Operational Transformation/CRDT sync are prioritized for post-MVP. In this MVP, debounced REST polling/saving provides deterministic consistency without requiring a persistent WebSocket infrastructure.
- **True OAuth 2.0 / JWT Authentication**: Mock authentication with seeded users allows immediate, frictionless evaluation of the RBAC engine without external auth providers (e.g. Supabase Auth / NextAuth / Clerk).

---

## 2. Architectural Design Tradeoffs

### A. TipTap (ProseMirror) vs. Draft.js vs. Slate.js
* **Decision**: Selected **TipTap 2.x** with `@tiptap/react` and `@tiptap/starter-kit`.
* **Rationale**:
  - TipTap is the modern standard for collaborative editors (used by Notion, GitBook, and Coda).
  - Draft.js is deprecated by Meta.
  - Slate.js has notoriously fragile React rendering updates across Next.js SSR hydration cycles.
  - TipTap has native headless support and direct compatibility with Yjs if real-time multi-cursor collaboration is enabled later.
* **Tradeoff Mitigation**: Disabled SSR for the editor component via Next.js dynamic import (`ssr: false`) to eliminate any hydration mismatches.

### B. Storage Layer: Filesystem Persistence vs. SQLite vs. Supabase
* **Decision**: Implemented a JSON filesystem storage layer (`data/documents.json`) backed by an in-memory cache and seed fallback.
* **Rationale**:
  - Requires **zero external infrastructure**, no database setup, and no environment variable configuration for the evaluator.
  - Survives browser refreshes and server reloads across Node processes.
  - API signatures (`/api/documents`, `/api/documents/[id]`, `/api/documents/[id]/share`) are structured identically to how a Postgres/Prisma/Drizzle ORM repository would function, making migration trivial.

### C. Access Control Evaluation Pattern
* **Decision**: Centralized ACL checks in `lib/storage.ts`:
  ```typescript
  export function checkDocumentPermission(doc: Document, userId: string): AccessPermission {
    if (doc.ownerId === userId) return 'owner';
    const collaborator = doc.collaborators.find((c) => c.userId === userId);
    return collaborator ? collaborator.role : null;
  }
  ```
* **Rationale**:
  - Single source of truth. Both API endpoints (`GET`, `PATCH`, `DELETE`, `POST /share`) and automated unit tests evaluate the exact same permission logic.
  - Returns explicit HTTP status codes:
    - `403 Forbidden`: User attempts operation outside their assigned role (e.g., non-owner trying to share or delete; viewer trying to edit).
    - `404 Not Found`: Target document or user does not exist.
    - `400 Bad Request`: Owner attempting to share with themselves or missing payload.

---

## 3. Data Flow Diagram

```
[User Browser (Alice / Bob / Charlie)]
         │
         ├── Selects formatting / Edits text
         ├── Debounced 800ms
         │
         ▼
[Next.js App Router (Client Component)]
         │
         ├── Fetch with 'x-user-id' header
         │
         ▼
[Next.js API Handler: /api/documents/[id]]
         │
         ├── 1. Verify User Identity
         ├── 2. Check Document ACL in lib/storage.ts
         │      ├── Not shared? -> 403 Forbidden
         │      ├── Viewer updating? -> 403 Forbidden
         │      └── Owner / Editor? -> Proceed
         │
         ▼
[Persistence Layer (data/documents.json)]
         │
         └── Write updated document & return 200 OK
```

---

## 4. Production Scale Roadmap (Phase 2)

1. **Real-time WebSockets & CRDTs**:
   - Replace REST auto-save with a `Hocuspocus` server or Liveblocks provider using `@tiptap/extension-collaboration` and `yjs`.
   - Add collaborative cursors with user avatars showing live cursor positions in real time.
2. **Database Migration**:
   - Swap `lib/storage.ts` with Supabase PostgreSQL and Row-Level Security (RLS) policies directly mirroring the ACL rules implemented in this MVP.
3. **Version History & Restore**:
   - Store document snapshot diffs at 5-minute intervals to provide a Google Docs-like version history viewer.

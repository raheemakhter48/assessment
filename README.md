# Ajaia Collaborative Document Editor (MVP)

A modern, full-featured collaborative rich text document editor built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **TipTap**.

---

## 🚀 Quick Setup & Run Instructions

### 1. Install Dependencies
Run in your terminal at the project root (`d:\applications\assessment`):
```bash
npm install
```

### 2. Run Automated Unit Tests
To verify all permissions, access control, and 403 authorization rules:
```bash
npm test
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Seeded Users (Instant Switcher)

The application includes an active user switcher located at the top-right header:
1. **Alice** (`alice@example.com`) — *Owner / Primary User*
2. **Bob** (`bob@example.com`) — *Collaborator*
3. **Charlie** (`charlie@example.com`) — *Reviewer*

Switching users updates the active session instantly without requiring manual logouts or authentication setup, allowing you to test role-based access control across documents seamlessly.

---

## 🌟 Core Features

- **Rich Text Editing**: Powered by TipTap (ProseMirror engine) with a live formatting toolbar:
  - Bold, Italic, Underline
  - Heading 1, Heading 2, Heading 3
  - Bulleted List, Numbered List
  - Blockquotes, Inline Code, Undo, Redo
- **Debounced Auto-Save**: Real-time 800ms debounced saving with live status badges (`Saving...`, `Saved`, `Error`).
- **File Upload / Import**: Drag-and-drop or file picker for `.txt` and `.md` files that parse into rich text documents automatically with document title derived from the filename.
- **Role-Based Sharing**:
  - Document owners can share documents with collaborators as **Editor** or **Viewer**.
  - **Owner**: Full CRUD + share control.
  - **Editor**: Can view and edit document text and title.
  - **Viewer**: Read-only access with locked editor.
  - **Unshared**: Strictly blocked with HTTP 403 Forbidden.
- **Export**: One-click download as Markdown (`.md`).
- **Persistent Storage**: Robust storage layer persisting to `data/documents.json` with in-memory caching that survives server restarts and page refreshes.

---

## 📂 Project Structure

```
├── app/
│   ├── api/
│   │   └── documents/
│   │       ├── route.ts             # GET (list for user), POST (create/import)
│   │       └── [id]/
│   │           ├── route.ts         # GET (single), PATCH (update), DELETE
│   │           └── share/
│   │               └── route.ts     # POST (grant viewer/editor role)
│   ├── doc/[id]/page.tsx            # Rich text document editor page
│   ├── globals.css                  # Tailwind & TipTap ProseMirror styles
│   ├── layout.tsx                   # Root layout with UserProvider & Navbar
│   └── page.tsx                     # Dashboard with "My Documents" & "Shared With Me"
├── components/
│   ├── Editor.tsx                   # TipTap toolbar & auto-save editor
│   ├── FileUploadModal.tsx          # Drag & drop file import modal (.txt/.md)
│   ├── Navbar.tsx                   # Header with brand and user switcher
│   └── ShareModal.tsx               # Access delegation & collaborator modal
├── context/
│   └── UserContext.tsx              # Active simulated user session context
├── lib/
│   ├── storage.ts                   # Persistent filesystem/memory store & ACL
│   ├── types.ts                     # TypeScript interfaces
│   └── utils.ts                     # Markdown parsing & helper utilities
├── tests/
│   └── access-control.test.ts       # Vitest automated test suite for RBAC
├── ARCHITECTURE.md                  # System design tradeoffs and slice rationale
├── AI_WORKFLOW.md                   # AI engineering workflow and verification
└── package.json                     # Dependencies & test scripts
```

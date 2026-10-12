import fs from 'fs';
import path from 'path';
import {
  User,
  SEEDED_USERS,
  Document,
  CollaboratorRole,
  AccessPermission,
  CreateDocumentInput,
  UpdateDocumentInput,
  UserDocumentsResponse,
} from './types';

export { SEEDED_USERS };

const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 'doc_welcome',
    title: 'Welcome to Ajaia Collaborative Docs',
    content: `<h1>Welcome to Ajaia Collab Docs</h1><p>This is a modern collaborative rich text workspace powered by <strong>Next.js 14</strong>, <strong>TipTap</strong>, and <strong>Tailwind CSS</strong>.</p><h2>Key Features</h2><ul><li><strong>Real-time auto-saving</strong> with debouncing</li><li><strong>Rich formatting</strong>: Bold, Italic, Underline, H1, H2, lists</li><li><strong>File import</strong>: Direct upload of .txt and .md files</li><li><strong>Role-based sharing</strong>: Switch between Alice, Bob, and Charlie to test owner, editor, and viewer permissions</li></ul><blockquote><p>Try switching users from the top-right dropdown to see real-time permission access changes!</p></blockquote>`,
    ownerId: 'usr_alice',
    ownerName: 'Alice',
    ownerEmail: 'alice@example.com',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    collaborators: [
      {
        userId: 'usr_bob',
        name: 'Bob',
        email: 'bob@example.com',
        avatar: '👨‍💻',
        role: 'editor',
        sharedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
  },
  {
    id: 'doc_roadmap',
    title: 'Q4 Engineering Roadmap',
    content: `<h1>Q4 Engineering Roadmap</h1><p>Our key initiatives for the upcoming sprint cycles:</p><h2>Priority Initiatives</h2><ol><li>Complete real-time collaborative document editor MVP</li><li>Deliver granular access control verification tests</li><li>Refactor storage layer to ensure sub-millisecond latencies</li></ol>`,
    ownerId: 'usr_alice',
    ownerName: 'Alice',
    ownerEmail: 'alice@example.com',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    collaborators: [],
  },
  {
    id: 'doc_rfc_bob',
    title: 'Distributed State & Conflict Resolution RFC',
    content: `<h1>Distributed State & Conflict Resolution RFC</h1><p>Authored by <strong>Bob</strong>.</p><p>This document details our evaluation between Operational Transformation (OT) and Conflict-free Replicated Data Types (CRDTs) like Yjs and Automerge.</p><h2>Recommendation</h2><p>For rich text editing with TipTap/ProseMirror, Yjs is the industry standard for decentralized consistency.</p>`,
    ownerId: 'usr_bob',
    ownerName: 'Bob',
    ownerEmail: 'bob@example.com',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    collaborators: [
      {
        userId: 'usr_alice',
        name: 'Alice',
        email: 'alice@example.com',
        avatar: '👩‍💼',
        role: 'editor',
        sharedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
      {
        userId: 'usr_charlie',
        name: 'Charlie',
        email: 'charlie@example.com',
        avatar: '👨‍🔬',
        role: 'viewer',
        sharedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
    ],
  },
  {
    id: 'doc_sec_charlie',
    title: 'Security & Compliance Review (Confidential)',
    content: `<h1>Security & Compliance Review</h1><p>Review completed by <strong>Charlie</strong>.</p><p>All access control tokens, session cookies, and document ACLs have been audited.</p><h2>Audit Status</h2><ul><li>RBAC permission checks verified</li><li>Direct object reference safeguards implemented</li><li>Cross-tenant leakage tests passed</li></ul>`,
    ownerId: 'usr_charlie',
    ownerName: 'Charlie',
    ownerEmail: 'charlie@example.com',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    collaborators: [
      {
        userId: 'usr_alice',
        name: 'Alice',
        email: 'alice@example.com',
        avatar: '👩‍💼',
        role: 'viewer',
        sharedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ],
  },
];

// Persistent File Storage with In-Memory fallback
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'documents.json');

let memoryDocuments: Document[] | null = null;

function loadDocuments(): Document[] {
  if (memoryDocuments) return memoryDocuments;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryDocuments = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Storage] Warning reading persistence file, falling back to seed:', err);
  }

  // Initialize with seed
  memoryDocuments = JSON.parse(JSON.stringify(INITIAL_DOCUMENTS));
  saveDocuments(memoryDocuments);
  return memoryDocuments!;
}

function saveDocuments(docs: Document[]): void {
  memoryDocuments = docs;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(docs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Storage] Warning writing persistence file:', err);
  }
}

// User Helpers
export function getSeededUsers(): User[] {
  return SEEDED_USERS;
}

export function getUserById(userId: string): User | undefined {
  return SEEDED_USERS.find((u) => u.id === userId);
}

export function getUserByEmail(email: string): User | undefined {
  return SEEDED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// Permission checking logic
export function checkDocumentPermission(doc: Document, userId: string): AccessPermission {
  if (doc.ownerId === userId) {
    return 'owner';
  }
  const collaborator = doc.collaborators.find((c) => c.userId === userId);
  if (collaborator) {
    return collaborator.role;
  }
  return null;
}

// Storage Operations
export function getDocumentsForUser(userId: string): UserDocumentsResponse {
  const docs = loadDocuments();
  const owned = docs.filter((d) => d.ownerId === userId);
  const shared: (Document & { myRole: CollaboratorRole })[] = [];

  for (const doc of docs) {
    if (doc.ownerId !== userId) {
      const match = doc.collaborators.find((c) => c.userId === userId);
      if (match) {
        shared.push({
          ...doc,
          myRole: match.role,
        });
      }
    }
  }

  return { owned, shared };
}

export function getDocumentById(id: string, userId: string): { doc: Document; permission: AccessPermission } | null {
  const docs = loadDocuments();
  const doc = docs.find((d) => d.id === id);
  if (!doc) return null;

  const permission = checkDocumentPermission(doc, userId);
  return { doc, permission };
}

export function createDocument(input: CreateDocumentInput): Document {
  const docs = loadDocuments();
  const owner = getUserById(input.ownerId) || SEEDED_USERS[0];

  const newDoc: Document = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: input.title && input.title.trim() ? input.title.trim() : 'Untitled Document',
    content: input.content || '<p></p>',
    ownerId: owner.id,
    ownerName: owner.name,
    ownerEmail: owner.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    collaborators: [],
  };

  docs.unshift(newDoc);
  saveDocuments(docs);
  return newDoc;
}

export function updateDocument(
  id: string,
  userId: string,
  input: UpdateDocumentInput
): { doc?: Document; error?: string; status?: number } {
  const docs = loadDocuments();
  const docIndex = docs.findIndex((d) => d.id === id);
  if (docIndex === -1) {
    return { error: 'Document not found', status: 404 };
  }

  const doc = docs[docIndex];
  const permission = checkDocumentPermission(doc, userId);

  if (!permission) {
    return { error: 'Access denied: You do not have permission to view or edit this document', status: 403 };
  }

  if (permission === 'viewer') {
    return { error: 'Access denied: You have read-only access to this document', status: 403 };
  }

  // Owner or Editor can update
  if (input.title !== undefined) {
    doc.title = input.title.trim() || 'Untitled Document';
  }
  if (input.content !== undefined) {
    doc.content = input.content;
  }
  doc.updatedAt = new Date().toISOString();

  docs[docIndex] = doc;
  saveDocuments(docs);

  return { doc };
}

export function deleteDocument(id: string, userId: string): { success?: boolean; error?: string; status?: number } {
  const docs = loadDocuments();
  const doc = docs.find((d) => d.id === id);
  if (!doc) {
    return { error: 'Document not found', status: 404 };
  }

  if (doc.ownerId !== userId) {
    return { error: 'Access denied: Only the document owner can delete this document', status: 403 };
  }

  const filtered = docs.filter((d) => d.id !== id);
  saveDocuments(filtered);
  return { success: true };
}

export function shareDocument(
  id: string,
  ownerId: string,
  targetEmail: string,
  role: CollaboratorRole
): { doc?: Document; error?: string; status?: number } {
  const docs = loadDocuments();
  const doc = docs.find((d) => d.id === id);
  if (!doc) {
    return { error: 'Document not found', status: 404 };
  }

  if (doc.ownerId !== ownerId) {
    return { error: 'Access denied: Only the document owner can share or manage permissions', status: 403 };
  }

  const targetUser = getUserByEmail(targetEmail);
  if (!targetUser) {
    return {
      error: `User with email "${targetEmail}" was not found. Please choose a seeded user (e.g., bob@example.com, charlie@example.com).`,
      status: 404,
    };
  }

  if (targetUser.id === ownerId) {
    return { error: 'Cannot share document with yourself (you are the owner)', status: 400 };
  }

  const existingIndex = doc.collaborators.findIndex((c) => c.userId === targetUser.id);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    doc.collaborators[existingIndex].role = role;
    doc.collaborators[existingIndex].sharedAt = now;
  } else {
    doc.collaborators.push({
      userId: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      avatar: targetUser.avatar,
      role,
      sharedAt: now,
    });
  }

  saveDocuments(docs);
  return { doc };
}

export function resetStorageForTests(): void {
  memoryDocuments = JSON.parse(JSON.stringify(INITIAL_DOCUMENTS));
  saveDocuments(memoryDocuments!);
}

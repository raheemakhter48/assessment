export type CollaboratorRole = 'viewer' | 'editor';

export type AccessPermission = 'owner' | 'editor' | 'viewer' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
}

export const SEEDED_USERS: User[] = [
  {
    id: 'usr_alice',
    name: 'Alice',
    email: 'alice@example.com',
    avatar: '👩‍💼',
    title: 'Primary User & Owner',
  },
  {
    id: 'usr_bob',
    name: 'Bob',
    email: 'bob@example.com',
    avatar: '👨‍💻',
    title: 'Senior Collaborator',
  },
  {
    id: 'usr_charlie',
    name: 'Charlie',
    email: 'charlie@example.com',
    avatar: '👨‍🔬',
    title: 'Architecture Reviewer',
  },
];

export interface Collaborator {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: CollaboratorRole;
  sharedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string; // HTML string rendered and parsed by TipTap
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
}

export interface UserDocumentsResponse {
  owned: Document[];
  shared: (Document & { myRole: CollaboratorRole })[];
}

export interface CreateDocumentInput {
  title?: string;
  content?: string;
  ownerId: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
}

export interface ShareDocumentInput {
  email: string;
  role: CollaboratorRole;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

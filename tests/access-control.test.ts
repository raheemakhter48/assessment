import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
  shareDocument,
  createDocument,
  checkDocumentPermission,
  resetStorageForTests,
  SEEDED_USERS,
} from '../lib/storage';

describe('Document Access Control & Permission Enforcement', () => {
  beforeEach(() => {
    resetStorageForTests();
  });

  const aliceId = 'usr_alice';     // Alice (Owner of doc_welcome, doc_roadmap)
  const bobId = 'usr_bob';         // Bob (Editor on doc_welcome, Owner of doc_rfc_bob)
  const charlieId = 'usr_charlie'; // Charlie (Viewer on doc_rfc_bob, Owner of doc_sec_charlie)

  it('verifies that the document owner has full "owner" permission', () => {
    const result = getDocumentById('doc_welcome', aliceId);
    expect(result).not.toBeNull();
    expect(result?.permission).toBe('owner');
    expect(result?.doc.ownerId).toBe(aliceId);
  });

  it('verifies that an invited collaborator with "editor" role has editor access', () => {
    // doc_welcome has Bob as editor
    const result = getDocumentById('doc_welcome', bobId);
    expect(result).not.toBeNull();
    expect(result?.permission).toBe('editor');

    // Bob can update content as an editor
    const updateResult = updateDocument('doc_welcome', bobId, {
      content: '<p>Updated content by editor Bob</p>',
    });
    expect(updateResult.error).toBeUndefined();
    expect(updateResult.doc?.content).toBe('<p>Updated content by editor Bob</p>');
  });

  it('verifies that an unshared user is rejected with null permission (403)', () => {
    // Charlie is not shared on doc_welcome
    const result = getDocumentById('doc_welcome', charlieId);
    expect(result).not.toBeNull();
    expect(result?.permission).toBeNull();

    // Direct permission check returns null
    const permission = checkDocumentPermission(result!.doc, charlieId);
    expect(permission).toBeNull();

    // Trying to update should fail with 403
    const updateResult = updateDocument('doc_welcome', charlieId, {
      title: 'Hacked by Charlie',
    });
    expect(updateResult.status).toBe(403);
    expect(updateResult.error).toContain('Access denied');
  });

  it('verifies that a viewer has read access but is rejected from editing (403)', () => {
    // doc_rfc_bob is owned by Bob, Charlie is shared as 'viewer'
    const charlieView = getDocumentById('doc_rfc_bob', charlieId);
    expect(charlieView).not.toBeNull();
    expect(charlieView?.permission).toBe('viewer');

    // Attempting to edit content as viewer returns 403
    const updateAttempt = updateDocument('doc_rfc_bob', charlieId, {
      content: '<p>Illegal viewer edit attempt</p>',
    });
    expect(updateAttempt.status).toBe(403);
    expect(updateAttempt.error).toContain('read-only access');
  });

  it('verifies that only the document owner can share the document', () => {
    // Bob (editor on doc_welcome) attempts to share it with Charlie -> should be rejected with 403
    const illegalShare = shareDocument('doc_welcome', bobId, 'charlie@example.com', 'editor');
    expect(illegalShare.status).toBe(403);
    expect(illegalShare.error).toContain('Only the document owner can share');

    // Alice (owner of doc_welcome) shares with Charlie as viewer -> succeeds
    const legalShare = shareDocument('doc_welcome', aliceId, 'charlie@example.com', 'viewer');
    expect(legalShare.error).toBeUndefined();
    expect(legalShare.doc?.collaborators.some((c) => c.userId === charlieId && c.role === 'viewer')).toBe(true);

    // Now Charlie should have 'viewer' access to doc_welcome
    const charlieAccess = getDocumentById('doc_welcome', charlieId);
    expect(charlieAccess?.permission).toBe('viewer');
  });

  it('verifies that only the owner can delete the document', () => {
    // Bob (editor) tries to delete doc_welcome -> 403
    const deleteAttempt = deleteDocument('doc_welcome', bobId);
    expect(deleteAttempt.status).toBe(403);
    expect(deleteAttempt.error).toContain('Only the document owner can delete');

    // Alice (owner) deletes doc_welcome -> success
    const deleteSuccess = deleteDocument('doc_welcome', aliceId);
    expect(deleteSuccess.success).toBe(true);

    // Document is now gone (404)
    const findDeleted = getDocumentById('doc_welcome', aliceId);
    expect(findDeleted).toBeNull();
  });

  it('rejects sharing with non-existent user or self', () => {
    // Sharing with non-existent email -> 404
    const notFoundShare = shareDocument('doc_roadmap', aliceId, 'unknown@example.com', 'editor');
    expect(notFoundShare.status).toBe(404);

    // Sharing with self -> 400
    const selfShare = shareDocument('doc_roadmap', aliceId, 'alice@example.com', 'editor');
    expect(selfShare.status).toBe(400);
  });
});

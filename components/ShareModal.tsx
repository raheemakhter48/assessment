'use client';

import React, { useState } from 'react';
import { Document, CollaboratorRole } from '@/lib/types';
import { useAuth } from '@/context/UserContext';
import { X, Shield, Eye, Edit3, Check, AlertCircle, Loader2, KeyRound } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onShareSuccess: (updatedDoc: Document) => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  document,
  onShareSuccess,
}: ShareModalProps) {
  const { currentUser, allUsers, authHeaders } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter out current active user from suggested share recipients
  const availableRecipients = allUsers.filter((u) => u.id !== currentUser.id);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail) {
      setError('Please choose or enter a valid user email');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/documents/${document.id}/share`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          email: selectedEmail,
          role: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to share document');
      }

      setSuccessMsg(`ACCESS DELEGATED: ${selectedEmail.toUpperCase()} AS ${selectedRole.toUpperCase()}`);
      setSelectedEmail('');
      if (data.document) {
        onShareSuccess(data.document);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-xl bg-[#111218] border border-[#262838] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1d1f2b] flex items-center justify-between bg-[#0c0d12]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#171924] text-sky-400 border border-[#272b3c] flex items-center justify-center">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-xs font-mono-tech font-bold text-zinc-100 uppercase tracking-wider">
                DELEGATE_ACCESS_PERMISSIONS
              </h2>
              <p className="text-[10px] font-mono-tech text-zinc-500 truncate max-w-xs">{document.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-[#1a1c28] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 flex items-start gap-2 text-xs font-mono-tech text-red-400 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 flex items-start gap-2 text-xs font-mono-tech text-emerald-400 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add collaborator form */}
          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono-tech font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                TARGET_IDENTITY
              </label>

              {/* Quick-select chips */}
              <div className="flex flex-wrap gap-2 mb-2">
                {availableRecipients.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedEmail(user.email)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono-tech border transition-all ${
                      selectedEmail === user.email
                        ? 'bg-sky-950/80 text-sky-300 border-sky-800 shadow-sm'
                        : 'bg-[#151620] text-zinc-400 border-[#252837] hover:bg-[#1a1c28] hover:text-zinc-200'
                    }`}
                  >
                    <span>{user.avatar}</span>
                    <span>{user.name.toUpperCase()}</span>
                  </button>
                ))}
              </div>

              <input
                type="email"
                id="share-email-input"
                placeholder="colleague@example.com"
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono-tech rounded-lg border border-[#242738] bg-[#0c0d12] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all"
              />
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-[11px] font-mono-tech font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                ASSIGN_PRIVILEGE_TIER
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="role-select-editor"
                  onClick={() => setSelectedRole('editor')}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    selectedRole === 'editor'
                      ? 'border-sky-600 bg-sky-950/40 ring-1 ring-sky-500/30'
                      : 'border-[#242738] hover:border-[#33374d] bg-[#12131b]'
                  }`}
                >
                  <Edit3
                    className={`w-3.5 h-3.5 mt-0.5 ${
                      selectedRole === 'editor' ? 'text-sky-400' : 'text-zinc-500'
                    }`}
                  />
                  <div>
                    <span className="block text-xs font-mono-tech font-bold text-zinc-200 uppercase">EDITOR</span>
                    <span className="block text-[10px] font-mono-tech text-zinc-500">Read & Write Buffer</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="role-select-viewer"
                  onClick={() => setSelectedRole('viewer')}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    selectedRole === 'viewer'
                      ? 'border-sky-600 bg-sky-950/40 ring-1 ring-sky-500/30'
                      : 'border-[#242738] hover:border-[#33374d] bg-[#12131b]'
                  }`}
                >
                  <Eye
                    className={`w-3.5 h-3.5 mt-0.5 ${
                      selectedRole === 'viewer' ? 'text-sky-400' : 'text-zinc-500'
                    }`}
                  />
                  <div>
                    <span className="block text-xs font-mono-tech font-bold text-zinc-200 uppercase">VIEWER</span>
                    <span className="block text-[10px] font-mono-tech text-zinc-500">Read-Only Audit</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="share-submit-button"
              disabled={loading || !selectedEmail}
              className="w-full py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono-tech font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(14,165,233,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>COMMITTING PRIVILEGE...</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>COMMIT_ACCESS_GRANT</span>
                </>
              )}
            </button>
          </form>

          {/* Current Collaborators */}
          <div className="pt-3 border-t border-[#1d1f2b]">
            <h3 className="text-[10px] font-mono-tech font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
              CURRENT_ACCESS_MATRIX
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {/* Document Owner */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0d0e14] border border-[#1d1f2b]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#161822] text-xs flex items-center justify-center border border-[#272b3c]">
                    👩‍💼
                  </div>
                  <div>
                    <p className="text-xs font-mono-tech font-bold text-zinc-200">{document.ownerName.toUpperCase()}</p>
                    <p className="text-[10px] font-mono-tech text-zinc-500">{document.ownerEmail}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono-tech font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  OWNER
                </span>
              </div>

              {/* Shared Collaborators */}
              {document.collaborators.length === 0 ? (
                <p className="text-[11px] font-mono-tech text-zinc-600 italic py-1.5 text-center">
                  NO_DELEGATED_PEERS
                </p>
              ) : (
                document.collaborators.map((c) => (
                  <div
                    key={c.userId}
                    className="flex items-center justify-between p-2 rounded-lg border border-[#1e202d] bg-[#12131b] hover:bg-[#161822] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#181a24] text-xs flex items-center justify-center border border-[#252838]">
                        {c.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-mono-tech font-bold text-zinc-300">{c.name.toUpperCase()}</p>
                        <p className="text-[10px] font-mono-tech text-zinc-500">{c.email}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono-tech font-bold px-1.5 py-0.5 rounded uppercase ${
                        c.role === 'editor'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {c.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

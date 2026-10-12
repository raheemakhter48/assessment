'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/context/UserContext';
import { Document, AccessPermission, SaveStatus } from '@/lib/types';
import ShareModal from '@/components/ShareModal';
import {
  ArrowLeft,
  Share2,
  Lock,
  Edit3,
  ShieldAlert,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Users,
  Terminal,
  Cpu,
} from 'lucide-react';

// Dynamic import with SSR disabled for TipTap editor
const TipTapEditor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-[#111218] rounded-xl border border-[#222432] flex items-center justify-center text-zinc-500 font-mono-tech text-xs">
      <Loader2 className="w-5 h-5 animate-spin text-sky-400 mr-2" />
      <span>INITIALIZING EDITOR COMPONENT...</span>
    </div>
  ),
});

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, authHeaders } = useAuth();
  const docId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [permission, setPermission] = useState<AccessPermission>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Title state and debounced title saving
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const titleDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Fetch document
  const fetchDoc = useCallback(async () => {
    try {
      setLoading(true);
      setErrorStatus(null);
      setErrorMessage(null);

      const res = await fetch(`/api/documents/${docId}`, {
        headers: { 'x-user-id': currentUser.id },
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorStatus(res.status);
        setErrorMessage(data.error || 'Failed to load document');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setDocument(data.document);
      setPermission(data.permission);
      setTitle(data.document.title);
    } catch (err: any) {
      setErrorStatus(500);
      setErrorMessage(err.message || 'Error loading document');
    } finally {
      setLoading(false);
    }
  }, [docId, currentUser.id]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  // Handle title edit with debouncing
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (permission === 'viewer') return;

    setSaveStatus('saving');

    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
    }

    titleDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/documents/${docId}`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ title: newTitle }),
        });

        if (res.ok) {
          const updated = await res.json();
          setDocument(updated);
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch {
        setSaveStatus('error');
      }
    }, 800);
  };

  // Handle rich text content auto-save
  const handleContentAutoSave = async (htmlContent: string): Promise<boolean> => {
    if (permission === 'viewer') return false;

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ content: htmlContent }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDocument(updated);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to auto-save content:', err);
      return false;
    }
  };

  // Handle export / download
  const handleExport = () => {
    if (!document) return;
    const plainText = document.content
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<[^>]+>/g, '');

    const blob = new Blob([plainText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/[^a-z0-9_-]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle document deletion
  const handleDelete = async () => {
    if (!confirm('CONFIRM PURGE: Are you sure you want to permanently delete this document?')) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
        return;
      }

      router.push('/');
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current);
      }
    };
  }, []);

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-500 font-mono-tech">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-4" />
        <p className="text-xs tracking-wider uppercase">AUTHENTICATING ACCESS & LOADING BUFFER...</p>
      </div>
    );
  }

  // 2. 403 Forbidden Access State (Tactical Security Screen)
  if (errorStatus === 403) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111218] rounded-xl border border-red-900/60 p-7 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-lg bg-red-950/60 text-red-400 border border-red-800/60 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-mono-tech text-red-400 uppercase tracking-widest block mb-1">
            SECURITY_EXCEPT::403_FORBIDDEN
          </span>
          <h2 className="text-lg font-mono-tech font-bold text-zinc-100 mb-2">ACCESS_DENIED</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-mono-tech">
            {errorMessage ||
              'Your active identity lacks cryptographic authorization for this resource. Document is locked to invited collaborators.'}
          </p>

          <div className="p-3 bg-[#0a0b10] rounded-lg border border-[#1e202d] text-left mb-6 font-mono-tech text-xs">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
              CURRENT_IDENTITY
            </span>
            <div className="flex items-center gap-2 text-zinc-300">
              <span>{currentUser.avatar}</span>
              <span className="font-bold">{currentUser.name.toUpperCase()}</span>
              <span className="text-[10px] text-zinc-500">[{currentUser.email}]</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">
              REMEDY: Use the top-right switcher to assume authorized credentials (e.g., Alice or Bob).
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-[#181a24] hover:bg-[#202230] text-zinc-200 border border-[#2b2e40] font-mono-tech text-xs uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN_TO_DASHBOARD</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. 404 or other errors
  if (errorStatus || !document) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111218] rounded-xl border border-[#242738] p-7 shadow-xl text-center">
          <div className="w-14 h-14 rounded-lg bg-[#181a24] text-zinc-400 border border-[#272a3a] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-mono-tech text-zinc-500 uppercase tracking-widest block mb-1">
            RECORD_ERROR::404
          </span>
          <h2 className="text-lg font-mono-tech font-bold text-zinc-100 mb-2">DOCUMENT_NOT_FOUND</h2>
          <p className="text-xs text-zinc-400 mb-6 font-mono-tech">
            {errorMessage || 'The requested document does not exist in cluster storage.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono-tech text-xs uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK_TO_DASHBOARD</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = permission === 'owner';
  const isViewer = permission === 'viewer';

  return (
    <div className="flex-1 flex flex-col bg-[#090a0f]">
      {/* Precision Instrument Header Bar */}
      <div className="sticky top-16 z-30 w-full bg-[#0c0d14]/95 backdrop-blur-md border-b border-[#1f2231] px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Back & Document Title input */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-[#181a24] border border-transparent hover:border-[#272a3a] transition-colors shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-[11px] font-mono-tech text-zinc-500 shrink-0">DOC//</span>
              <input
                type="text"
                id="document-title-input"
                value={title}
                onChange={handleTitleChange}
                disabled={isViewer}
                placeholder="Untitled Document"
                className={`w-full text-base sm:text-lg font-bold text-zinc-100 bg-transparent border-b border-transparent hover:border-[#2f3346] focus:border-sky-500 focus:outline-none transition-all px-1 py-0.5 rounded truncate font-mono-tech ${
                  isViewer ? 'cursor-default hover:border-transparent text-zinc-300' : ''
                }`}
              />
            </div>
          </div>

          {/* Right Meta & Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto font-mono-tech">
            {/* Permission Badge */}
            <span
              id="permission-badge"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border uppercase ${
                isOwner
                  ? 'bg-sky-950/80 text-sky-300 border-sky-800/60'
                  : permission === 'editor'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60'
              }`}
            >
              {isOwner ? (
                <>
                  <Edit3 className="w-3 h-3 text-sky-400" />
                  <span>PRIVILEGE::OWNER</span>
                </>
              ) : permission === 'editor' ? (
                <>
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  <span>PERM::EDITOR</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-zinc-400" />
                  <span>LOCK::VIEWER</span>
                </>
              )}
            </span>

            {/* Share Button (Only enabled for Owner) */}
            {isOwner ? (
              <button
                id="doc-share-button"
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono-tech uppercase tracking-wider transition-all active:scale-95 shadow-sm"
              >
                <Share2 className="w-3 h-3" />
                <span>SHARE</span>
                {document.collaborators.length > 0 && (
                  <span className="px-1 py-0.2 rounded bg-sky-800 text-[9px] font-bold">
                    {document.collaborators.length}
                  </span>
                )}
              </button>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#14151e] text-zinc-600 text-xs font-mono-tech uppercase border border-[#202230] cursor-not-allowed"
                title="Only owner can delegate access"
              >
                <Lock className="w-3 h-3" />
                <span>DELEGATE [OWNER]</span>
              </div>
            )}

            {/* Export Markdown */}
            <button
              onClick={handleExport}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-[#181a24] border border-[#242738] transition-colors"
              title="Export as Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Delete button (owner only) */}
            {isOwner && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 border border-[#242738] hover:border-red-900 transition-colors"
                title="Purge Document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content Workspace */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        <TipTapEditor
          initialContent={document.content}
          readOnly={isViewer}
          onAutoSave={handleContentAutoSave}
          saveStatus={saveStatus}
          setSaveStatus={setSaveStatus}
        />
      </div>

      {/* Share Modal */}
      {isOwner && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          document={document}
          onShareSuccess={(updated) => {
            setDocument(updated);
          }}
        />
      )}
    </div>
  );
}

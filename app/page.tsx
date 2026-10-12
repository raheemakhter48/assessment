'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/UserContext';
import { Document, CollaboratorRole } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import FileUploadModal from '@/components/FileUploadModal';
import ShareModal from '@/components/ShareModal';
import {
  Plus,
  Upload,
  FileText,
  Clock,
  Users,
  Search,
  Share2,
  Trash2,
  Lock,
  Edit3,
  Eye,
  Loader2,
  ChevronRight,
  FolderLock,
  Layers,
  HardDrive,
  Database,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, authHeaders } = useAuth();

  const [ownedDocs, setOwnedDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<(Document & { myRole: CollaboratorRole })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'shared'>('all');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [shareDocTarget, setShareDocTarget] = useState<Document | null>(null);

  // Creating state
  const [creating, setCreating] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents?userId=${currentUser.id}`, {
        headers: { 'x-user-id': currentUser.id },
      });
      if (!res.ok) throw new Error('Failed to load documents');
      const data = await res.json();
      setOwnedDocs(data.owned || []);
      setSharedDocs(data.shared || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreateNew = async () => {
    try {
      setCreating(true);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: 'Untitled Document',
          content: '<p></p>',
          ownerId: currentUser.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to create new document');
      const newDoc = await res.json();
      router.push(`/doc/${newDoc.id}`);
    } catch (err) {
      console.error('Error creating doc:', err);
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('CONFIRMATION REQUIRED: Permanently purge this document from cluster storage?')) {
      return;
    }

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

      setOwnedDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const filteredOwned = ownedDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShared = sharedDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = ownedDocs.length + sharedDocs.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Industrial Operations Banner */}
      <div className="industrial-panel rounded-xl p-6 sm:p-7 mb-8 border border-[#222533] relative overflow-hidden">
        {/* Subtle grid watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-sky-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#171924] border border-[#26293a] text-[10px] font-mono-tech text-sky-400 uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>TERMINAL_NODE // {currentUser.id.toUpperCase()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
              <span>DOCUMENT REPOSITORY</span>
              <span className="text-xs font-mono-tech px-2 py-0.5 rounded bg-[#1c1e2b] text-zinc-400 border border-[#292d3f] font-normal">
                FS_PERSISTENCE
              </span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl font-mono-tech">
              Secure rich-text document management system with verified ACL matrix & debounced synchronization.
            </p>
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="import-file-button"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#151722] hover:bg-[#1c1e2c] text-zinc-200 border border-[#2a2d3e] hover:border-zinc-500 text-xs font-mono-tech uppercase tracking-wider transition-all active:scale-95 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>IMPORT_FILE</span>
            </button>

            <button
              id="new-document-button"
              onClick={handleCreateNew}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 text-xs font-mono-tech uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(14,165,233,0.25)] active:scale-95 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>INITIALIZING...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ NEW_DOCUMENT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Industrial Telemetry Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#1b1d28]">
          <div className="bg-[#0c0d13] p-3 rounded-lg border border-[#1d1f2b]">
            <span className="text-[10px] font-mono-tech text-zinc-500 uppercase tracking-widest block">
              TOTAL_INDEXED
            </span>
            <span className="text-lg font-mono-tech font-bold text-zinc-200 mt-0.5 block">
              {totalCount.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="bg-[#0c0d13] p-3 rounded-lg border border-[#1d1f2b]">
            <span className="text-[10px] font-mono-tech text-zinc-500 uppercase tracking-widest block">
              OWNED_DOCS
            </span>
            <span className="text-lg font-mono-tech font-bold text-sky-400 mt-0.5 block">
              {ownedDocs.length.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="bg-[#0c0d13] p-3 rounded-lg border border-[#1d1f2b]">
            <span className="text-[10px] font-mono-tech text-zinc-500 uppercase tracking-widest block">
              SHARED_INGRESS
            </span>
            <span className="text-lg font-mono-tech font-bold text-amber-400 mt-0.5 block">
              {sharedDocs.length.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="bg-[#0c0d13] p-3 rounded-lg border border-[#1d1f2b]">
            <span className="text-[10px] font-mono-tech text-zinc-500 uppercase tracking-widest block">
              STORAGE_STATUS
            </span>
            <span className="text-xs font-mono-tech font-bold text-emerald-400 mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              PERSISTENT_OK
            </span>
          </div>
        </div>
      </div>

      {/* Control Segment & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        {/* Mechanical Segmented Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#101117] rounded-lg border border-[#222432] w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-mono-tech font-semibold transition-all uppercase tracking-wider ${
              activeTab === 'all'
                ? 'bg-[#1e202d] text-zinc-100 shadow-sm border border-[#2e3144]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ALL [{totalCount}]
          </button>
          <button
            id="tab-my-documents"
            onClick={() => setActiveTab('owned')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-mono-tech font-semibold transition-all uppercase tracking-wider ${
              activeTab === 'owned'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            MY_DOCS [{ownedDocs.length}]
          </button>
          <button
            id="tab-shared-with-me"
            onClick={() => setActiveTab('shared')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-mono-tech font-semibold transition-all uppercase tracking-wider ${
              activeTab === 'shared'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            SHARED [{sharedDocs.length}]
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            id="search-documents-input"
            placeholder="FILTER_BY_TITLE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-mono-tech rounded-lg border border-[#242735] bg-[#111218] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/30 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-7 h-7 animate-spin text-sky-400 mb-3" />
          <p className="text-xs font-mono-tech tracking-wider uppercase">SYNCHRONIZING REPOSITORY...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Section 1: My Documents */}
          {(activeTab === 'all' || activeTab === 'owned') && (
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[#1b1d28] pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-mono-tech font-bold uppercase tracking-wider text-zinc-200">
                    OWNED_DOCUMENTS
                  </h2>
                  <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                    COUNT: {filteredOwned.length}
                  </span>
                </div>
                <p className="text-[11px] font-mono-tech text-zinc-500">ROOT_AUTHOR: {currentUser.name.toUpperCase()}</p>
              </div>

              {filteredOwned.length === 0 ? (
                <div className="p-8 border border-dashed border-[#242736] rounded-xl text-center bg-[#0d0e14]/50">
                  <FileText className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs font-mono-tech text-zinc-400 mb-1">ZERO_RECORDS_LOCATED</p>
                  <p className="text-[11px] font-mono-tech text-zinc-600 mb-4">
                    {searchQuery ? 'Filter query returned no matches.' : 'Initialize your first document below.'}
                  </p>
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-mono-tech hover:bg-sky-500 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>CREATE_DOCUMENT</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOwned.map((doc) => (
                    <div
                      key={doc.id}
                      className="group industrial-panel industrial-panel-hover rounded-xl p-4 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Card Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-sky-950/80 text-sky-300 border border-sky-800/60 uppercase">
                            OWNER
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              id={`share-doc-btn-${doc.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareDocTarget(doc);
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-sky-400 hover:bg-[#1a1c28] transition-colors"
                              title="Delegate Permissions"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              id={`delete-doc-btn-${doc.id}`}
                              onClick={(e) => handleDelete(e, doc.id)}
                              className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                              title="Purge Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Preview */}
                        <Link href={`/doc/${doc.id}`} className="block">
                          <h3 className="font-bold text-sm text-zinc-100 group-hover:text-sky-400 transition-colors line-clamp-1 mb-1">
                            {doc.title}
                          </h3>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">
                            {doc.content.replace(/<[^>]*>?/gm, ' ') || 'Empty buffer...'}
                          </p>
                        </Link>
                      </div>

                      {/* Footer */}
                      <div className="pt-3 mt-4 border-t border-[#1d1f2b] flex items-center justify-between text-[10px] font-mono-tech text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-600" />
                          <span>{formatDate(doc.updatedAt)}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          {doc.collaborators.length > 0 ? (
                            <span className="flex items-center gap-1 text-zinc-400 font-semibold">
                              <Users className="w-3 h-3 text-sky-400" />
                              <span>{doc.collaborators.length} COLLAB</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-zinc-600">
                              <FolderLock className="w-3 h-3" />
                              <span>PRIVATE</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Shared With Me */}
          {(activeTab === 'all' || activeTab === 'shared') && (
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[#1b1d28] pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-mono-tech font-bold uppercase tracking-wider text-zinc-200">
                    DELEGATED_ACCESS [SHARED]
                  </h2>
                  <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                    COUNT: {filteredShared.length}
                  </span>
                </div>
                <p className="text-[11px] font-mono-tech text-zinc-500">EXTERNAL INGRESS</p>
              </div>

              {filteredShared.length === 0 ? (
                <div className="p-8 border border-dashed border-[#242736] rounded-xl text-center bg-[#0d0e14]/50">
                  <Users className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs font-mono-tech text-zinc-400 mb-1">NO_SHARED_INGRESS</p>
                  <p className="text-[11px] font-mono-tech text-zinc-600">
                    Switch session identity to examine delegated authorization records.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredShared.map((doc) => {
                    const isEditor = doc.myRole === 'editor';
                    return (
                      <Link
                        key={doc.id}
                        href={`/doc/${doc.id}`}
                        className="group industrial-panel industrial-panel-hover rounded-xl p-4 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Role Badge and Owner info */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold border uppercase ${
                                isEditor
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60'
                              }`}
                            >
                              {isEditor ? (
                                <>
                                  <Edit3 className="w-2.5 h-2.5 text-amber-400" />
                                  <span>ROLE::EDITOR</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-2.5 h-2.5 text-zinc-400" />
                                  <span>ROLE::VIEWER</span>
                                </>
                              )}
                            </span>

                            <span className="text-[10px] font-mono-tech text-zinc-500">
                              BY: <span className="text-zinc-300 font-semibold">{doc.ownerName.toUpperCase()}</span>
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                            {doc.title}
                          </h3>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">
                            {doc.content.replace(/<[^>]*>?/gm, ' ') || 'Empty buffer...'}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="pt-3 mt-4 border-t border-[#1d1f2b] flex items-center justify-between text-[10px] font-mono-tech text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-600" />
                            <span>{formatDate(doc.updatedAt)}</span>
                          </span>

                          <span className="text-amber-400 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            <span>ACCESS</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={(docId) => {
          setUploadModalOpen(false);
          router.push(`/doc/${docId}`);
        }}
      />

      {/* Share Modal */}
      {shareDocTarget && (
        <ShareModal
          isOpen={Boolean(shareDocTarget)}
          onClose={() => setShareDocTarget(null)}
          document={shareDocTarget}
          onShareSuccess={(updated) => {
            setOwnedDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
        />
      )}
    </div>
  );
}

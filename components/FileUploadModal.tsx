'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/UserContext';
import { parseTextToHtml } from '@/lib/utils';
import { X, UploadCloud, FileCode, CheckCircle2, AlertCircle, Loader2, HardDrive } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newDocId: string) => void;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: FileUploadModalProps) {
  const { authHeaders } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [filePreview, setFilePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setError(null);
    const validExtensions = ['.txt', '.md'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setError('INVALID_FORMAT: ONLY .TXT AND .MD ALLOWED');
      return;
    }

    setSelectedFile(file);
    // Derive default title by stripping file extension
    const baseTitle = file.name.replace(/\.[^/.]+$/, '');
    setCustomTitle(baseTitle);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setFilePreview(text.slice(0, 350));
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('NO_FILE_STAGED');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const rawContent = (event.target?.result as string) || '';
          const htmlContent = parseTextToHtml(rawContent, selectedFile.name);

          const res = await fetch('/api/documents', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              title: customTitle.trim() || selectedFile.name,
              content: htmlContent,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to ingest file');
          }

          const createdDoc = await res.json();
          onUploadSuccess(createdDoc.id);
        } catch (postErr: any) {
          setError(postErr.message || 'INGESTION_FAILED');
          setLoading(false);
        }
      };

      reader.readAsText(selectedFile);
    } catch (err: any) {
      setError(err.message || 'FILE_READ_ERROR');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-xl bg-[#111218] border border-[#252838] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1d1f2b] flex items-center justify-between bg-[#0c0d12]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#171924] text-sky-400 border border-[#272b3c] flex items-center justify-center">
              <HardDrive className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 id="upload-modal-title" className="text-xs font-mono-tech font-bold text-zinc-100 uppercase tracking-wider">
                DOCUMENT_INGESTION_TERMINAL
              </h2>
              <p className="text-[10px] font-mono-tech text-zinc-500">INGEST .TXT OR .MD BUFFERS</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 flex items-start gap-2 text-xs font-mono-tech text-red-400 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-sky-500 bg-sky-950/30 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-600/70 bg-emerald-950/20'
                : 'border-[#272b3c] hover:border-[#3a3f56] bg-[#0c0d12]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-mono-tech font-bold text-zinc-200">{selectedFile.name}</p>
                  <p className="text-[10px] font-mono-tech text-zinc-500">
                    SIZE: {(selectedFile.size / 1024).toFixed(1)} KB // MIME: TEXT_BUFFER
                  </p>
                </div>
                <span className="text-[10px] font-mono-tech text-sky-400 underline mt-1">
                  CLICK_TO_CHANGE_TARGET
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded bg-[#161824] text-sky-400 border border-[#272b3c] flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-mono-tech font-semibold text-zinc-300">
                    DRAG_AND_DROP_FILE_OR_BROWSE
                  </p>
                  <p className="text-[10px] font-mono-tech text-zinc-500 mt-0.5">
                    SUPPORTS: [.TXT, .MD]
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Staged File Info */}
          {selectedFile && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-mono-tech font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  TARGET_DOCUMENT_IDENTIFIER
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Document Title"
                  required
                  className="w-full px-3 py-2 text-xs font-mono-tech rounded-lg border border-[#242738] bg-[#0c0d12] text-zinc-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                />
              </div>

              {/* Terminal Preview Box */}
              <div>
                <label className="block text-[10px] font-mono-tech text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileCode className="w-3 h-3" />
                  <span>STREAM_PREVIEW_BUFFER</span>
                </label>
                <div className="p-3 bg-[#08090d] rounded-lg border border-[#1e202d] text-[11px] font-mono-tech text-zinc-400 max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {filePreview || 'EMPTY_BUFFER'}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1d1f2b]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-mono-tech uppercase text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              ABORT
            </button>
            <button
              type="submit"
              id="confirm-import-button"
              disabled={loading || !selectedFile}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono-tech font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_12px_rgba(14,165,233,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>INGESTING...</span>
                </>
              ) : (
                <span>INGEST_AND_COMMIT</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

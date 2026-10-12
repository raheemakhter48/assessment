'use client';

import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { SaveStatus } from '@/lib/types';

interface EditorProps {
  initialContent: string;
  readOnly?: boolean;
  onAutoSave?: (htmlContent: string) => Promise<boolean>;
  saveStatus?: SaveStatus;
  setSaveStatus?: (status: SaveStatus) => void;
}

export default function Editor({
  initialContent,
  readOnly = false,
  onAutoSave,
  saveStatus = 'saved',
  setSaveStatus,
}: EditorProps) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: '// INITIALIZE DOCUMENT CONTENT BUFFER...',
      }),
    ],
    content: initialContent || '<p></p>',
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (readOnly) return;
      const html = editor.getHTML();

      if (setSaveStatus) {
        setSaveStatus('saving');
      }

      // Debounce auto-save by 800ms
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        if (onAutoSave) {
          const success = await onAutoSave(html);
          if (setSaveStatus) {
            setSaveStatus(success ? 'saved' : 'error');
          }
        }
      }, 800);
    },
  });

  // Keep editable state synced if permission changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  // Keep content synced if loaded externally or swapped
  useEffect(() => {
    if (editor && initialContent !== undefined && isFirstRender.current) {
      editor.commands.setContent(initialContent);
      isFirstRender.current = false;
    }
  }, [editor, initialContent]);

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-500 font-mono-tech text-xs">
        <Loader2 className="w-5 h-5 animate-spin text-sky-400 mr-2" />
        <span>INITIALIZING PROSEMIRROR RUNTIME...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#111218] rounded-xl border border-[#242738] shadow-2xl overflow-hidden flex flex-col">
      {/* Precision Instrument Toolbar */}
      <div className="border-b border-[#1f2231] bg-[#0c0d13] p-2 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2 select-none">
        {readOnly ? (
          <div className="flex items-center gap-2 text-xs font-mono-tech text-amber-400 bg-amber-950/40 px-3 py-1 rounded border border-amber-800/60">
            <Lock className="w-3.5 h-3.5" />
            <span>ACCESS_LOCK: READ-ONLY AUDIT MODE // MODIFICATIONS RESTRICTED</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {/* Bold */}
            <button
              type="button"
              id="toolbar-bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1c28] transition-colors ${
                editor.isActive('bold') ? 'bg-sky-950 text-sky-400 border border-sky-800/80' : 'border border-transparent'
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              type="button"
              id="toolbar-italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1c28] transition-colors ${
                editor.isActive('italic') ? 'bg-sky-950 text-sky-400 border border-sky-800/80' : 'border border-transparent'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              type="button"
              id="toolbar-underline"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1c28] transition-colors ${
                editor.isActive('underline') ? 'bg-sky-950 text-sky-400 border border-sky-800/80' : 'border border-transparent'
              }`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-[#232636] mx-1" />

            {/* Heading 1 */}
            <button
              type="button"
              id="toolbar-h1"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1c28] transition-colors ${
                editor.isActive('heading', { level: 1 }) ? 'bg-sky-950 text-sky-400 border border-sky-800/80' : 'border border-transparent'
              }`}
              title="Heading 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>

            {/* Heading 2 */}
            <button
              type="button"
              id="toolbar-h2"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1c28] transition-colors ${
                editor.isActive('heading', { level: 2 }) ? 'bg-sky-950 text-sky-400 border border-sky-800/80' : 'border border-transparent'
              }`}
              title="Heading 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-[#232636] mx-1" />

            {/* Bulleted List */}
            <button
              type="button"
              id="toolbar-bullet-list"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1c28] transition-colors ${
                editor.isActive('bulletList') ? 'bg-sky-950 text-sky-400 border border-sky-800/80' : 'border border-transparent'
              }`}
              title="Bulleted List"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              id="toolbar-ordered-list"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1c28] transition-colors ${
                editor.isActive('orderedList') ? 'bg-sky-950 text-sky-400 border border-sky-800/80' : 'border border-transparent'
              }`}
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            {/* Quote */}
            <button
              type="button"
              id="toolbar-blockquote"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1c28] transition-colors ${
                editor.isActive('blockquote') ? 'bg-sky-950 text-sky-400 border border-sky-800/80' : 'border border-transparent'
              }`}
              title="Quote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            {/* Code */}
            <button
              type="button"
              id="toolbar-code"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1c28] transition-colors ${
                editor.isActive('code') ? 'bg-sky-950 text-sky-400 border border-sky-800/80' : 'border border-transparent'
              }`}
              title="Inline Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-[#232636] mx-1" />

            {/* Undo */}
            <button
              type="button"
              id="toolbar-undo"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30 transition-colors"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            {/* Redo */}
            <button
              type="button"
              id="toolbar-redo"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30 transition-colors"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Industrial Telemetry / Save Status LED Indicator */}
        <div className="flex items-center gap-2 text-[11px] font-mono-tech px-2 py-0.5 rounded bg-[#13151f] border border-[#202332]">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>SYNC_BUFFER...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span>COMMITTED_OK</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-red-400">
              <AlertCircle className="w-3 h-3" />
              <span>IO_ERROR</span>
            </span>
          )}
          {saveStatus === 'idle' && (
            <span className="text-zinc-500 font-mono-tech">STATE: SYNCHRONIZED</span>
          )}
        </div>
      </div>

      {/* Industrial Buffer Content Area */}
      <div className="p-6 sm:p-10 min-h-[520px] cursor-text bg-[#0e0f15]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileText,
  Archive,
  Copy,
  Check,
  FolderInput,
} from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import type { Note } from '~/features/notes/types/note.types';
import type { Attachment } from '~/features/attachments/types/attachment.types';
import { exportEngineService } from '../services/exportEngine.service';
import {
  importEngineService,
  type ImportCandidate,
} from '../services/importEngine.service';
import { CollisionResolverDialog } from './CollisionResolverDialog';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeNote: Note;
  allNotes: Note[];
  allAttachments: Attachment[];
  onImportNotes: (newNotes: Note[]) => void;
}

export function ImportExportModal({
  isOpen,
  onClose,
  activeNote,
  allNotes,
  allAttachments,
  onImportNotes,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'note' | 'workspace'>('note');
  const [isCopied, setIsCopied] = useState(false);
  const [pendingCollisions, setPendingCollisions] = useState<
    { candidate: ImportCandidate; existing: Note }[]
  >([]);
  const [safeCandidates, setSafeCandidates] = useState<ImportCandidate[]>([]);
  const [isCollisionOpen, setIsCollisionOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCopyMarkdown = async () => {
    await exportEngineService.copyRawMarkdown(activeNote);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSingleFileInput = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const candidate = await importEngineService.parseSingleFile(file);
    const { safe, collisions } = importEngineService.detectCollisions(
      [candidate],
      allNotes
    );

    if (collisions.length > 0) {
      setSafeCandidates(safe);
      setPendingCollisions(collisions);
      setIsCollisionOpen(true);
    } else {
      applyImportedNotes([candidate]);
      onClose();
    }
    e.target.value = '';
  };

  const handleZipInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const candidates = await importEngineService.parseWorkspaceZip(file);
    const { safe, collisions } = importEngineService.detectCollisions(
      candidates,
      allNotes
    );

    if (collisions.length > 0) {
      setSafeCandidates(safe);
      setPendingCollisions(collisions);
      setIsCollisionOpen(true);
    } else {
      applyImportedNotes(safe);
      onClose();
    }
    e.target.value = '';
  };

  const applyImportedNotes = (candidates: ImportCandidate[]) => {
    const newNotes: Note[] = candidates.map((cand) => ({
      id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: cand.title,
      content: cand.content,
      tags: cand.tags,
      isPinned: false,
      isArchived: false,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      syncStatus: 'saved_locally',
    }));
    onImportNotes(newNotes);
  };

  const handleCollisionResolution = (
    resolutions: {
      candidate: ImportCandidate;
      action: 'rename' | 'overwrite' | 'skip';
    }[]
  ) => {
    const finalCandidates: ImportCandidate[] = [...safeCandidates];

    for (const res of resolutions) {
      if (res.action === 'rename') {
        finalCandidates.push({
          ...res.candidate,
          title: `${res.candidate.title} (Copy)`,
        });
      } else if (res.action === 'overwrite') {
        finalCandidates.push(res.candidate);
      }
      // 'skip' does nothing
    }

    applyImportedNotes(finalCandidates);
    setIsCollisionOpen(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stack-bg/80 backdrop-blur-sm font-mono text-stack-bone animate-fade-in"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        onChange={handleSingleFileInput}
        className="hidden"
      />
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        onChange={handleZipInput}
        className="hidden"
      />

      <div className="flex flex-col w-full max-w-xl border border-stack-metal bg-stack-surface rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stack-metal bg-stack-surface-raised">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-stack-bone">
              PORTABLE DATA MIGRATION
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stack-steel hover:text-stack-bone"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stack-metal/70 bg-stack-surface/60 text-xs">
          <button
            onClick={() => setActiveTab('note')}
            className={`flex-1 py-2.5 text-center font-bold transition-colors ${
              activeTab === 'note'
                ? 'border-b-2 border-stack-red-slate text-stack-bone bg-stack-surface'
                : 'text-stack-steel hover:text-stack-silver'
            }`}
          >
            Current Document
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex-1 py-2.5 text-center font-bold transition-colors ${
              activeTab === 'workspace'
                ? 'border-b-2 border-stack-red-slate text-stack-bone bg-stack-surface'
                : 'text-stack-steel hover:text-stack-silver'
            }`}
          >
            Full Workspace Vault
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 text-xs">
          {activeTab === 'note' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-stack-bone">
                  Active Document: {activeNote.title}
                </h4>
                <p className="text-stack-steel text-[11px]">
                  Export or copy this document in standard UTF-8 Markdown.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() =>
                    exportEngineService.exportSingleMarkdown(activeNote)
                  }
                  className="justify-center"
                >
                  <FileText className="w-3.5 h-3.5 text-stack-silver" />
                  <span>Export .md</span>
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() =>
                    exportEngineService.exportSingleNoteZip(
                      activeNote,
                      allAttachments
                    )
                  }
                  className="justify-center"
                >
                  <Archive className="w-3.5 h-3.5 text-stack-red-hover" />
                  <span>Note + Assets ZIP</span>
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCopyMarkdown}
                  className="justify-center"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isCopied ? 'Copied!' : 'Copy Markdown'}</span>
                </Button>
              </div>

              <div className="pt-4 border-t border-stack-metal/60">
                <h4 className="font-bold text-stack-bone mb-1">
                  Import Single Document
                </h4>
                <p className="text-stack-steel text-[11px] mb-3">
                  Upload a plain `.md` or `.txt` file into your workspace.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select Markdown File</span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-stack-bone">
                  Complete Workspace Vault ({allNotes.length} Notes)
                </h4>
                <p className="text-stack-steel text-[11px] leading-relaxed">
                  Export all notes and media into a clean, portable ZIP archive.
                  Notes are stored as clean UTF-8 `.md` files readable in any
                  editor without proprietary lock-in.
                </p>
              </div>

              <div className="p-3 rounded border border-stack-metal bg-stack-surface-raised space-y-2">
                <span className="font-bold text-stack-bone text-[11px]">
                  Archive Structure:
                </span>
                <pre className="text-[10px] text-stack-steel">
                  stack-export-2026-09-27.zip{'\n'}
                  ├── notes/{'\n'}
                  ├── assets/{'\n'}
                  ├── attachments/{'\n'}
                  └── stack-manifest.json
                </pre>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() =>
                    exportEngineService.exportWorkspaceZip(
                      allNotes,
                      allAttachments
                    )
                  }
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Entire Workspace ZIP</span>
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => zipInputRef.current?.click()}
                >
                  <FolderInput className="w-3.5 h-3.5 text-stack-red-hover" />
                  <span>Import Existing Markdown Vault</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CollisionResolverDialog
        isOpen={isCollisionOpen}
        collisions={pendingCollisions}
        onResolve={handleCollisionResolution}
        onCancel={() => setIsCollisionOpen(false)}
      />
    </div>
  );
}

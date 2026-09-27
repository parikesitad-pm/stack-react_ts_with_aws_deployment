import { useState } from 'react';
import { AlertTriangle, Folder as FolderIcon, X } from 'lucide-react';
import type { Folder, Note } from '../types/note.types';
import { folderTreeService } from '../services/folderTree.service';

export interface SafeDeleteFolderModalProps {
  isOpen: boolean;
  folder: Folder | null;
  allFolders: Folder[];
  notes: Note[];
  onConfirm: (destinationFolderId: string | null) => void;
  onCancel: () => void;
}

export function SafeDeleteFolderModal({
  isOpen,
  folder,
  allFolders,
  notes,
  onConfirm,
  onCancel,
}: SafeDeleteFolderModalProps) {
  if (!isOpen || !folder) return null;

  const directNotes = notes.filter((n) => n.folderId === folder.id);
  const childFolders = allFolders.filter((f) => f.parentId === folder.id);
  const subtreeIds = folderTreeService.getFolderSubtreeIds(folder.id, allFolders);

  // Valid destinations exclude the folder itself and any descendant
  const validDestinationFolders = allFolders.filter((f) => !subtreeIds.has(f.id));

  // Default destination: the folder's parent, or root
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    folder.parentId
  );

  const handleConfirm = () => {
    onConfirm(selectedDestination);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs font-mono animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-lg border border-stack-metal/80 bg-stack-surface-raised p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-stack-metal/60">
          <div className="flex items-center gap-2 text-stack-bone">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold">Safe Delete Folder</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-stack-steel hover:text-stack-bone p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <p className="text-stack-silver">
            You are deleting folder <span className="font-bold text-stack-bone">"{folder.name}"</span>.
          </p>

          <div className="p-3 rounded bg-stack-metal/30 border border-stack-metal/50 space-y-1 text-stack-silver">
            <div>
              Direct Notes:{' '}
              <span className="font-bold text-stack-bone">{directNotes.length}</span>
            </div>
            <div>
              Immediate Subfolders:{' '}
              <span className="font-bold text-stack-bone">{childFolders.length}</span>
            </div>
            <div className="text-[11px] text-stack-steel pt-1 border-t border-stack-metal/40">
              Folder hierarchy is preserved: subfolder structures will not be flattened.
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-stack-steel uppercase tracking-wider block">
              Move direct items to:
            </label>
            <select
              value={selectedDestination ?? ''}
              onChange={(e) => setSelectedDestination(e.target.value ? e.target.value : null)}
              className="w-full px-3 py-2 rounded bg-stack-surface border border-stack-metal text-stack-bone focus:outline-none focus:border-stack-silver text-xs"
            >
              <option value="">Root Workspace (Top-level)</option>
              {validDestinationFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {folderTreeService.getFolderPath(f.id, allFolders)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-stack-metal/60">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded border border-stack-metal text-stack-steel hover:text-stack-bone hover:bg-stack-metal/50 transition-colors text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors text-xs"
          >
            Move & Delete
          </button>
        </div>
      </div>
    </div>
  );
}

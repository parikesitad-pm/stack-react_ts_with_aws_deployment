import { useState, useEffect } from 'react';
import { Folder as FolderIcon, X, ArrowRight } from 'lucide-react';
import type { Folder, Note } from '../types/note.types';
import { folderTreeService } from '../services/folderTree.service';

export interface MoveItemTarget {
  type: 'note' | 'folder';
  id: string;
  name: string;
  currentFolderId: string | null;
}

export interface MoveItemModalProps {
  isOpen: boolean;
  target: MoveItemTarget | null;
  allFolders: Folder[];
  onConfirm: (destinationFolderId: string | null) => void;
  onCancel: () => void;
}

export function MoveItemModal({
  isOpen,
  target,
  allFolders,
  onConfirm,
  onCancel,
}: MoveItemModalProps) {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setSelectedDestination(target.currentFolderId);
    }
  }, [target]);

  if (!isOpen || !target) return null;

  // If moving a folder, exclude the folder itself and all its descendants to prevent cycles
  let validFolders = allFolders;
  if (target.type === 'folder') {
    const subtreeIds = folderTreeService.getFolderSubtreeIds(target.id, allFolders);
    validFolders = allFolders.filter((f) => !subtreeIds.has(f.id));
  }

  const handleConfirm = () => {
    onConfirm(selectedDestination);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs font-mono animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-lg border border-stack-metal/80 bg-stack-surface-raised p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-stack-metal/60">
          <div className="flex items-center gap-2 text-stack-bone">
            <FolderIcon className="h-4 w-4 text-stack-steel" />
            <h2 className="text-sm font-bold">
              Move {target.type === 'note' ? 'Note' : 'Folder'}
            </h2>
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
          <div className="text-stack-silver">
            Moving <span className="font-bold text-stack-bone">"{target.name}"</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-stack-steel uppercase tracking-wider block">
              Select Destination:
            </label>
            <select
              value={selectedDestination ?? ''}
              onChange={(e) => setSelectedDestination(e.target.value ? e.target.value : null)}
              className="w-full px-3 py-2 rounded bg-stack-surface border border-stack-metal text-stack-bone focus:outline-none focus:border-stack-silver text-xs"
            >
              <option value="">Root Workspace (Top-level)</option>
              {validFolders.map((f) => (
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
            className="px-3 py-1.5 rounded bg-stack-metal hover:bg-stack-steel/20 text-stack-bone font-medium transition-colors text-xs inline-flex items-center gap-1.5"
          >
            <span>Move</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

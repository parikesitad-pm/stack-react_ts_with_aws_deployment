import { useState, useRef, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
import type { Folder, Note } from '../types/note.types';
import { folderTreeService } from '../services/folderTree.service';
import { FolderItem } from './FolderItem';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

export interface FolderTreeProps {
  folders: Folder[];
  notes: Note[];
  activeNoteId: string;
  expandedFolderIds: string[];
  onToggleExpand: (folderId: string) => void;
  onSelectNote: (noteId: string) => void;
  onMoveNoteToFolder: (noteId: string, targetFolderId: string | null) => void;
  onMoveFolder: (folderId: string, targetParentId: string | null) => void;
  onReorderFolder?: (
    sourceFolderId: string,
    targetFolderId: string,
    edge: 'before' | 'after'
  ) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folder: Folder) => void;
  onMoveFolderModal?: (folder: Folder) => void;
}

export function FolderTree({
  folders,
  notes,
  activeNoteId,
  expandedFolderIds,
  onToggleExpand,
  onSelectNote,
  onMoveNoteToFolder,
  onMoveFolder,
  onReorderFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolderModal,
}: FolderTreeProps) {
  const [isCreatingRoot, setIsCreatingRoot] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creationError, setCreationError] = useState<string | null>(null);
  const rootDropRef = useRef<HTMLDivElement | null>(null);
  const [isOverRoot, setIsOverRoot] = useState(false);

  const rootFolders = folderTreeService.getSortedRootFolders(folders);

  useEffect(() => {
    const el = rootDropRef.current;
    if (!el) return;

    const cleanup = dropTargetForElements({
      element: el,
      getData: () => ({ type: 'root' }),
      canDrop: ({ source }) => {
        return source.data.type === 'note' || source.data.type === 'folder';
      },
      onDragEnter: () => setIsOverRoot(true),
      onDragLeave: () => setIsOverRoot(false),
      onDrop: ({ source }) => {
        setIsOverRoot(false);
        const data = source.data;
        if (data.type === 'note') {
          onMoveNoteToFolder(data.noteId as string, null);
        } else if (data.type === 'folder') {
          onMoveFolder(data.folderId as string, null);
        }
      },
    });

    return () => cleanup();
  }, [onMoveNoteToFolder, onMoveFolder]);

  const handleCreateRootSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFolderName.trim();
    const validation = folderTreeService.validateFolderName(cleanName, null, folders);
    if (!validation.valid) {
      setCreationError(validation.error ?? 'Invalid name');
      return;
    }

    onCreateFolder(cleanName, null);
    setNewFolderName('');
    setCreationError(null);
    setIsCreatingRoot(false);
  };

  const handleCreateChild = (parentId: string) => {
    const childName = prompt('New folder name:');
    if (!childName) return;
    const clean = childName.trim();
    const validation = folderTreeService.validateFolderName(clean, parentId, folders);
    if (!validation.valid) {
      alert(validation.error ?? 'Invalid folder name');
      return;
    }
    onCreateFolder(clean, parentId);
    if (!expandedFolderIds.includes(parentId)) {
      onToggleExpand(parentId);
    }
  };

  return (
    <div
      ref={rootDropRef}
      className={`flex flex-col py-1 transition-colors rounded ${
        isOverRoot ? 'bg-stack-metal/30 ring-1 ring-stack-silver/30' : ''
      }`}
    >
      <div className="flex items-center justify-between px-3 py-1 text-[11px] font-mono tracking-wider text-stack-steel uppercase">
        <span>Folders</span>
        <button
          type="button"
          onClick={() => {
            setIsCreatingRoot((prev) => !prev);
            setCreationError(null);
          }}
          title="Create Top-Level Folder"
          className="p-1 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      </div>

      {isCreatingRoot && (
        <form onSubmit={handleCreateRootSubmit} className="px-3 py-1 space-y-1">
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => {
              setNewFolderName(e.target.value);
              setCreationError(null);
            }}
            placeholder="Folder name"
            maxLength={80}
            className="w-full bg-stack-surface border border-stack-steel/50 px-2 py-1 text-xs text-stack-bone rounded focus:outline-none focus:border-stack-silver font-mono"
          />
          {creationError && (
            <div className="text-[10px] text-stack-red-hover font-mono">{creationError}</div>
          )}
        </form>
      )}

      <div className="space-y-0.5 mt-0.5">
        {rootFolders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            allFolders={folders}
            notes={notes}
            activeNoteId={activeNoteId}
            depth={0}
            expandedFolderIds={expandedFolderIds}
            onToggleExpand={onToggleExpand}
            onSelectNote={onSelectNote}
            onMoveNoteToFolder={onMoveNoteToFolder}
            onMoveFolder={onMoveFolder}
            onReorderFolder={onReorderFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onMoveFolderModal={onMoveFolderModal}
            onCreateChildFolder={handleCreateChild}
          />
        ))}
      </div>
    </div>
  );
}

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
  onSelectNote: (noteId: string) => void;
  onMoveNoteToFolder: (noteId: string, targetFolderId: string | null) => void;
  onMoveFolder: (folderId: string, targetParentId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export function FolderTree({
  folders,
  notes,
  activeNoteId,
  onSelectNote,
  onMoveNoteToFolder,
  onMoveFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [isCreatingRoot, setIsCreatingRoot] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
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
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), null);
      setNewFolderName('');
      setIsCreatingRoot(false);
    }
  };

  const handleCreateChild = (parentId: string) => {
    const childName = prompt('New folder name:');
    if (childName?.trim()) {
      onCreateFolder(childName.trim(), parentId);
    }
  };

  return (
    <div
      ref={rootDropRef}
      className={`flex flex-col py-2 transition-colors ${
        isOverRoot ? 'bg-stack-metal/30 ring-1 ring-stack-silver/30' : ''
      }`}
    >
      <div className="flex items-center justify-between px-3 py-1 text-[11px] font-mono tracking-wider text-stack-steel uppercase">
        <span>Folders</span>
        <button
          type="button"
          onClick={() => setIsCreatingRoot((prev) => !prev)}
          title="Create Folder"
          className="p-1 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      </div>

      {isCreatingRoot && (
        <form onSubmit={handleCreateRootSubmit} className="px-3 py-1">
          <input
            type="text"
            autoFocus
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => {
              if (newFolderName.trim()) {
                onCreateFolder(newFolderName.trim(), null);
                setNewFolderName('');
              }
              setIsCreatingRoot(false);
            }}
            className="w-full bg-stack-surface-raised border border-stack-steel/50 px-2 py-1 text-xs text-stack-bone rounded focus:outline-none focus:ring-1 focus:ring-stack-silver"
          />
        </form>
      )}

      {rootFolders.length === 0 && !isCreatingRoot ? (
        <div className="px-3 py-1 text-[11px] font-mono text-stack-steel/60 italic">
          No folders yet
        </div>
      ) : (
        <div className="space-y-0.5 px-1">
          {rootFolders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              allFolders={folders}
              notes={notes}
              activeNoteId={activeNoteId}
              onSelectNote={onSelectNote}
              onMoveNoteToFolder={onMoveNoteToFolder}
              onMoveFolder={onMoveFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateChildFolder={handleCreateChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

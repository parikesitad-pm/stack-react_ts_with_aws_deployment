import { useState, useRef, useEffect } from 'react';
import {
  Folder as FolderIcon,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  FileText,
} from 'lucide-react';
import type { Folder, Note } from '../types/note.types';
import { folderTreeService } from '../services/folderTree.service';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

export interface FolderItemProps {
  folder: Folder;
  allFolders: Folder[];
  notes: Note[];
  activeNoteId: string;
  depth?: number;
  onSelectNote: (noteId: string) => void;
  onMoveNoteToFolder: (noteId: string, targetFolderId: string | null) => void;
  onMoveFolder: (folderId: string, targetParentId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateChildFolder: (parentId: string) => void;
}

export function FolderItem({
  folder,
  allFolders,
  notes,
  activeNoteId,
  depth = 0,
  onSelectNote,
  onMoveNoteToFolder,
  onMoveFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateChildFolder,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(folder.isExpanded ?? true);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(folder.name);
  const [showMenu, setShowMenu] = useState(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const elementRef = useRef<HTMLDivElement | null>(null);

  const childFolders = folderTreeService.getFolderChildren(folder.id, allFolders);
  const folderNotes = notes.filter((n) => n.folderId === folder.id);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const cleanupDraggable = draggable({
      element: el,
      getInitialData: () => ({ type: 'folder', folderId: folder.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const cleanupDropTarget = dropTargetForElements({
      element: el,
      getData: () => ({ type: 'folder', folderId: folder.id }),
      canDrop: ({ source }) => {
        const data = source.data;
        if (data.type === 'note') return true;
        if (data.type === 'folder') {
          const sourceFolderId = data.folderId as string;
          if (sourceFolderId === folder.id) return false;
          // Block if it creates a cycle
          return !folderTreeService.wouldCreateCycle(
            sourceFolderId,
            folder.id,
            allFolders
          );
        }
        return false;
      },
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false);
        const data = source.data;
        if (data.type === 'note') {
          onMoveNoteToFolder(data.noteId as string, folder.id);
        } else if (data.type === 'folder') {
          const sourceFolderId = data.folderId as string;
          if (
            sourceFolderId !== folder.id &&
            !folderTreeService.wouldCreateCycle(
              sourceFolderId,
              folder.id,
              allFolders
            )
          ) {
            onMoveFolder(sourceFolderId, folder.id);
          }
        }
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [folder.id, allFolders, onMoveNoteToFolder, onMoveFolder]);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onRenameFolder(folder.id, nameInput.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col select-none">
      <div
        ref={elementRef}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded text-xs transition-colors cursor-pointer ${
          isDragging ? 'opacity-40' : 'opacity-100'
        } ${
          isDraggedOver
            ? 'bg-stack-metal/60 text-stack-bone ring-1 ring-stack-silver/50'
            : 'text-stack-silver hover:bg-stack-metal/40 hover:text-stack-bone'
        }`}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            type="button"
            className="p-0.5 text-stack-steel hover:text-stack-bone rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-stack-silver shrink-0" />
          ) : (
            <FolderIcon className="h-3.5 w-3.5 text-stack-steel shrink-0" />
          )}

          {isEditing ? (
            <form
              onSubmit={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex-1"
            >
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => {
                  if (nameInput.trim()) onRenameFolder(folder.id, nameInput.trim());
                  setIsEditing(false);
                }}
                className="w-full bg-stack-surface border border-stack-steel/50 px-1 py-0.5 text-xs text-stack-bone rounded focus:outline-none"
              />
            </form>
          ) : (
            <span className="font-mono truncate">{folder.name}</span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title="New Subfolder"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
              onCreateChildFolder(folder.id);
            }}
            className="p-1 hover:text-stack-bone text-stack-steel rounded hover:bg-stack-metal"
          >
            <Plus className="h-3 w-3" />
          </button>
          <div className="relative">
            <button
              type="button"
              title="Folder options"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="p-1 hover:text-stack-bone text-stack-steel rounded hover:bg-stack-metal"
            >
              <MoreVertical className="h-3 w-3" />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-6 z-30 w-32 rounded bg-stack-surface-raised border border-stack-metal/80 shadow-xl py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-xs text-stack-silver hover:bg-stack-metal hover:text-stack-bone"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Rename</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteFolder(folder.id);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-xs text-red-400 hover:bg-stack-metal"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col space-y-0.5">
          {/* Child Folders */}
          {childFolders.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              notes={notes}
              activeNoteId={activeNoteId}
              depth={depth + 1}
              onSelectNote={onSelectNote}
              onMoveNoteToFolder={onMoveNoteToFolder}
              onMoveFolder={onMoveFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateChildFolder={onCreateChildFolder}
            />
          ))}

          {/* Notes inside this folder */}
          {folderNotes.map((note) => (
            <div
              key={note.id}
              style={{ paddingLeft: `${(depth + 1) * 12 + 10}px` }}
              onClick={() => onSelectNote(note.id)}
              className={`flex items-center gap-1.5 py-1 pr-2 rounded text-xs font-mono transition-colors cursor-pointer truncate ${
                note.id === activeNoteId
                  ? 'bg-stack-metal/70 text-stack-bone font-medium'
                  : 'text-stack-steel hover:text-stack-silver hover:bg-stack-metal/30'
              }`}
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate">{note.title || 'Untitled Note'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

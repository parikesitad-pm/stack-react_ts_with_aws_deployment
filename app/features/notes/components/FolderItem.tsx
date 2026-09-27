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
  FolderInput,
} from 'lucide-react';
import type { Folder, Note } from '../types/note.types';
import { folderTreeService } from '../services/folderTree.service';
import { noteOrganizationService } from '../services/noteOrganization.service';
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
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folder: Folder) => void;
  onMoveFolderModal?: (folder: Folder) => void;
  onCreateChildFolder: (parentId: string) => void;
}

export function FolderItem({
  folder,
  allFolders,
  notes,
  activeNoteId,
  depth = 0,
  expandedFolderIds,
  onToggleExpand,
  onSelectNote,
  onMoveNoteToFolder,
  onMoveFolder,
  onReorderFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolderModal,
  onCreateChildFolder,
}: FolderItemProps) {
  const isExpanded = expandedFolderIds.includes(folder.id);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(folder.name);
  const [showMenu, setShowMenu] = useState(false);
  const [dropState, setDropState] = useState<'before' | 'after' | 'inside' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const elementRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const childFolders = folderTreeService.getFolderChildren(folder.id, allFolders);
  // Strictly filter to active notes only (archive and trash excluded)
  const folderNotes = notes.filter(
    (n) => n.folderId === folder.id && noteOrganizationService.isNoteActive(n)
  );

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [showMenu]);

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
          // Disallow dropping folder into its own subtree
          return !folderTreeService.wouldCreateCycle(
            sourceFolderId,
            folder.id,
            allFolders
          );
        }
        return false;
      },
      onDragEnter: ({ source, location }) => {
        const rect = el.getBoundingClientRect();
        const y = location.current.input.clientY - rect.top;
        const h = rect.height;
        if (source.data.type === 'folder') {
          if (y < h * 0.25) setDropState('before');
          else if (y > h * 0.75) setDropState('after');
          else setDropState('inside');
        } else {
          setDropState('inside');
        }
      },
      onDrag: ({ source, location }) => {
        const rect = el.getBoundingClientRect();
        const y = location.current.input.clientY - rect.top;
        const h = rect.height;
        if (source.data.type === 'folder') {
          if (y < h * 0.25) setDropState('before');
          else if (y > h * 0.75) setDropState('after');
          else setDropState('inside');
        } else {
          setDropState('inside');
        }
      },
      onDragLeave: () => setDropState(null),
      onDrop: ({ source, location }) => {
        const rect = el.getBoundingClientRect();
        const y = location.current.input.clientY - rect.top;
        const h = rect.height;
        const currentDrop =
          source.data.type === 'folder'
            ? y < h * 0.25
              ? 'before'
              : y > h * 0.75
                ? 'after'
                : 'inside'
            : 'inside';

        setDropState(null);
        const data = source.data;

        if (data.type === 'note') {
          onMoveNoteToFolder(data.noteId as string, folder.id);
        } else if (data.type === 'folder') {
          const sourceFolderId = data.folderId as string;
          if (sourceFolderId === folder.id) return;

          if (currentDrop === 'inside') {
            if (!folderTreeService.wouldCreateCycle(sourceFolderId, folder.id, allFolders)) {
              onMoveFolder(sourceFolderId, folder.id);
            }
          } else if (currentDrop === 'before' || currentDrop === 'after') {
            if (onReorderFolder) {
              onReorderFolder(sourceFolderId, folder.id, currentDrop);
            } else if (!folderTreeService.wouldCreateCycle(sourceFolderId, folder.parentId, allFolders)) {
              onMoveFolder(sourceFolderId, folder.parentId);
            }
          }
        }
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [folder.id, folder.parentId, allFolders, onMoveNoteToFolder, onMoveFolder, onReorderFolder]);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onRenameFolder(folder.id, nameInput.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col select-none relative font-mono">
      {/* Explicit visual drop indicators for folder reordering */}
      {dropState === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-stack-red-slate shadow-sm z-30 pointer-events-none" />
      )}
      {dropState === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stack-red-slate shadow-sm z-30 pointer-events-none" />
      )}

      <div
        ref={elementRef}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded text-xs transition-colors cursor-pointer ${
          isDragging ? 'opacity-40' : 'opacity-100'
        } ${
          dropState === 'inside'
            ? 'bg-stack-metal/60 text-stack-bone ring-1 ring-stack-silver/50'
            : 'text-stack-silver hover:bg-stack-metal/40 hover:text-stack-bone'
        }`}
        onClick={() => onToggleExpand(folder.id)}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            type="button"
            className="p-0.5 text-stack-steel hover:text-stack-bone rounded"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(folder.id);
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
                  if (nameInput.trim())
                    onRenameFolder(folder.id, nameInput.trim());
                  setIsEditing(false);
                }}
                className="w-full bg-stack-surface border border-stack-steel/50 px-1 py-0.5 text-xs text-stack-bone rounded focus:outline-none"
              />
            </form>
          ) : (
            <span className="truncate">{folder.name}</span>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title="New Subfolder"
            onClick={(e) => {
              e.stopPropagation();
              onCreateChildFolder(folder.id);
            }}
            className="p-1 hover:text-stack-bone text-stack-steel rounded hover:bg-stack-metal"
          >
            <Plus className="h-3 w-3" />
          </button>

          <div className="relative" ref={menuRef}>
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
                className="absolute right-0 top-6 z-30 w-36 rounded bg-stack-surface-raised border border-stack-metal/80 shadow-xl py-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onCreateChildFolder(folder.id);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone"
                >
                  <Plus className="h-3 w-3" />
                  <span>New Subfolder</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Rename</span>
                </button>
                {onMoveFolderModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onMoveFolderModal(folder);
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone"
                  >
                    <FolderInput className="h-3 w-3" />
                    <span>Move folder…</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteFolder(folder);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-red-400 hover:bg-stack-metal"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete folder…</span>
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
              expandedFolderIds={expandedFolderIds}
              onToggleExpand={onToggleExpand}
              onSelectNote={onSelectNote}
              onMoveNoteToFolder={onMoveNoteToFolder}
              onMoveFolder={onMoveFolder}
              onReorderFolder={onReorderFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveFolderModal={onMoveFolderModal}
              onCreateChildFolder={onCreateChildFolder}
            />
          ))}

          {/* Notes inside this folder */}
          {folderNotes.map((note) => (
            <div
              key={note.id}
              style={{ paddingLeft: `${(depth + 1) * 12 + 10}px` }}
              onClick={() => onSelectNote(note.id)}
              className={`flex items-center gap-1.5 py-1 pr-2 rounded text-xs transition-colors cursor-pointer truncate ${
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

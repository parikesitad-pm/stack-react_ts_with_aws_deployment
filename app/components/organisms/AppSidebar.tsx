import { Plus, Pin, FileText, Settings, Tag, LogOut } from "lucide-react";
import { BrandLogo } from "~/components/atoms/BrandLogo";
import { Button } from "~/components/atoms/Button";
import { StatusIndicator, type SyncState } from "~/components/atoms/StatusIndicator";
import { SearchBar } from "~/components/molecules/SearchBar";
import { NoteListItem } from "~/features/notes/components/NoteListItem";
import type { Note, NoteFilter } from "~/features/notes/types/note.types";
import type { AuthUser } from "~/features/auth/types/auth.types";

export interface AppSidebarProps {
  notes: Note[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
  syncState: SyncState;
  activeFilter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  user?: AuthUser | null;
  onSignOut?: () => void;
  className?: string;
}

export function AppSidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onOpenSettings,
  onOpenCommandPalette,
  syncState,
  activeFilter,
  onFilterChange,
  user,
  onSignOut,
  className = "",
}: AppSidebarProps) {
  // Extract unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  const filteredNotes = notes.filter((n) => {
    if (activeFilter === "pinned") return n.isPinned;
    if (activeFilter === "all") return true;
    return n.tags.includes(activeFilter);
  });

  return (
    <aside
      className={`flex h-full w-80 flex-col border-r border-stack-metal/80 bg-stack-surface select-none ${className}`}
    >
      {/* Top Brand Bar */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-stack-metal/70 bg-stack-surface-raised">
        <BrandLogo size="sm" showWordmark={true} />
        <button
          onClick={onOpenSettings}
          title="Open Settings"
          className="rounded p-1.5 text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Actions and Search */}
      <div className="p-3 space-y-2 border-b border-stack-metal/40">
        <Button
          variant="primary"
          size="md"
          onClick={onCreateNote}
          className="w-full justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>New Document</span>
        </Button>
        <SearchBar onOpenPalette={onOpenCommandPalette} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-stack-metal/40 overflow-x-auto text-[11px] font-mono">
        <button
          onClick={() => onFilterChange("all")}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            activeFilter === "all"
              ? "bg-stack-metal text-stack-bone font-medium"
              : "text-stack-steel hover:text-stack-silver"
          }`}
        >
          <FileText className="h-3 w-3" />
          <span>All ({notes.length})</span>
        </button>
        <button
          onClick={() => onFilterChange("pinned")}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            activeFilter === "pinned"
              ? "bg-stack-metal text-stack-bone font-medium"
              : "text-stack-steel hover:text-stack-silver"
          }`}
        >
          <Pin className="h-3 w-3" />
          <span>Pinned</span>
        </button>
        {allTags.slice(0, 3).map((tag) => (
          <button
            key={tag}
            onClick={() => onFilterChange(tag)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              activeFilter === tag
                ? "bg-stack-metal text-stack-bone font-medium"
                : "text-stack-steel hover:text-stack-silver"
            }`}
          >
            <Tag className="h-2.5 w-2.5" />
            <span>#{tag}</span>
          </button>
        ))}
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredNotes.map((note) => (
          <NoteListItem
            key={note.id}
            note={{
              id: note.id,
              title: note.title,
              excerpt: note.content.slice(0, 100).replace(/[#*`_]/g, ""),
              updatedAt: note.updatedAt,
              tags: note.tags,
              isPinned: note.isPinned,
            }}
            isActive={note.id === activeNoteId}
            onSelect={onSelectNote}
          />
        ))}
      </div>

      {/* Operator and Logout bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-stack-metal/60 bg-stack-surface font-mono text-[10px]">
        <div className="flex flex-col truncate mr-2">
          <span className="font-bold text-stack-bone truncate">{user?.email || "operator"}</span>
          <span className="text-stack-steel truncate">sub: {user?.sub || "local"}</span>
        </div>
        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Sign Out"
            className="rounded p-1 text-stack-steel hover:text-stack-red-hover hover:bg-stack-metal transition-colors shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Bottom Status / Local Engine Bar */}
      <div className="flex h-9 items-center justify-between px-3 border-t border-stack-metal/70 bg-stack-surface-raised font-mono text-[11px]">
        <StatusIndicator status={syncState} />
        <span className="text-stack-steel text-[10px]">
          stack:user:{user?.sub ? user.sub.slice(0, 8) : "isolated"}
        </span>
      </div>
    </aside>
  );
}

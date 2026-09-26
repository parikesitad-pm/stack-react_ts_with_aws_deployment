import { Search } from "lucide-react";
import { Kbd } from "~/components/atoms/Kbd";

export interface SearchBarProps {
  value?: string;
  onChange?: (val: string) => void;
  onOpenPalette?: () => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value = "",
  onChange,
  onOpenPalette,
  placeholder = "Quick search notes...",
  className = "",
}: SearchBarProps) {
  return (
    <div
      onClick={onOpenPalette}
      className={`group relative flex items-center w-full rounded border border-stack-metal/70 bg-stack-surface px-3 py-1.5 transition-all hover:border-stack-steel/60 focus-within:border-stack-steel/80 cursor-pointer ${className}`}
    >
      <Search className="h-3.5 w-3.5 text-stack-steel transition-colors group-hover:text-stack-silver" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="ml-2 w-full bg-transparent font-mono text-xs text-stack-bone placeholder:text-stack-steel/70 focus:outline-none"
      />
      <div className="flex items-center gap-1">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </div>
    </div>
  );
}

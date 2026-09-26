export interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-14 w-14",
};

export function BrandLogo({
  size = "md",
  showWordmark = true,
  className = "",
}: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <picture className="inline-block shrink-0">
        <source srcSet="/brand/stack-logo.avif" type="image/avif" />
        <source srcSet="/brand/stack-logo.webp" type="image/webp" />
        <img
          src="/brand/stack-logo.webp"
          alt="STACK Emblem"
          className={`${sizeClasses[size]} object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]`}
          loading="eager"
        />
      </picture>
      {showWordmark && (
        <div className="flex flex-col select-none">
          <span className="font-mono text-sm font-bold tracking-wider text-stack-bone">
            STACK
          </span>
          <span className="font-mono text-[9px] tracking-widest text-stack-steel uppercase">
            A Modula Project
          </span>
        </div>
      )}
    </div>
  );
}

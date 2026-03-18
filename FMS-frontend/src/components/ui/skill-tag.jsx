import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function SkillTag({ children, onRemove, className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 text-[12px] font-medium",
        className,
      )}
      {...props}
    >
      <span className="leading-none">{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-primary/70 hover:text-primary hover:bg-primary/10"
          aria-label="Remove"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}


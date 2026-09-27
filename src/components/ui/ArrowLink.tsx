import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function ArrowLink({ className, children, ...props }: ComponentProps<"a">) {
  return (
    <a
      className={cn("group inline-flex items-center gap-1.5 text-sm leading-[1.2] font-medium text-ink", className)}
      {...props}
    >
      {children}
      <span aria-hidden className="text-accent-hover transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </a>
  );
}

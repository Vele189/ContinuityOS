import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

/**
 * Standard section header: eyebrow + two-tone Display/MD headline, where the
 * `muted` part renders in ink-tertiary.
 */
export function SectionHeader({
  index,
  eyebrow,
  title,
  muted,
  description,
  align = "left",
  className,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  muted?: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      <Eyebrow index={index} label={eyebrow} />
      <h2 className="max-w-[1040px] text-[30px] leading-[1.15] font-semibold tracking-[-0.8px] text-ink sm:text-display-md">
        {title}
        {muted && <span className="text-ink-tertiary"> {muted}</span>}
      </h2>
      {description && <p className="max-w-[640px] text-body-lg text-ink-subtle">{description}</p>}
    </header>
  );
}

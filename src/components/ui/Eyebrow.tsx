import { readable, rgba, SPECTRUM } from "@/lib/spectrum";
import { cn } from "@/lib/utils";

// Sections 02–09 walk the spectrum (the "CONTINUE" colours), one colour per section.
const FIRST = 2;
const LAST = 9;

function sectionColor(index: string) {
  const n = Math.min(LAST, Math.max(FIRST, Number.parseInt(index, 10) || FIRST));
  // Lifted where needed so the 17px label keeps 4.5:1 contrast
  return rgba(readable(SPECTRUM[Math.round(((n - FIRST) / (LAST - FIRST)) * (SPECTRUM.length - 1))]));
}

/**
 * Section marker — "02 —— WHY CONTINUITY EXISTS", in the brand font (Open Sans
 * ExtraBold, capitals). Each section gets its own single colour from the spectrum.
 */
export function Eyebrow({ index, label, className }: { index: string; label: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 font-brand text-[17px] leading-[1.3] font-extrabold tracking-[0.12em] uppercase",
        className,
      )}
      style={{ color: sectionColor(index) }}
    >
      <span>{index}</span>
      <span aria-hidden className="h-px w-6 bg-hairline-tertiary" />
      <span>{label}</span>
    </div>
  );
}

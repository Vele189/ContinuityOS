import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./comic-chip.css";

type RGB = [number, number, number];

/**
 * Comic brutal label (uiverse "comic-brutal-button"). `color` tints the frame,
 * shadow, index and hover fill; `frame` animates the frame (e.g. a flash).
 */
export function ComicChip({
  color,
  index,
  children,
  className,
  frame,
}: {
  color: RGB;
  index?: string;
  children: ReactNode;
  className?: string;
  frame?: HTMLMotionProps<"span">;
}) {
  return (
    <span className={cn("comic-chip", className)} style={{ "--chip": color.join(", ") } as React.CSSProperties}>
      <span aria-hidden className="comic-chip-shadow" />
      <motion.span aria-hidden className="comic-chip-frame" {...frame} />
      <span className="comic-chip-inner">
        <span className="comic-chip-text">
          {index ? <span className="comic-chip-index">{index}</span> : null}
          {children}
        </span>
        <span aria-hidden className="comic-chip-halftone" />
        <span aria-hidden className="comic-chip-splatter" />
      </span>
    </span>
  );
}

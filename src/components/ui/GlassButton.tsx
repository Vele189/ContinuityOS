import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import "./glass-button.css";

/** Liquid glass pill link (uiverse.io/shokat_2650/massive-snail-29). `block` stretches it full width. */
export function GlassButton({
  block = false,
  className,
  children,
  ...props
}: ComponentProps<"a"> & { block?: boolean }) {
  return (
    <div className={cn("glass-btn-wrap", block && "glass-btn-wrap--block", className)}>
      <a className="glass-btn" {...props}>
        <span>{children}</span>
      </a>
      <div aria-hidden className="glass-btn-shadow" />
    </div>
  );
}

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Page section shell: 1440 max width, 120px desktop gutters, 128px vertical rhythm. */
export function Section({ className, children, ...props }: ComponentProps<"section">) {
  return (
    <section className={cn("relative bg-canvas", className)} {...props}>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-16 px-6 py-24 lg:px-[120px] lg:py-32">
        {children}
      </div>
    </section>
  );
}

import { lazy, Suspense } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MountWhenNear } from "@/components/ui/MountWhenNear";
import { StageList } from "@/components/prism/StageList";

/** three.js + postprocessing are heavy, so the prism loads in its own chunk. */
const PrismStages = lazy(() => import("@/components/prism/PrismStages").then((m) => ({ default: m.PrismStages })));

/**
 * Figma: 04 — The Continuity Model (4:172). The seven stages are revealed by a
 * beam of light bouncing around a prism (see PrismStages).
 */
export function ContinuityModel() {
  return (
    <section id="model" className="border-t border-hairline bg-canvas">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-16 px-6 py-24 lg:px-[120px] lg:py-32">
        <header className="flex max-w-[900px] flex-col items-center gap-5 text-center">
          <Eyebrow index="04" label="How we work" />
          <h2 className="text-[36px] leading-[1.1] font-semibold tracking-[-1.2px] text-ink sm:text-display-lg">
            Research. Build.
            <br />
            Learn. Continue.
          </h2>
          <p className="max-w-[680px] text-body-lg text-ink-subtle">
            We don’t treat delivery as the end of the work. Building creates evidence. Evidence creates
            better questions. Better questions create what comes next.
          </p>
        </header>

        {/* Fetch and build the scene only as it nears the viewport */}
        <MountWhenNear className="min-h-[420px] w-full max-w-[1200px] sm:min-h-[520px] lg:min-h-[560px]">
          <Suspense fallback={null}>
            <PrismStages />
          </Suspense>
        </MountWhenNear>
        {/* The stages as text, in the prerendered HTML for screen readers and crawlers */}
        <StageList className="sr-only" />
      </div>
    </section>
  );
}

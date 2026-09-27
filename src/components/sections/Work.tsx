import { lazy, Suspense } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { MountWhenNear } from "@/components/ui/MountWhenNear";

/** three.js portals (clouds, grass and water worlds), loaded in their own chunk. */
const PortalGallery = lazy(() => import("@/components/portals/PortalGallery").then((m) => ({ default: m.PortalGallery })));

/** Figma: 06 — Work & Products (5:94). Content: three portals into different worlds. */
export function Work() {
  return (
    <Section id="work" className="border-t border-hairline [&>div]:gap-12">
      <header className="flex flex-col gap-5">
        <Eyebrow index="06" label="Work & products" />
        <h2 className="text-[36px] leading-[1.1] font-semibold tracking-[-1.2px] text-ink sm:text-display-lg">
          Proof we can build it.
          <br />
          <span className="text-ink-tertiary">Starting with our own product.</span>
        </h2>
      </header>
      {/* Fetch and build the scene only as it nears the viewport */}
      <MountWhenNear className="min-h-[560px] w-full sm:min-h-[720px]">
        <Suspense fallback={null}>
          <PortalGallery />
        </Suspense>
      </MountWhenNear>
    </Section>
  );
}

import { lazy, Suspense } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Section } from "@/components/ui/Section";
import { MountWhenNear } from "@/components/ui/MountWhenNear";

/** three.js card ring, loaded in its own chunk. */
const AudienceRing = lazy(() => import("@/components/audience/AudienceRing").then((m) => ({ default: m.AudienceRing })));

/** Figma: 08 — Who We Work With (6:71). Content: a ring of client-problem cards (see AudienceRing). */
export function WhoWeWorkWith() {
  return (
    <Section id="who" className="border-t border-hairline [&>div]:gap-14">
      <SectionHeader
        index="07"
        eyebrow="Who we work with"
        title={
          <span className="text-[36px] leading-[1.1] tracking-[-1.2px] sm:text-display-lg">
            Growing organizations
            <br />
            <span className="text-ink-tertiary">in the middle of meaningful change.</span>
          </span>
        }
        description="Businesses and organizations going through growth, repositioning or digital development, and who need the work to go beyond strategy."
        className="gap-5"
      />

      {/* Fetch and build the scene only as it nears the viewport */}
      <MountWhenNear className="min-h-[560px] w-full sm:min-h-[680px]">
        <Suspense fallback={null}>
          <AudienceRing />
        </Suspense>
      </MountWhenNear>
    </Section>
  );
}

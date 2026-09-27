import { Eyebrow } from "@/components/ui/Eyebrow";
import { BackgroundLines } from "@/components/ui/background-lines";
import { Section } from "@/components/ui/Section";
import { rgba, SPECTRUM } from "@/lib/spectrum";
import { TextGenerate } from "@/components/ui/TextGenerate";

// Background lines in the site spectrum (the "CONTINUE" colours), a little softened.
const lineColors = SPECTRUM.map((c) => rgba(c, 0.85));

/** Figma: 09 — About / Company Story (6:112). Aceternity: Background Lines behind the content. */
export function About() {
  return (
    <Section id="about" className="overflow-hidden border-t border-hairline">
      {/* Colourful lines racing out from the centre, behind everything */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70">
        <BackgroundLines className="relative h-full w-full" svgOptions={{ colors: lineColors, fit: "slice" }} />
      </div>
      <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:gap-20">
        <div className="flex flex-col gap-6 lg:w-[620px] lg:shrink-0">
          <Eyebrow index="08" label="Why we exist" />
          <h2 className="text-[30px] leading-[1.15] font-semibold tracking-[-1px] text-ink sm:text-display-md">
            <TextGenerate text="Meaningful work rarely fits neatly inside one category." />
          </h2>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:pt-11">
          <p className="text-body-lg text-ink-muted">
            ContinuityOS grew from building different things: technology, software, design, creative work
            and problem-solving.
          </p>
          <p className="text-body-lg text-ink-subtle">
            Rather than starting a new company for every new idea, ContinuityOS became the house where those
            capabilities could keep developing together.
          </p>
          <blockquote className="flex flex-col gap-1.5 rounded-r-xl border-l-2 border-accent-hover bg-surface-1 px-6 py-5 text-card-title">
            <span className="text-ink">What we build can change.</span>
            <span className="text-ink-subtle">The way we work does not.</span>
          </blockquote>
        </div>
      </div>
    </Section>
  );
}

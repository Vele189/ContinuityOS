import { HeroGlobe } from "@/components/ui/HeroGlobe";
import { Spotlight } from "@/components/ui/spotlight";
import { rgba, SPECTRUM } from "@/lib/spectrum";
import type { ReactNode } from "react";

/** Figma: 01 — Hero (3:20). Globe replaces the original black hole. */
export function Hero() {
  return (
    <section className="relative isolate h-[840px] overflow-hidden bg-canvas">
      {/* Globe — interactive three.js globe (drag to rotate), right side on desktop. */}
      <HeroGlobe className="absolute top-[70px] right-[-40px] h-[720px] w-[720px] max-lg:top-[260px] max-lg:right-[-200px] max-lg:h-[600px] max-lg:w-[600px] max-md:pointer-events-none max-md:opacity-50" />

      {/* Scrim — left */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(1,1,2,0.95)_0%,rgba(1,1,2,0.75)_30%,rgba(1,1,2,0.2)_52%,rgba(1,1,2,0)_64%)]"
      />
      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(1,1,2,0)_55%,rgba(1,1,2,0.7)_100%)]"
      />
      {/* Bottom fade */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-canvas/0 to-canvas" />

      {/* Aceternity: Spotlight — beam sweeps in from the top-left onto the headline */}
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-40" fill="white" />

      {/* Wrapper spans the full width, so let drags through to the globe. */}
      <div className="pointer-events-none relative z-10 mx-auto max-w-[1440px] px-6 pt-[191px] lg:px-[120px]">
        <div className="pointer-events-auto flex max-w-[760px] flex-col items-start gap-7">
          <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-1.6px] text-ink sm:text-[56px] lg:text-[72px] lg:tracking-[-2.6px]">
            We <Verb from={SPECTRUM[0]} to={SPECTRUM[2]}>research</Verb> problems,
            <br />
            <Verb from={SPECTRUM[3]} to={SPECTRUM[5]}>design</Verb> solutions,
            <br />
            <span className="bg-gradient-to-b from-[#fff3de] to-ink-subtle bg-clip-text text-transparent">and </span>
            <Verb from={SPECTRUM[6]} to={SPECTRUM[9]}>build</Verb>
            <span className="bg-gradient-to-b from-[#fff3de] to-ink-subtle bg-clip-text text-transparent"> them.</span>
          </h1>
          <p className="max-w-[520px] text-body-lg text-ink-subtle">
            ContinuityOS is a South African studio for software development, product and UX design,
            branding and AI automation. We bring research and execution together to turn important
            problems into real, working solutions.
          </p>
          <p className="font-script text-[32px] leading-[1.2] text-ink sm:text-[40px]">it simply continues</p>
        </div>
      </div>
    </section>
  );
}

/** Hero verb in a two-colour gradient from the site spectrum (the "CONTINUE" colours). */
function Verb({ from, to, children }: { from: [number, number, number]; to: [number, number, number]; children: ReactNode }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{ backgroundImage: `linear-gradient(90deg, ${rgba(from)}, ${rgba(to)})` }}
    >
      {children}
    </span>
  );
}

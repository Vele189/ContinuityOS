import { MotionConfig } from "motion/react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { About } from "@/components/sections/About";
import { Capabilities } from "@/components/sections/Capabilities";
import { ContinuityModel } from "@/components/sections/ContinuityModel";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Statement } from "@/components/sections/Statement";
import { ValueProposition } from "@/components/sections/ValueProposition";
import { WhoWeWorkWith } from "@/components/sections/WhoWeWorkWith";
import { WhyDifferent } from "@/components/sections/WhyDifferent";
import { Work } from "@/components/sections/Work";

export default function App() {
  return (
    // Honour the OS "reduce motion" setting for every motion animation (transforms skipped, fades kept)
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-surface-3 focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Statement />
        <ValueProposition />
        <Capabilities />
        <ContinuityModel />
        <WhyDifferent />
        <Work />
        <WhoWeWorkWith />
        <About />
        <FinalCta />
      </main>
      <Footer />
    </MotionConfig>
  );
}

import { nextSteps } from "@/content/site";
import { CtaBeams } from "@/components/ui/CtaBeams";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ContactForm } from "./ContactForm";

/** Figma: 10 — Final CTA + Lead Form (8:2). Aceternity: Background Beams. */
export function FinalCta() {
  return (
    <section id="contact" className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-4 pt-16 pb-24 sm:px-6 lg:px-[120px] lg:pb-32">
        {/* No panel of its own — sits on the page background */}
        <div className="relative overflow-hidden">
          {/* Edges feathered so the beams fade into the page instead of stopping at a box */}
          <CtaBeams className="cta-beams absolute top-[-1px] left-[-1px] h-[720px] w-[1200px] max-w-none [mask-image:radial-gradient(ellipse_60%_60%_at_40%_40%,black_40%,transparent_100%)]" />
          <div className="relative flex flex-col gap-12 p-6 sm:p-10 lg:min-h-[720px] lg:flex-row lg:gap-16 lg:p-16">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
              <Eyebrow index="09" label="Start a conversation" />
              <h2 className="text-[36px] leading-[1.1] font-semibold tracking-[-1.2px] text-ink sm:text-display-lg">
                Have a problem
                <br />
                worth solving?
              </h2>
              <p className="text-body-lg text-ink-subtle">Bring the problem. We’ll figure out what comes next.</p>
              <div className="flex flex-col pt-4">
                <p className="mb-3 text-eyebrow text-ink-tertiary">WHAT HAPPENS NEXT</p>
                <ol>
                  {nextSteps.map((step, i) => (
                    <li key={step} className="flex items-center gap-3.5 border-t border-hairline py-3">
                      <span className="text-mono text-accent-hover">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-body-sm text-ink-muted">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <a
                  href="#capabilities"
                  className="inline-flex items-center justify-center rounded-lg border border-hairline bg-surface-1 px-4 py-2.5 text-sm leading-[1.2] font-medium text-ink transition-colors hover:border-hairline-tertiary"
                >
                  Explore Continuity
                </a>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

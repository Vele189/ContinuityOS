import { lazy, Suspense, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconChartLine, IconPalette, IconSearch, IconTerminal2 } from "@tabler/icons-react";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { rgba, SPECTRUM } from "@/lib/spectrum";

/** WebGL dot matrix, only fetched on first hover so three.js stays out of the entry chunk. */
const CanvasRevealEffect = lazy(() =>
  import("@/components/ui/canvas-reveal-effect").then((m) => ({ default: m.CanvasRevealEffect })),
);

type RGB = [number, number, number];

// Four capabilities, summarised: the card shows the name; hover reveals the rest.
// Dot colours are pairs from the same spectrum as the benefits card ring.
const capabilities: {
  /** Anchor for nav links (#labs, #studio, …) */
  id: string;
  label: string;
  icon: ReactNode;
  title: string;
  body: string;
  link?: { href: string; label: string };
  colors: RGB[];
}[] = [
  {
    id: "continuum",
    label: "Product · Continuum",
    icon: <IconChartLine stroke={1.5} className="size-10" />,
    title: "Progress, not activity.",
    body: "Continuum shows where effort is going and whether projects are really moving.",
    link: { href: "#work", label: "Explore Continuum" },
    colors: [SPECTRUM[0], SPECTRUM[1]],
  },
  {
    id: "research",
    label: "Method · Research",
    icon: <IconSearch stroke={1.5} className="size-10" />,
    title: "Research connects it all.",
    body: "We decide what deserves to be built before committing resources to it.",
    colors: [SPECTRUM[2], SPECTRUM[3]],
  },
  {
    id: "labs",
    label: "Labs · Technology",
    icon: <IconTerminal2 stroke={1.5} className="size-10" />,
    title: "Systems built for real problems.",
    body: "Software, platforms, AI and the internal systems that stop holding teams back.",
    link: { href: "#contact", label: "Start a Labs project" },
    colors: [SPECTRUM[4], SPECTRUM[6]],
  },
  {
    id: "studio",
    label: "Studio · Creative",
    icon: <IconPalette stroke={1.5} className="size-10" />,
    title: "Creative with a purpose.",
    body: "Brand, interface and motion, made in the same process as the technology.",
    link: { href: "#contact", label: "Start a Studio project" },
    colors: [SPECTRUM[8], SPECTRUM[9]],
  },
];

/** Figma: 03 — What We Do (Capabilities) (4:44). Aceternity: Canvas Reveal Effect cards. */
export function Capabilities() {
  return (
    <Section id="capabilities" className="[&>div]:gap-12">
      <header className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-5">
          <Eyebrow index="03" label="What we do" />
          <h2 className="text-[36px] leading-[1.1] font-semibold tracking-[-1.2px] text-ink sm:text-display-lg">
            Products, Labs and Studio.
            <br />
            <span className="text-ink-tertiary">Connected by Research.</span>
          </h2>
        </div>
        <p className="max-w-[380px] text-body text-ink-subtle">
          Not twenty services. Four capabilities that work as one system, from the first question to the
          thing that ships.
        </p>
      </header>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {capabilities.map((c) => (
          <RevealCard key={c.label} {...c} />
        ))}
      </div>
    </Section>
  );
}

/**
 * Aceternity canvas-reveal card: bordered, "+" corner marks, icon at rest. On
 * hover (or focus) the dot matrix animates in and the summary lifts into place.
 */
function RevealCard({ id, label, icon, title, body, link, colors }: (typeof capabilities)[number]) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      id={id}
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHovered(false)}
      className="group/canvas-card relative flex h-[26rem] w-full scroll-mt-28 items-center justify-center border border-white/[0.2] p-6 outline-none focus-visible:border-accent-hover focus-visible:ring-2 focus-visible:ring-accent-hover"
    >
      <Plus className="absolute -top-3 -left-3 size-6 text-ink" />
      <Plus className="absolute -bottom-3 -left-3 size-6 text-ink" />
      <Plus className="absolute -top-3 -right-3 size-6 text-ink" />
      <Plus className="absolute -right-3 -bottom-3 size-6 text-ink" />

      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
            <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
              <CanvasRevealEffect
                animationSpeed={3}
                containerClassName="bg-black"
                colors={colors}
                dotSize={2}
                showGradient={false}
              />
            </Suspense>
            {/* Tint + radial fade, as in the demo */}
            <div className="absolute inset-0" style={{ background: rgba(colors[0], 0.12) }} />
            <div className="absolute inset-0 bg-black/80 [mask-image:radial-gradient(360px_at_center,white,transparent)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 flex w-full flex-col items-center text-center">
        {/* At rest: icon + name */}
        <div className="flex flex-col items-center gap-4 text-ink transition duration-200 group-hover/canvas-card:-translate-y-4 group-hover/canvas-card:opacity-0 group-focus-within/canvas-card:-translate-y-4 group-focus-within/canvas-card:opacity-0">
          {icon}
          <span className="text-eyebrow text-ink-subtle uppercase">{label}</span>
        </div>
        {/* On hover: the summary */}
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 opacity-0 transition duration-200 group-hover/canvas-card:-translate-y-[60%] group-hover/canvas-card:opacity-100 group-focus-within/canvas-card:-translate-y-[60%] group-focus-within/canvas-card:opacity-100">
          <span className="text-eyebrow text-white/70 uppercase">{label}</span>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="max-w-[240px] text-body-sm text-white/80">{body}</p>
          {link ? (
            <ArrowLink href={link.href} className="mt-2">
              {link.label}
            </ArrowLink>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The demo's corner "+" mark. */
function Plus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      aria-hidden
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
}

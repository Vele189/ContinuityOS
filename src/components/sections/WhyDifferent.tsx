import { lazy, Suspense, useId, useState } from "react";
import { motion } from "motion/react";
import { benefits, connectedChain, fragmentation } from "@/content/site";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { rgba, spread } from "@/lib/spectrum";
import { ComicChip } from "@/components/ui/ComicChip";
import { cn } from "@/lib/utils";
import { MountWhenNear } from "@/components/ui/MountWhenNear";

/** three.js carousel, loaded in its own chunk. */
const BenefitsCarousel = lazy(() =>
  import("@/components/benefits/BenefitsCarousel").then((m) => ({ default: m.BenefitsCarousel })),
);

/** Figma: 05 — Why Continuity Is Different (5:2). */
export function WhyDifferent() {
  return (
    <Section id="different" className="border-t border-hairline [&>div]:gap-14">
      <header className="flex flex-col items-start gap-5">
        <Eyebrow index="05" label="Why this structure is different" />
        <h2 className="text-[36px] leading-[1.1] font-semibold tracking-[-1.2px] text-ink sm:text-display-lg">
          Different capabilities.
          <br />
          <span className="text-ink-tertiary">One continuous process.</span>
        </h2>
      </header>
      <Compare />
      {/* Fetch and build the scene only as it nears the viewport */}
      <MountWhenNear className="min-h-[480px] w-full sm:min-h-[600px]">
        <Suspense fallback={null}>
          <BenefitsCarousel fallback={<Benefits />} />
        </Suspense>
      </MountWhenNear>
    </Section>
  );
}

/** Before / after, side by side (stacked below lg). No panel — just the divider, on the page background. */
function Compare() {
  return (
    <div className="grid w-full grid-cols-1 lg:grid-cols-2">
      <BeforePanel />
      <div className="relative">
        {/* Divider (stacked layout) */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent-hover/0 via-accent-hover/70 to-accent-hover/0 lg:hidden"
        />
        {/* Divider (side by side) */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-accent-hover/0 via-accent-hover/70 to-accent-hover/0 lg:block"
        />
        <AfterPanel />
      </div>
    </div>
  );
}

// Staircase indent: 22px per step on desktop, tighter on phones.
const stepIndent = ["", "pl-2 sm:pl-[22px]", "pl-4 sm:pl-[44px]", "pl-6 sm:pl-[66px]", "pl-8 sm:pl-[88px]"];

const EASE = [0.22, 1, 0.36, 1] as const;
const inView = { once: true, amount: 0.4 } as const;
// Infinite loops stop once scrolled fully out of view (and restart on the way back)
const loopView = { amount: 0 } as const;

// Handoff loop: each row passes the work on 0.7s after the one above it.
const HANDOFF_STEP = 0.9;
const HANDOFF_CYCLE = 5 * HANDOFF_STEP + 1.6;
// Each role flashes its own colour from the "CONTINUE" spectrum as it hands off.
const handoffColors = spread(5);

// Shot timing, relative to the chip's flash.
const SHOT_LAUNCH = 0.15;
const SHOT_FLIGHT = 0.36;
const SHOT_DISTANCE = 44; // px, the length of the dashed link minus the ball

type RGB = [number, number, number];

/** Repeat in step with the handoff loop, starting at `delay`. */
function onLoop(delay: number, duration: number) {
  return { delay, duration, repeat: Infinity, repeatDelay: HANDOFF_CYCLE - duration };
}

/** A glowing ball fired down the link; it squashes and pops as it hits. */
function Shot({ color, delay }: { color: RGB; delay: number }) {
  return (
    <motion.span
      className="absolute -top-1 -left-1 size-2 rounded-full"
      style={{ backgroundColor: rgba(color), boxShadow: `0 0 8px 1px ${rgba(color, 0.9)}` }}
      initial={{ x: 0, opacity: 0, scale: 0.6 }}
      whileInView={{
        x: [0, SHOT_DISTANCE, SHOT_DISTANCE],
        opacity: [0, 1, 1, 0],
        scaleX: [0.6, 1.3, 0.5, 1.8],
        scaleY: [0.6, 0.8, 1.4, 1.8],
      }}
      viewport={loopView}
      transition={{
        ...onLoop(delay, SHOT_FLIGHT + 0.08),
        ease: "easeIn",
        x: { ...onLoop(delay, SHOT_FLIGHT + 0.08), times: [0, 0.82, 1], ease: "easeIn" },
        opacity: { ...onLoop(delay, SHOT_FLIGHT + 0.08), times: [0, 0.1, 0.85, 1] },
        scaleX: { ...onLoop(delay, SHOT_FLIGHT + 0.08), times: [0, 0.7, 0.85, 1] },
        scaleY: { ...onLoop(delay, SHOT_FLIGHT + 0.08), times: [0, 0.7, 0.85, 1] },
      }}
    />
  );
}

// Spark directions for the impact burst (unit vectors, leaning back toward the shooter).
const SPARKS = [
  [-1, -0.9],
  [-1.1, 0],
  [-1, 0.9],
  [-0.3, -1.2],
  [-0.3, 1.2],
];

/** The loss, as a target: reticle + label. On impact it rings, sparks, shakes and gets struck out. */
function Target({ color, delay, children }: { color: RGB; delay: number; children: React.ReactNode }) {
  return (
    <motion.span
      className="relative inline-flex items-center gap-2 rounded-md border border-dashed px-2 py-1 text-mono sm:whitespace-nowrap"
      initial={{ borderColor: "#3e3e44", backgroundColor: rgba(color, 0), x: 0, color: "#62666d" }}
      whileInView={{
        x: [0, -4, 4, -3, 2, 0],
        borderColor: ["#3e3e44", rgba(color), "#3e3e44"],
        backgroundColor: [rgba(color, 0), rgba(color, 0.14), rgba(color, 0)],
        color: ["#62666d", "#f7f8f8", "#62666d"],
      }}
      viewport={loopView}
      transition={{ ...onLoop(delay, 0.45), ease: "easeOut" }}
    >
      {/* Impact: shockwave ring + sparks, on the target's left edge */}
      <span aria-hidden className="pointer-events-none absolute top-1/2 left-0">
        <motion.span
          className="absolute -top-3 -left-3 size-6 rounded-full border-2"
          style={{ borderColor: rgba(color) }}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: [0.2, 2.4], opacity: [0.9, 0] }}
          viewport={loopView}
          transition={{ ...onLoop(delay, 0.45), ease: "easeOut" }}
        />
        {SPARKS.map(([dx, dy], k) => (
          <motion.span
            key={k}
            className="absolute -top-px -left-px size-[3px] rounded-full"
            style={{ backgroundColor: rgba(color), boxShadow: `0 0 4px ${rgba(color)}` }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            whileInView={{ x: [0, dx * 16], y: [0, dy * 12], opacity: [1, 0], scale: [1, 0.4] }}
            viewport={loopView}
            transition={{ ...onLoop(delay, 0.4), ease: "easeOut" }}
          />
        ))}
      </span>

      {/* Reticle snaps round on hit */}
      <motion.svg
        aria-hidden
        viewBox="0 0 14 14"
        className="size-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        initial={{ rotate: 0 }}
        whileInView={{ rotate: [0, 90], scale: [1, 1.35, 1] }}
        viewport={loopView}
        transition={{ ...onLoop(delay, 0.45), ease: "easeOut" }}
      >
        <circle cx="7" cy="7" r="5" />
        <path d="M7 0.5v3M7 10.5v3M0.5 7h3M10.5 7h3" />
      </motion.svg>

      <span className="relative">
        {children}
        {/* Struck out: slash draws across, holds, fades before the next shot */}
        <motion.span
          aria-hidden
          className="absolute top-1/2 right-0 left-0 h-px origin-left"
          style={{ backgroundColor: rgba(color) }}
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: [0, 1, 1, 1], opacity: [1, 1, 1, 0] }}
          viewport={loopView}
          transition={{ ...onLoop(delay + 0.05, 1.6), times: [0, 0.15, 0.75, 1], ease: "easeOut" }}
        />
      </span>
    </motion.span>
  );
}

/** Work passes down the staircase and something is lost at every handoff. */
function BeforePanel() {
  return (
    <div className="flex flex-col gap-7 p-6 sm:p-10">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-eyebrow text-ink-tertiary">BEFORE</span>
        <span className="text-card-title text-ink-subtle">Traditional fragmentation</span>
      </div>
      <ul className="flex flex-col gap-4">
        {fragmentation.map((item, i) => {
          const enter = 0.15 + i * 0.14;
          const loop = { delay: 1.6 + i * HANDOFF_STEP, repeat: Infinity, repeatDelay: HANDOFF_CYCLE - HANDOFF_STEP };
          return (
            <motion.li
              key={item.role}
              className={cn("flex items-center gap-5", stepIndent[i])}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1 - i * 0.1, x: 0 }}
              viewport={inView}
              transition={{ duration: 0.5, delay: enter, ease: EASE }}
            >
              <ComicChip
                color={handoffColors[i]}
                frame={{
                  initial: { backgroundColor: "#34343a", boxShadow: `0 0 0px ${rgba(handoffColors[i], 0)}` },
                  whileInView: {
                    backgroundColor: ["#34343a", rgba(handoffColors[i]), "#34343a"],
                    boxShadow: [
                      `0 0 0px ${rgba(handoffColors[i], 0)}`,
                      `0 0 16px ${rgba(handoffColors[i], 0.6)}`,
                      `0 0 0px ${rgba(handoffColors[i], 0)}`,
                    ],
                  },
                  viewport: loopView,
                  transition: { ...loop, duration: HANDOFF_STEP, ease: "easeInOut" },
                }}
              >
                {item.role}
              </ComicChip>

              {/* Dashed handoff link; the chip fires a shot down it at the loss. */}
              <span aria-hidden className="relative w-12 shrink-0">
                <motion.span
                  className="block origin-left border-t border-dashed border-hairline-tertiary"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={inView}
                  transition={{ duration: 0.35, delay: enter + 0.25, ease: EASE }}
                />
                <Shot color={handoffColors[i]} delay={loop.delay + SHOT_LAUNCH} />
              </span>

              <motion.span
                initial={{ opacity: 0, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, filter: "blur(0px)" }}
                viewport={inView}
                transition={{ duration: 0.4, delay: enter + 0.45 }}
              >
                <Target color={handoffColors[i]} delay={loop.delay + SHOT_LAUNCH + SHOT_FLIGHT}>
                  {item.loss}
                </Target>
              </motion.span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

const chipPositions = [
  { left: 0, top: 0 },
  { left: 250, top: 0 },
  { left: 0, top: 86 },
  { left: 250, top: 86 },
  { left: 0, top: 172 },
  { left: 250, top: 172 },
];

/**
 * One continuous line through the chips' vertical centres (chips are 44px tall
 * at rows 0 / 86 / 172, so centres at 22 / 108 / 194). Stretches between chips
 * are hidden underneath them, so the line looks like it runs through each one.
 */
const CHAIN_PATH =
  "M60 22H420C443.75 22 463 41.25 463 65C463 88.75 443.75 108 420 108H70C51 108 40 120 40 151C40 182 51 194 70 194H300";
// Where each chip (in connectedChain order) sits along CHAIN_PATH, 0 → 1.
const chipAlongPath = [0.008, 0.217, 0.708, 0.491, 0.83, 1];

// Each capability lights up in its own spectrum colour as the pulse passes.
const chainColors = spread(6);

const DRAW = 1.8;
const PULSE = 3.2;
const PULSE_LEN = 0.12;

/** One line runs through every capability; a pulse keeps travelling it. */
function AfterPanel() {
  // Panel renders twice (desktop + mobile); each needs its own gradient id.
  const gradientId = useId();
  return (
    <div className="flex flex-col gap-7 py-6 pr-6 pl-6 sm:py-10 sm:pr-10 sm:pl-14">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-eyebrow text-accent-hover">CONTINUITY</span>
        <span className="text-card-title text-ink">One connected system</span>
      </div>
      <div className="relative h-[260px] w-[488px] max-w-full origin-top-left max-sm:scale-[0.7]">
        <svg aria-hidden width={488} height={260} viewBox="0 0 488 260" fill="none" overflow="visible" className="absolute inset-0">
          <defs>
            <linearGradient id={gradientId} x1="40" y1="108" x2="463" y2="108" gradientUnits="userSpaceOnUse">
              <stop stopColor="#828FFF" stopOpacity="0.4" />
              <stop offset="1" stopColor="#828FFF" />
            </linearGradient>
          </defs>
          <motion.path
            d={CHAIN_PATH}
            stroke={`url(#${gradientId})`}
            strokeWidth={1.5}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={inView}
            transition={{ duration: DRAW, ease: "easeInOut" }}
          />
          <motion.path
            d={CHAIN_PATH}
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px #828fff)" }}
            initial={{ pathLength: PULSE_LEN, pathOffset: 0, opacity: 0 }}
            whileInView={{ pathOffset: [0, 1 - PULSE_LEN], opacity: 1 }}
            viewport={loopView}
            transition={{
              pathOffset: { delay: DRAW, duration: PULSE, repeat: Infinity, ease: "linear" },
              opacity: { delay: DRAW, duration: 0.3 },
            }}
          />
        </svg>

        {connectedChain.map((label, i) => {
          const last = i === connectedChain.length - 1;
          const at = chipAlongPath[i];
          const color = chainColors[i];
          const rest = last ? "#5e6ad2" : "#34343a";
          // Glow as the pulse's centre passes this chip.
          const glowAt = DRAW + Math.min(1, Math.max(0, (at - PULSE_LEN / 2) / (1 - PULSE_LEN))) * PULSE;
          const glow = { delay: glowAt, duration: 0.6, repeat: Infinity, repeatDelay: PULSE - 0.6, ease: "easeInOut" } as const;
          return (
            <motion.div
              key={label}
              className="absolute"
              style={chipPositions[i]}
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={inView}
              transition={{ duration: 0.45, delay: at * DRAW, ease: EASE }}
            >
              <ComicChip
                color={color}
                index={String(i + 1).padStart(2, "0")}
                frame={{
                  initial: { backgroundColor: rest, boxShadow: `0 0 0px ${rgba(color, 0)}` },
                  whileInView: {
                    backgroundColor: [rest, rgba(color), rest],
                    boxShadow: [
                      `0 0 0px ${rgba(color, 0)}`,
                      `0 0 ${last ? 22 : 16}px ${rgba(color, last ? 0.75 : 0.6)}`,
                      `0 0 0px ${rgba(color, 0)}`,
                    ],
                  },
                  viewport: loopView,
                  transition: glow,
                }}
              >
                {label}
              </ComicChip>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/** Aceternity: Card Hover Effect — the highlight slides between cells. Fallback / sr-only for the carousel. */
function Benefits() {
  const [hovered, setHovered] = useState(1);

  return (
    <ul className="grid w-full grid-cols-1 overflow-hidden rounded-xl border border-hairline sm:grid-cols-2 lg:grid-cols-3">
      {benefits.map((benefit, i) => (
        <li
          key={benefit.title}
          onPointerEnter={() => setHovered(i)}
          className={cn(
            "relative flex flex-col gap-2.5 border-hairline p-7",
            "max-sm:[&:not(:first-child)]:border-t",
            "sm:max-lg:[&:nth-child(n+3)]:border-t sm:max-lg:[&:nth-child(even)]:border-l",
            "lg:[&:nth-child(n+4)]:border-t lg:[&:not(:nth-child(3n+1))]:border-l",
          )}
        >
          {hovered === i && (
            <motion.span
              layoutId="benefit-highlight"
              className="absolute inset-0 bg-surface-2"
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
            />
          )}
          <span className={cn("relative text-mono transition-colors", hovered === i ? "text-accent-hover" : "text-ink-tertiary")}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="relative text-card-title text-ink">{benefit.title}</h3>
          <p className="relative text-body-sm text-ink-subtle">{benefit.body}</p>
        </li>
      ))}
    </ul>
  );
}

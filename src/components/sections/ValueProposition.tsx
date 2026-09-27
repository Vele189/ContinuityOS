import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import { valueTimeline, type TimelineEntry } from "@/content/site";
import { CardStack } from "@/components/ui/card-stack";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { phaseStill } from "@/components/ui/phasePresets";
import { MountWhenNear } from "@/components/ui/MountWhenNear";

type NodeState = "done" | "active" | "idle";

const nodeIcon: Record<NodeState, string> = {
  done: "/icons/timeline-node-done.svg",
  active: "/icons/timeline-node-active.svg",
  idle: "/icons/timeline-node-idle.svg",
};

/**
 * Figma: 02 — Value Proposition (4:3). Aceternity-style timeline with scroll beam.
 * Desktop: titles run down the left; each phase's details are dealt onto a
 * sticky Aceternity Card Stack on the right as the beam reaches it.
 * Mobile: details sit inline under each title.
 */
export function ValueProposition() {
  const trackRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 60%", "end 60%"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  // scaleY (compositor-only) rather than height, which would re-lay out every frame
  const beamScale = useTransform(progress, (p) => Math.max(0, Math.min(1, p)));

  // Node positions within the track, measured on resize instead of on every scroll event
  const layout = useRef<{ height: number; nodes: number[] }>({ height: 0, nodes: [] });
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const top = track.getBoundingClientRect().top;
      layout.current = {
        height: track.offsetHeight,
        nodes: nodeRefs.current.map((node) => (node ? node.getBoundingClientRect().top - top : Infinity)),
      };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const { height, nodes } = layout.current;
    const beamY = p * height;
    let current = 0;
    nodes.forEach((y, i) => {
      if (y <= beamY) current = i;
    });
    setActiveIndex(current);
  });

  const cards = useMemo(() => buildCards(activeIndex), [activeIndex]);

  return (
    <Section id="why">
      <SectionHeader
        index="02"
        eyebrow="Why continuity exists"
        title="Most organizations assemble separate people for strategy, creative, technology and implementation."
        muted="Continuity brings those capabilities together."
      />

      <div className="flex w-full flex-col md:flex-row md:gap-10">
        <div ref={trackRef} className="relative flex w-full flex-col md:w-[400px] md:shrink-0">
          {/* Track */}
          <div
            aria-hidden
            className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-[linear-gradient(180deg,rgba(52,52,58,0)_0%,#34343a_10%,#34343a_90%,rgba(52,52,58,0)_100%)]"
          />
          {/* Beam (height = scroll progress) */}
          <motion.div
            aria-hidden
            style={{ scaleY: beamScale }}
            className="absolute top-0 bottom-0 left-[19px] w-0.5 origin-top rounded-[1px] bg-gradient-to-b from-accent/0 via-accent/70 via-20% to-accent-hover shadow-[0_0_8px_rgba(130,143,255,0.7)]"
          />

          {valueTimeline.map((entry, i) => (
            <TimelineRow
              key={entry.title}
              entry={entry}
              index={i}
              state={i < activeIndex ? "done" : i === activeIndex ? "active" : "idle"}
              nodeRef={(el) => {
                nodeRefs.current[i] = el;
              }}
            />
          ))}
        </div>

        {/* Card stack — sticky while the titles scroll past */}
        <div className="hidden min-w-0 flex-1 md:block">
          <div className="sticky top-40 pt-10">
            <CardStack
              items={cards}
              activeIndex={activeIndex}
              offset={14}
              scaleFactor={0.05}
              className="h-[440px] w-full md:h-[440px] md:w-full"
              cardClassName="h-[440px] w-full md:h-[440px] md:w-full justify-center p-8 bg-surface-1 dark:bg-surface-1 border-hairline dark:border-hairline shadow-black/40 dark:shadow-black/40"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

/** Shader gradients are WebGL, so they load in their own chunk. */
const PhaseGradient = lazy(() => import("@/components/ui/PhaseGradient").then((m) => ({ default: m.PhaseGradient })));

function buildCards(activeIndex: number) {
  return valueTimeline.map((entry, i) => ({
    id: i,
    content: (
      // Text left, gradient phase card right.
      <div className="flex items-center gap-8">
        <div className="min-w-0 flex-1">
          <CardDetails entry={entry} index={i} />
        </div>
        <PhaseCard entry={entry} index={i} active={i === activeIndex} />
      </div>
    ),
  }));
}

/** Left side of a stack card: centred white heading; larger white summary and bullet points, left-aligned. */
function CardDetails({ entry, index }: { entry: TimelineEntry; index: number }) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-center text-[24px] leading-tight font-semibold tracking-[-0.4px] text-white">
        {String(index).padStart(2, "0")} · {entry.title}
      </h3>
      <p className="text-[19px] leading-[1.5] text-white">{entry.summary}</p>
      <ul className="flex list-disc flex-col gap-2.5 pl-5 text-body text-white marker:text-accent-hover">
        {entry.outputs.map((output) => (
          <li key={output}>{output}</li>
        ))}
      </ul>
    </div>
  );
}

function PhaseCard({ entry, index, active }: { entry: TimelineEntry; index: number; active: boolean }) {
  return (
    // clip-path (not just overflow) so the WebGL gradient is clipped to the rounded corners too
    <div className="relative flex aspect-[17/21] w-[300px] shrink-0 flex-col justify-between overflow-hidden rounded-[24px] bg-surface-3 p-7 [clip-path:inset(0_round_24px)]">
      {/* One WebGL context for the active card; the ones peeking behind get a CSS still */}
      <div aria-hidden className="absolute inset-0" style={{ background: phaseStill(index) }} />
      {active && (
        <MountWhenNear className="absolute inset-0" rootMargin="200px">
          <Suspense fallback={null}>
            <PhaseGradient index={index} active />
          </Suspense>
        </MountWhenNear>
      )}

      <span className="relative text-eyebrow text-white/80">Phase {String(index).padStart(2, "0")}</span>
      <div className="relative flex flex-col gap-2">
        <span className="font-brand text-[96px] leading-none font-extrabold tracking-[-3px] text-white/25 mix-blend-overlay">
          {String(index).padStart(2, "0")}
        </span>
        {/* Long titles ("Implementation") step down so they fit the 244px text width */}
        <span
          className={cn(
            "font-semibold break-words text-white [text-shadow:0_2px_16px_rgba(40,10,90,0.45)]",
            entry.title.length > 9 ? "text-[28px] leading-[1.1] tracking-[-0.6px]" : "text-display-md tracking-[-1px]",
          )}
        >
          {entry.title}
        </span>
      </div>
    </div>
  );
}

function PhaseDetails({
  entry,
  index,
  idle = false,
}: {
  entry: TimelineEntry;
  index?: number;
  idle?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {index !== undefined ? (
        <span className="text-eyebrow text-accent-hover">
          {String(index).padStart(2, "0")} · {entry.title}
        </span>
      ) : null}
      <p className={cn("text-body-lg transition-colors", idle ? "text-ink-subtle" : "text-ink-muted")}>
        {entry.summary}
      </p>
      <ul className="flex flex-col gap-2">
        {entry.outputs.map((output) => (
          <li key={output} className="flex items-center gap-2.5">
            <span className={cn("text-mono transition-colors", idle ? "text-ink-tertiary" : "text-success")}>✓</span>
            <span className={cn("text-body-sm transition-colors", idle ? "text-ink-subtle" : "text-ink")}>
              {output}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TimelineRow({
  entry,
  index,
  state,
  nodeRef,
}: {
  entry: TimelineEntry;
  index: number;
  state: NodeState;
  nodeRef: (el: HTMLDivElement | null) => void;
}) {
  const idle = state === "idle";

  return (
    <div
      className={cn(
        "relative flex w-full flex-col gap-6 md:min-h-[42vh]",
        index === 0 ? "pt-6" : "pt-[72px] md:pt-0",
      )}
    >
      <div ref={nodeRef} className="flex shrink-0 items-center gap-7 self-start md:pt-10">
        <img src={nodeIcon[state]} alt="" width={40} height={40} className="relative z-10 shrink-0" />
        <div className="flex flex-col gap-1 whitespace-nowrap">
          <span className={cn("text-eyebrow transition-colors", idle ? "text-ink-tertiary" : "text-accent-hover")}>
            {String(index).padStart(2, "0")}
          </span>
          <h3
            className={cn(
              "text-[30px] leading-[1.15] font-semibold tracking-[-1px] transition-colors sm:text-display-md",
              state === "active" ? "text-ink" : idle ? "text-ink-tertiary" : "text-ink-muted",
            )}
          >
            {entry.title}
          </h3>
        </div>
      </div>

      <div className="pl-[68px] md:hidden">
        <PhaseDetails entry={entry} idle={idle} />
      </div>
    </div>
  );
}

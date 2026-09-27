import ColourfulText from "@/components/ui/colourful-text";

/**
 * Figma: 01b — Statement. Four words as horizontal marquee rows that loop
 * forever, alternating direction; "CONTINUE" closes the stack in colour.
 */
const rows: { text: string; direction: "left" | "right"; duration: number }[] = [
  { text: "RESEARCH", direction: "right", duration: 38 },
  { text: "TECHNOLOGY", direction: "left", duration: 44 },
  { text: "CREATIVE", direction: "right", duration: 36 },
  { text: "PRODUCTS", direction: "left", duration: 42 },
];

// Enough repeats that one copy is wider than any screen; two copies make the loop seamless.
const REPEATS = 6;

function MarqueeRow({ text, direction, duration }: (typeof rows)[number]) {
  const copy = (hidden: boolean) => (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {Array.from({ length: REPEATS }, (_, i) => (
        <span key={i} className="px-[0.3em]">
          {text}
        </span>
      ))}
    </span>
  );
  return (
    <div className="overflow-hidden">
      <div
        className="statement-marquee flex w-max"
        style={
          {
            "--marquee-duration": `${duration}s`,
            animationDirection: direction === "left" ? "normal" : "reverse",
          } as React.CSSProperties
        }
      >
        {copy(false)}
        {copy(true)}
      </div>
    </div>
  );
}

export function Statement() {
  return (
    <section
      aria-label="Research, technology, creative, products, continue"
      className="overflow-hidden bg-canvas py-16 sm:py-24"
    >
      {/* Read once, in order, instead of every repeated marquee word and single letter */}
      <p className="sr-only">Research. Technology. Creative. Products. Continue.</p>
      <div
        aria-hidden
        className="flex flex-col font-brand text-[clamp(48px,9vw,118px)] leading-[1.05] font-extrabold tracking-[-0.02em] whitespace-nowrap text-ink"
      >
        {rows.map((row) => (
          <MarqueeRow key={row.text} {...row} />
        ))}
        <p className="text-center">
          {/* Aceternity: Colourful Text — cycles through the spectrum */}
          <ColourfulText text="CONTINUE" className="font-brand tracking-[-0.02em]" />
        </p>
      </div>
    </section>
  );
}

import { useId } from "react";
import { SPECTRUM } from "@/lib/spectrum";
import { cn } from "@/lib/utils";

// The nine beams from cta-beams.svg (Figma): gentle curves, left to right, 38px apart.
const BEAMS = Array.from({ length: 9 }, (_, i) => {
  const y = -40 + i * 38;
  return `M-20 ${y}C300 ${y + 120} 520 ${y + 200 + i * 10} 1220 ${y + 360 + i * 10}`;
});
// The Figma file has the middle beam brighter than the rest
const BRIGHT = 4;

// Fast "data" slashes: short streaks shooting along the beam angle. Deterministic
// pseudo-random layout so it's stable between renders.
const SLASHES = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1;
  const palette = ["#ffffff", "#a5aeff", "#828fff", ...SPECTRUM.map((c) => `rgb(${c.join(",")})`)];
  return {
    top: `${4 + r(1) * 92}%`,
    width: 60 + Math.round(r(2) * 180),
    duration: 0.7 + r(3) * 1.4,
    delay: -r(4) * 3,
    color: palette[Math.floor(r(5) * palette.length)],
    thick: r(6) > 0.8 ? 2 : 1,
  };
});

/**
 * Background beams: faint guide lines (from the Figma file) with fast glowing
 * slashes shooting across them. CSS-animated (see .cta-slash in globals.css).
 */
export function CtaBeams({ className }: { className?: string }) {
  const id = useId();
  return (
    <div aria-hidden className={cn("pointer-events-none", className)}>
      <svg viewBox="0 0 1200 720" fill="none" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          {/* Faint guide: fades in and out along its length */}
          <linearGradient id={`${id}-guide`} x1="-20" y1="0" x2="1220" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#828FFF" stopOpacity="0" />
            <stop offset="0.5" stopColor="#828FFF" stopOpacity="1" />
            <stop offset="1" stopColor="#828FFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {BEAMS.map((d, i) => (
          <path key={i} d={d} stroke={`url(#${id}-guide)`} strokeOpacity={i === BRIGHT ? 0.55 : 0.14} />
        ))}
      </svg>

      {/* Slashes travel along lanes tilted to the beams' slope */}
      <div className="absolute inset-0 overflow-hidden">
        {SLASHES.map((s, i) => (
          <div key={i} className="absolute left-[-10%] h-0 w-[120%] origin-left rotate-[16deg]" style={{ top: s.top }}>
            <span
              className="cta-slash absolute top-0 left-0 block rounded-full"
              style={
                {
                  width: s.width,
                  height: s.thick,
                  background: `linear-gradient(90deg, transparent, ${s.color})`,
                  boxShadow: `0 0 8px ${s.color}`,
                  "--slash-duration": `${s.duration}s`,
                  "--slash-delay": `${s.delay}s`,
                } as React.CSSProperties
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

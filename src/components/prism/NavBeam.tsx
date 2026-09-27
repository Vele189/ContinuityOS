import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Carries the prism's spectrum out of the canvas and onto the nav logo.
 * A WebGL canvas can't draw past its own box, so this is a fixed, page-sized SVG:
 * seven colour bands fan out from the prism, fade in where the canvas fades out,
 * and converge on the logo. Updated every frame by the prism scene (no React
 * state), and it lights the logo via `html[data-logo-lit]`.
 */

export type NavBeamFrame = {
  /** Prism center, viewport px. */
  cx: number;
  cy: number;
  /** Logo center, viewport px. */
  lx: number;
  ly: number;
  /** Distance from the prism to where the canvas has faded out along the beam, px. */
  edge: number;
  /** 0 → 1 */
  strength: number;
};

export type NavBeamApi = {
  update: (frame: NavBeamFrame) => void;
  hide: () => void;
};

const BANDS = ["#ff3b30", "#ff9500", "#ffd60a", "#34c759", "#32ade6", "#5e5ce6", "#bf5af2"];
const LOGO_WIDTH = 16;
const LIT_AT = 0.6;

function setLogoLit(lit: boolean) {
  const root = document.documentElement;
  if (lit) root.dataset.logoLit = "";
  else delete root.dataset.logoLit;
}

export const NavBeam = forwardRef<NavBeamApi>(function NavBeam(_, ref) {
  const group = useRef<SVGGElement>(null);
  const bands = useRef<(SVGPolygonElement | null)[]>([]);
  const core = useRef<SVGLineElement>(null);
  const glow = useRef<SVGCircleElement>(null);
  const fade = useRef<SVGLinearGradientElement>(null);
  const fadeFrom = useRef<SVGStopElement>(null);
  const fadeTo = useRef<SVGStopElement>(null);
  const lit = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      update({ cx, cy, lx, ly, edge, strength }) {
        const dx = lx - cx;
        const dy = ly - cy;
        const dist = Math.hypot(dx, dy);
        const ux = dx / dist;
        const uy = dy / dist;
        // Perpendicular, so the bands sit side by side across the beam
        const px = -uy;
        const py = ux;
        // Where the canvas rainbow hands over, and how wide it is there
        const ex = cx + ux * edge * 0.8;
        const ey = cy + uy * edge * 0.8;
        const exitWidth = Math.min(180, Math.max(60, edge * 0.45));

        BANDS.forEach((_, k) => {
          const a = -0.5 + k / BANDS.length;
          const b = -0.5 + (k + 1) / BANDS.length;
          const pts = [
            [cx, cy],
            [ex + px * exitWidth * a, ey + py * exitWidth * a],
            [lx + px * LOGO_WIDTH * a, ly + py * LOGO_WIDTH * a],
            [lx + px * LOGO_WIDTH * b, ly + py * LOGO_WIDTH * b],
            [ex + px * exitWidth * b, ey + py * exitWidth * b],
          ];
          bands.current[k]?.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
        });

        core.current?.setAttribute("x1", String(ex));
        core.current?.setAttribute("y1", String(ey));
        core.current?.setAttribute("x2", String(lx));
        core.current?.setAttribute("y2", String(ly));
        glow.current?.setAttribute("cx", String(lx));
        glow.current?.setAttribute("cy", String(ly));

        // Fade in along the beam exactly where the canvas mask fades out
        fade.current?.setAttribute("x1", String(cx));
        fade.current?.setAttribute("y1", String(cy));
        fade.current?.setAttribute("x2", String(lx));
        fade.current?.setAttribute("y2", String(ly));
        fadeFrom.current?.setAttribute("offset", String(Math.min(1, (edge * 0.55) / dist)));
        fadeTo.current?.setAttribute("offset", String(Math.min(1, (edge * 0.95) / dist)));

        group.current?.setAttribute("opacity", String(strength));
        const nowLit = strength > LIT_AT;
        if (nowLit !== lit.current) setLogoLit((lit.current = nowLit));
      },
      hide() {
        group.current?.setAttribute("opacity", "0");
        if (lit.current) setLogoLit((lit.current = false));
      },
    }),
    [],
  );

  useEffect(() => () => setLogoLit(false), []);

  return createPortal(
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 h-screen w-screen mix-blend-screen"
      width="100%"
      height="100%"
    >
      <defs>
        <linearGradient id="nav-beam-fade" ref={fade} gradientUnits="userSpaceOnUse">
          <stop ref={fadeFrom} offset="0" stopColor="#fff" stopOpacity="0" />
          <stop ref={fadeTo} offset="0" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="nav-beam-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <rect width="100%" height="100%" fill="url(#nav-beam-fade)" />
        </mask>
        <filter id="nav-beam-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <radialGradient id="nav-beam-glow">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#828fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#828fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g ref={group} opacity={0} style={{ transition: "opacity 0.2s linear" }}>
        <g mask="url(#nav-beam-mask)">
          <g filter="url(#nav-beam-blur)" opacity={0.6}>
            {BANDS.map((color, k) => (
              <polygon
                key={color}
                ref={(el) => {
                  bands.current[k] = el;
                }}
                fill={color}
              />
            ))}
          </g>
          <line ref={core} stroke="#fff" strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
        </g>
        <circle ref={glow} r={34} fill="url(#nav-beam-glow)" />
      </g>
    </svg>,
    document.body,
  );
});

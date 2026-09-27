import * as THREE from "three";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, LUT } from "@react-three/postprocessing";
import { AnimatePresence, motion } from "motion/react";
import { modelStages } from "@/content/site";
import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { Beam } from "./Beam";
import { Box } from "./Box";
import { Flare } from "./Flare";
import { NavBeam, type NavBeamApi } from "./NavBeam";
import { Prism } from "./Prism";
import { Rainbow, type RainbowMesh } from "./Rainbow";
import type { ReflectApi, ReflectEvent } from "./Reflect";
import { calculateRefractionAngle, lerp, lerpV3 } from "./util";
import { createPrismGrade } from "./grade";

/**
 * The Continuity Model as a light experiment, after the pmndrs prism example
 * (https://pmndrs.github.io/examples/nextjs-prism). The seven stages are blocks
 * ringed around a prism. Idle, the beam sweeps the ring and reveals whatever it
 * touches. On hover the blocks turn into mirrors one after another, so the light
 * bounces 01 → 07 in order and ends in the prism, which splits it — the loop.
 * Once the chain is complete the spectrum points at the brand: the nav logo on
 * desktop (carried past the canvas by NavBeam), a hidden mark inside the ring
 * everywhere else.
 */

// Pure black: the canvas uses `mix-blend-mode: screen` (see .prism-canvas), so black drops out
// and only the light shows over the page background.
const CANVAS_BG = "#000000";
const RING = { rx: 5.4, ry: 2.6 };

// Clockwise from the left, so the order reads like a loop.
const ringAngles = modelStages.map((_, i) => Math.PI - (i * Math.PI * 2) / modelStages.length);
const centers = ringAngles.map((a) => new THREE.Vector2(Math.cos(a) * RING.rx, Math.sin(a) * RING.ry));

// Hovered: the beam enters here, aimed at block 01.
const CHAIN_SOURCE = new THREE.Vector2(-8.3, -1.6);
// Half the block's width (unit box scaled by 0.5): the mirror face sits this far from its center.
const FACE = 0.25;

/**
 * Mirror angle for each block so the beam goes source → 01 → … → 07 → prism.
 * A block's +x face must bisect the directions back to where the light came from
 * and on to the next target. The face is offset from the block's center, so
 * iterate a few times until face points and angles agree.
 */
function solveChain() {
  const normals = centers.map(() => new THREE.Vector2(1, 0));
  const faces = centers.map((c) => c.clone());
  const prism = new THREE.Vector2(0, 0);
  for (let pass = 0; pass < 8; pass++) {
    centers.forEach((c, i) => {
      const from = i === 0 ? CHAIN_SOURCE : faces[i - 1];
      const to = i === centers.length - 1 ? prism : faces[i + 1];
      const back = from.clone().sub(faces[i]).normalize();
      const on = to.clone().sub(faces[i]).normalize();
      normals[i].copy(back.add(on).normalize());
      faces[i].copy(c).addScaledVector(normals[i], FACE);
    });
  }
  return { angles: normals.map((n) => Math.atan2(n.y, n.x)), entry: faces[0] };
}
const chain = solveChain();

const stages = modelStages.map((stage, i) => {
  const { x, y } = centers[i];
  const len = Math.hypot(x, y);
  return {
    ...stage,
    index: i,
    position: [x, y, 0] as [number, number, number],
    idleRotation: ringAngles[i] + Math.PI / 4,
    chainRotation: chain.angles[i],
    label: [x + (x / len) * 1.1, y + (y / len) * 0.9, 0] as [number, number, number],
  };
});

// Seconds between one block turning into place and the next.
const CHAIN_STAGGER = 0.35;

// Touch / narrow screens: the spectrum lands on a mark inside the ring instead of the nav logo.
const MARK_POSITION: [number, number, number] = [3.1, 0, 0];
const MARK_ANGLE = Math.atan2(MARK_POSITION[1], MARK_POSITION[0]);

/** Visible nav logo (desktop and mobile navs both render one). */
function findNavLogo() {
  for (const el of document.querySelectorAll<HTMLElement>("[data-continuity-logo]")) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) return rect;
  }
  return null;
}

type SceneProps = {
  connected: boolean;
  lit: Set<number>;
  revealed: Set<number>;
  onStageHit: (index: number) => void;
  onStageLeave: (index: number) => void;
  /** Desktop: aim at the nav logo. Otherwise: aim at the in-canvas mark. */
  aimAtNav: boolean;
  navBeam: RefObject<NavBeamApi | null>;
  /** Fades the in-canvas brand mark (0 → 1) with the spectrum. */
  onMarkStrength: (strength: number) => void;
};

function Scene({ connected, lit, revealed, onStageHit, onStageLeave, aimAtNav, navBeam, onMarkStrength }: SceneProps) {
  const [isPrismHit, hitPrism] = useState(false);
  const flare = useRef<THREE.Group>(null!);
  const ambient = useRef<THREE.AmbientLight>(null!);
  const spot = useRef<THREE.SpotLight>(null!);
  const boxreflect = useRef<ReflectApi>(null!);
  const rainbow = useRef<RainbowMesh>(null!);
  const source = useRef(new THREE.Vector3(-8, 0, 0));
  const target = useRef(new THREE.Vector3());
  const aim = useRef(new THREE.Vector3());
  const aimTarget = useRef(new THREE.Vector3());
  // Where the spectrum should point once the chain is complete (world angle), else null
  const steer = useRef<number | null>(null);
  const gl = useThree((state) => state.gl);
  const complete = connected && lit.size === modelStages.length;

  const rayOut = useCallback(() => hitPrism(false), []);

  const rayOver = useCallback(
    (e: ReflectEvent) => {
      // Stop the ray where it touches the prism
      e.stopPropagation();
      hitPrism(true);
      // Flash on first contact
      rainbow.current.material.speed = 1;
      rainbow.current.material.emissiveIntensity = 20;
    },
    [],
  );

  const rayMove = useCallback(({ api, position, direction, normal }: ReflectEvent) => {
    if (!normal) return;
    const center = new THREE.Vector3();
    // Extend the line to the prism's center
    center.toArray(api.positions, api.number++ * 3);
    flare.current.position.set(position.x, position.y, -0.5);
    flare.current.rotation.set(0, 0, -Math.atan2(direction.x, direction.y));
    // Refraction
    let angleScreenCenter = Math.atan2(-position.y, -position.x);
    const normalAngle = Math.atan2(normal.y, normal.x);
    const incidentAngle = angleScreenCenter - normalAngle;
    angleScreenCenter += calculateRefractionAngle(incidentAngle) * 6;
    if (steer.current !== null) {
      // Chain complete: bend the spectrum toward the brand (shortest way round)
      const z = rainbow.current.rotation.z;
      const goal = steer.current;
      angleScreenCenter = z + Math.atan2(Math.sin(goal - z), Math.cos(goal - z)) * 0.12;
    }
    rainbow.current.rotation.z = angleScreenCenter;
    lerpV3(spot.current.target.position, [Math.cos(angleScreenCenter), Math.sin(angleScreenCenter), 0], 0.05);
    spot.current.target.updateMatrixWorld();
  }, []);

  useFrame((state) => {
    const { width, height } = state.viewport;
    if (connected) {
      // Hovered: fixed entry point, aimed at block 01's mirror face
      target.current.set(CHAIN_SOURCE.x, CHAIN_SOURCE.y, 0);
      aimTarget.current.set(chain.entry.x, chain.entry.y, 0);
    } else {
      // Idle: sweep around the ring so every stage gets lit in turn
      const t = state.clock.elapsedTime * 0.35;
      target.current.set(Math.cos(Math.PI - t) * (width / 2 - 0.3), Math.sin(Math.PI - t) * (height / 2 - 0.3), 0);
      aimTarget.current.set(0, 0, 0);
    }
    source.current.lerp(target.current, 0.08);
    aim.current.lerp(aimTarget.current, 0.08);
    boxreflect.current.setRay(
      source.current.toArray() as [number, number, number],
      aim.current.toArray() as [number, number, number],
    );
    lerp(rainbow.current.material, "emissiveIntensity", isPrismHit ? 2.5 : 0, 0.1);
    spot.current.intensity = rainbow.current.material.emissiveIntensity * Math.PI;
    lerp(ambient.current, "intensity", 0, 0.025);

    // Point the spectrum at the brand once every stage is connected
    const strength = isPrismHit ? THREE.MathUtils.clamp(rainbow.current.material.emissiveIntensity / 2.5, 0, 1) : 0;
    const logo = complete && aimAtNav ? findNavLogo() : null;
    if (logo) {
      const canvas = gl.domElement.getBoundingClientRect();
      const cx = canvas.left + canvas.width / 2;
      const cy = canvas.top + canvas.height / 2;
      const lx = logo.left + logo.width / 2;
      const ly = logo.top + logo.height / 2;
      const dx = lx - cx;
      const dy = ly - cy;
      const dist = Math.hypot(dx, dy);
      // Distance from the prism to the edge of the canvas's feathered mask along the beam
      const edge = 1 / Math.hypot(dx / dist / (canvas.width / 2), dy / dist / (canvas.height / 2));
      steer.current = Math.atan2(-dy, dx);
      if (dist > edge) navBeam.current?.update({ cx, cy, lx, ly, edge, strength });
      else navBeam.current?.hide();
    } else {
      steer.current = complete ? MARK_ANGLE : null;
      navBeam.current?.hide();
    }
    onMarkStrength(complete && !aimAtNav ? strength : 0);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0} />
      <pointLight position={[10, -10, 0]} intensity={0.05 * Math.PI} decay={0} />
      <pointLight position={[0, 10, 0]} intensity={0.05 * Math.PI} decay={0} />
      <pointLight position={[-10, 0, 0]} intensity={0.05 * Math.PI} decay={0} />
      <spotLight ref={spot} intensity={Math.PI} decay={0} distance={7} angle={1} penumbra={1} position={[0, 0, 1]} />

      <Beam ref={boxreflect} bounce={10} far={20}>
        <Prism position={[0, 0, 0]} onRayOver={rayOver} onRayOut={rayOut} onRayMove={rayMove} />
        {stages.map((stage) => (
          <Box
            key={stage.name}
            position={stage.position}
            idleRotation={stage.idleRotation}
            chainRotation={stage.chainRotation}
            chained={connected}
            chainDelay={0.15 + stage.index * CHAIN_STAGGER}
            lit={lit.has(stage.index)}
            revealed={revealed.has(stage.index)}
            onHit={() => onStageHit(stage.index)}
            onLeave={() => onStageLeave(stage.index)}
          />
        ))}
      </Beam>

      <Rainbow ref={rainbow} startRadius={0} endRadius={0.5} fade={0} />
      <Flare ref={flare} visible={isPrismHit} renderOrder={10} scale={1.25} streak={[12.5, 20, 1]} />
    </>
  );
}

function Effects() {
  const texture = useMemo(() => createPrismGrade(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    // The canvas renders without MSAA, so the composer doesn't need its default 8x either
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur levels={6} intensity={1.5} luminanceThreshold={1} luminanceSmoothing={1} />
      <LUT lut={texture} />
    </EffectComposer>
  );
}

/** Fit the ring into the canvas: 70 px/unit on desktop, smaller on narrow screens. */
function fitZoom(width: number, height: number) {
  return Math.min(70, width / 15, height / 7.6);
}

function ResponsiveZoom({ zoom }: { zoom: number }) {
  const get = useThree((state) => state.get);
  useLayoutEffect(() => {
    const { camera } = get();
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }, [get, zoom]);
  return null;
}

function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

// Narrow screens: labels sit above/below their block (px), with a margin from the edges.
const NARROW = 640;
const LABEL_GAP = 22;
const LABEL_EDGE = 44;

type LabelsProps = {
  width: number;
  height: number;
  zoom: number;
  lit: Set<number>;
  revealed: Set<number>;
  markRef: RefObject<HTMLSpanElement | null>;
};

// Stage-card stack under the canvas: how far / how much the cards behind peek out
const STACK_HEIGHT = 124;
const STACK_PEEK = 12;
const STACK_SHRINK = 0.05;

/**
 * The revealed stage as a small card stack (like the timeline's card stack):
 * each stage the light reaches lands on top, the previous two peek out behind.
 */
function StageStack({ history }: { history: number[] }) {
  const newestFirst = [...history].reverse();
  return (
    <div aria-hidden className="relative w-full max-w-[560px]" style={{ height: STACK_HEIGHT + STACK_PEEK * 2 }}>
      <AnimatePresence initial={false}>
        {newestFirst.map((index, depth) => {
          const stage = modelStages[index];
          return (
            <motion.div
              key={index}
              className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-hairline-strong bg-surface-1 px-6 text-center shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
              style={{ height: STACK_HEIGHT, transformOrigin: "top center" }}
              initial={{ opacity: 0, y: 40, scale: 1 }}
              animate={{
                opacity: depth > 2 ? 0 : 1,
                y: -depth * STACK_PEEK,
                scale: 1 - depth * STACK_SHRINK,
                zIndex: 10 - depth,
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              {/* Only the top card's text shows; the ones behind are just edges */}
              <div className={cn("flex flex-col items-center gap-2 transition-opacity", depth > 0 && "opacity-0")}>
                <span className="text-eyebrow text-accent-hover uppercase">
                  {String(index + 1).padStart(2, "0")} · {stage.name}
                </span>
                <p className="text-body-lg text-ink-muted">{stage.body}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function Overlay({ width, height, zoom, lit, revealed, markRef }: LabelsProps) {
  if (!width) return null;
  const narrow = width < NARROW;
  const toPx = ([x, y]: [number, number, number]) => ({ left: width / 2 + x * zoom, top: height / 2 - y * zoom });
  const labelPx = (stage: (typeof stages)[number]) => {
    let { left, top } = toPx(narrow ? stage.position : stage.label);
    if (narrow) {
      // Above for the top half of the ring, below for the rest
      top += stage.position[1] > 0.01 ? -LABEL_GAP : LABEL_GAP;
      left = Math.min(width - LABEL_EDGE, Math.max(LABEL_EDGE, left));
    }
    return { left, top };
  };
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {stages.map((stage) => {
        const { left, top } = labelPx(stage);
        return (
          <span
            key={stage.name}
            className={cn(
              "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap uppercase transition-colors duration-500",
              narrow ? "font-mono text-[10px] leading-none tracking-[0.06em]" : "gap-2 text-eyebrow",
              lit.has(stage.index) ? "text-ink" : revealed.has(stage.index) ? "text-accent-hover" : "text-ink-tertiary",
            )}
            style={{ left, top }}
          >
            <span className={narrow ? undefined : "text-mono"}>{String(stage.index + 1).padStart(2, "0")}</span>
            <span>{stage.name}</span>
          </span>
        );
      })}

      {/* Hidden brand mark the spectrum reveals when aiming inside the canvas */}
      <span
        ref={markRef}
        className="absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-canvas/70 opacity-0 transition-shadow duration-500 [&.logo-lit]:shadow-[0_0_28px_rgba(130,143,255,0.55)]"
        style={toPx(MARK_POSITION)}
      >
        <LogoMark size={28} />
      </span>
    </div>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** Only render frames while the section is on screen. */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView] as const;
}

export function PrismStages() {
  const [wrapRef, inView] = useInView<HTMLDivElement>();
  const [connected, setConnected] = useState(false);
  const [lit, setLit] = useState<Set<number>>(() => new Set());
  // Stages in the order the light reached them (last = newest), for the tooltip stack
  const [history, setHistory] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const navBeam = useRef<NavBeamApi>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const { width, height } = useElementSize(wrapRef);
  const zoom = width ? fitZoom(width, height) : 70;
  const setMarkStrength = useCallback((strength: number) => {
    const el = markRef.current;
    if (!el) return;
    el.style.opacity = String(strength);
    // Same spectrum glow as the nav logo (see .logo-lit in globals.css)
    el.classList.toggle("logo-lit", strength > 0.6);
  }, []);
  // Nav logo is only a target with a mouse on a wide screen; otherwise use the in-canvas mark.
  const aimAtNav = useMediaQuery("(hover: hover) and (min-width: 1024px)");

  // Frames stop off-screen, so clear the beam and the logo glow here too.
  useEffect(() => {
    if (!inView) navBeam.current?.hide();
  }, [inView]);

  const onStageHit = useCallback((index: number) => {
    setLit((prev) => new Set(prev).add(index));
    setHistory((prev) => (prev[prev.length - 1] === index ? prev : [...prev.filter((i) => i !== index), index].slice(-4)));
    setRevealed((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
  }, []);
  const onStageLeave = useCallback(
    (index: number) =>
      setLit((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      }),
    [],
  );

  // Panel follows the stage the light reached most recently.
  const focusIndex = history[history.length - 1] ?? 0;
  const focus = modelStages[focusIndex];
  const started = revealed.size > 0;

  return (
    <div className="flex w-full max-w-[1200px] flex-col items-center gap-8">
      <p className="text-eyebrow text-ink-tertiary uppercase">
        <span className="hidden md:inline">Hover to connect the stages</span>
        <span className="md:hidden">Tap to connect the stages</span>
        <span className="text-ink-subtle"> · {revealed.size}/7 revealed</span>
      </p>

      <div
        ref={wrapRef}
        className="prism-canvas relative h-[420px] w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent-hover sm:h-[520px] lg:h-[560px]"
        onPointerEnter={(e) => e.pointerType === "mouse" && setConnected(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setConnected(false)}
        // Touch has no hover: tap toggles the connection.
        onPointerDown={(e) => e.pointerType !== "mouse" && setConnected((c) => !c)}
        // Keyboard: focusing the diagram connects the stages, the same as hovering it
        tabIndex={0}
        role="group"
        aria-label="The Continuity Model: focus to connect the seven stages"
        onFocus={() => setConnected(true)}
        onBlur={() => setConnected(false)}
      >
        <Canvas
          orthographic
          frameloop={inView ? "always" : "never"}
          dpr={[1, 1.5]}
          gl={{ antialias: false }}
          camera={{ position: [0, 0, 100], zoom: 70 }}
          fallback={<StageList />}
        >
          <color attach="background" args={[CANVAS_BG]} />
          <ResponsiveZoom zoom={zoom} />
          <Suspense fallback={null}>
            <Scene
              connected={connected}
              lit={lit}
              revealed={revealed}
              onStageHit={onStageHit}
              onStageLeave={onStageLeave}
              aimAtNav={aimAtNav}
              navBeam={navBeam}
              onMarkStrength={setMarkStrength}
            />
            <Effects />
          </Suspense>
        </Canvas>
        <Overlay
          width={width}
          height={height}
          zoom={zoom}
          lit={lit}
          revealed={revealed}
          markRef={markRef}
        />
      </div>

      <NavBeam ref={navBeam} />

      {/* Revealed stage, as a card stack */}
      {started ? <StageStack history={history} /> : <div style={{ height: STACK_HEIGHT + STACK_PEEK * 2 }} />}
      {/* Announce it for screen readers */}
      <p className="sr-only" aria-live="polite">
        {started ? `${String(focusIndex + 1).padStart(2, "0")} · ${focus.name}: ${focus.body}` : ""}
      </p>

      {/* Full list for screen readers and search engines */}
      <StageList className="sr-only" />
    </div>
  );
}

function StageList({ className }: { className?: string }) {
  return (
    <ol className={cn("grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {modelStages.map((stage, i) => (
        <li key={stage.name} className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-1 px-4 py-[18px]">
          <h3 className="text-eyebrow text-ink uppercase">
            {String(i + 1).padStart(2, "0")} {stage.name}
          </h3>
          <p className="text-body-sm text-ink-subtle">{stage.body}</p>
        </li>
      ))}
    </ol>
  );
}

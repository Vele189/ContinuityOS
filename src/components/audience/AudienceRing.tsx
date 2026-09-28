import * as THREE from "three";
import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, extend, useFrame, useThree, type Catalogue, type ThreeElements } from "@react-three/fiber";
import { Billboard, Image, Text } from "@react-three/drei";
import { easing, geometry } from "maath";
import { audienceProblems } from "@/content/site";
import { SPECTRUM } from "@/lib/spectrum";
import { useInView, useReducedMotion } from "@/lib/visibility";
import { fontsReady } from "@/components/benefits/textures";
import { activeCardTexture, ringCardTexture } from "./textures";

// Static files (not base64 JS modules) so the browser caches them separately
const interMedium = "/fonts/inter-medium.woff";

/**
 * "Who we work with" as the pmndrs "cards" example
 * (https://pmndrs.github.io/examples/cards): a fanned ring of cards, one arc per
 * kind of problem. Hover a card and it lifts; the statement appears large in the
 * middle. Photos are replaced by the site's dark-panel spectrum gradients. The
 * example hijacks the scroll wheel; here you drag to spin (and it drifts on its own).
 */

// maath's geometry also exports non-constructor helpers; extend() only needs the geometries.
extend(geometry as unknown as Catalogue);

type RGB = [number, number, number];
type Hovered = { cat: number; quote: number } | null;

const TAU = Math.PI * 2;
const RADIUS = 5.25;
// Cards per radian of arc (the example's density), and a gap of 3 cards at each arc's end
const DENSITY = 22;
const GAP = 3;
const ARC = TAU / audienceProblems.length;
// Arcs step up and down a little so they read as separate groups
const ARC_Y = [0, 0.4, 0, -0.4, 0, 0.4];

// Each category gets a colour pair from the site spectrum
const colors: [RGB, RGB][] = audienceProblems.map((_, i) => [
  SPECTRUM[(i * 2) % SPECTRUM.length],
  SPECTRUM[(i * 2 + 1) % SPECTRUM.length],
]);
const total = audienceProblems.reduce((n, c) => n + c.quotes.length, 0);
const numberOf = (cat: number, quote: number) =>
  audienceProblems.slice(0, cat).reduce((n, c) => n + c.quotes.length, 0) + quote + 1;

function Rig({
  spin,
  pointerInside,
  drift,
  children,
  ...props
}: ThreeElements["group"] & { spin: RefObject<number>; pointerInside: RefObject<boolean>; drift: number }) {
  const ref = useRef<THREE.Group>(null!);
  const size = useThree((s) => s.size);
  // Pull back on narrow canvases so more of the ring fits
  const distance = Math.max(9, 7.5 / (size.width / size.height));
  useFrame((state, delta) => {
    // Dragged angle plus a slow drift
    const target = spin.current - state.clock.elapsedTime * drift;
    easing.damp(ref.current.rotation, "y", target, 0.35, delta);
    // Cards move under a still pointer, so raycast every frame, but only while the pointer is over the canvas
    if (pointerInside.current) state.events.update?.();
    easing.damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y * 2 + 4.5, distance], 0.3, delta);
    state.camera.lookAt(0, 0, 0);
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

function Card({
  texture,
  active,
  hovered,
  ...props
}: ThreeElements["group"] & { texture: THREE.Texture; active: boolean; hovered: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    // Scalar damps: no target arrays allocated per card per frame
    const f = hovered ? 1.4 : active ? 1.25 : 1;
    easing.damp(ref.current.position, "y", hovered ? 0.25 : 0, 0.1, delta);
    easing.damp(ref.current.scale, "x", 1.618 * f, 0.15, delta);
    easing.damp(ref.current.scale, "y", f, 0.15, delta);
  });
  return (
    <group {...props}>
      <Image ref={ref} transparent radius={0.075} texture={texture} scale={[1.618, 1]} side={THREE.DoubleSide} />
    </group>
  );
}

// Memoized: a hover elsewhere re-renders Scene, which shouldn't re-render every arc's cards
const Arc = memo(function Arc({
  cat,
  textures,
  onHover,
}: {
  cat: number;
  textures: THREE.Texture[];
  onHover: (h: Hovered) => void;
}) {
  // Which slot in this arc is under the pointer (statements repeat around the arc)
  const [slot, setSlot] = useState<number | null>(null);
  const from = cat * ARC;
  const amount = Math.round(ARC * DENSITY);
  const labelAngle = from + ARC / 2;
  return (
    <group position={[0, ARC_Y[cat % ARC_Y.length], 0]}>
      <Billboard position={[Math.sin(labelAngle) * RADIUS * 1.4, 0.5, Math.cos(labelAngle) * RADIUS * 1.4]}>
        <Text font={interMedium} fontSize={0.25} anchorX="center" color="#f7f8f8">
          {audienceProblems[cat].tag.toLowerCase()}
        </Text>
      </Billboard>
      {Array.from({ length: amount - GAP }, (_, i) => {
        const angle = from + (i / amount) * ARC;
        const quote = i % textures.length;
        return (
          <Card
            key={i}
            onPointerOver={(e) => {
              e.stopPropagation();
              setSlot(i);
              onHover({ cat, quote });
            }}
            onPointerOut={() => {
              setSlot(null);
              onHover(null);
            }}
            position={[Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS]}
            rotation={[0, Math.PI / 2 + angle, 0]}
            active={slot !== null}
            hovered={slot === i}
            texture={textures[quote]}
          />
        );
      })}
    </group>
  );
});

function ActiveCard({ shown, visible }: { shown: Hovered; visible: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  const texture = useMemo(() => {
    if (!shown) return null;
    const { tag, quotes } = audienceProblems[shown.cat];
    const [c, a] = colors[shown.cat];
    const n = numberOf(shown.cat, shown.quote);
    return activeCardTexture(tag, quotes[shown.quote], `${String(n).padStart(2, "0")} / ${total}`, c, a, n);
  }, [shown]);
  useEffect(() => () => texture?.dispose(), [texture]);

  useEffect(() => {
    // Zoom in a touch each time a new card is shown
    if (ref.current) (ref.current.material as unknown as { zoom: number }).zoom = 0.85;
  }, [texture]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const material = ref.current.material as unknown as { zoom: number; opacity: number };
    easing.damp(material, "zoom", 1, 0.5, delta);
    easing.damp(material, "opacity", Number(visible), 0.3, delta);
  });

  if (!texture || !shown) return null;
  return (
    <Billboard>
      <Text font={interMedium} fontSize={0.5} position={[2.15, 3.85, 0]} anchorX="left" color="#f7f8f8" fillOpacity={visible ? 1 : 0}>
        {`${audienceProblems[shown.cat].tag.toLowerCase()}\n${numberOf(shown.cat, shown.quote)}`}
      </Text>
      <Image ref={ref} transparent radius={0.3} position={[0, 1.5, 0]} scale={[3.5, 1.618 * 3.5]} texture={texture} />
    </Billboard>
  );
}

function Scene({ spin, pointerInside }: { spin: RefObject<number>; pointerInside: RefObject<boolean> }) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<Hovered>(null);
  // Keep the last card on the big billboard while it fades out
  const [shown, setShown] = useState<Hovered>(null);
  if (hovered && (hovered.cat !== shown?.cat || hovered.quote !== shown?.quote)) setShown(hovered);

  const textures = useMemo(
    () =>
      audienceProblems.map((c, cat) =>
        c.quotes.map((_, q) => ringCardTexture(colors[cat][0], colors[cat][1], cat * 10 + q + 1)),
      ),
    [],
  );
  useEffect(() => () => textures.flat().forEach((t) => t.dispose()), [textures]);

  return (
    <Rig spin={spin} pointerInside={pointerInside} drift={reduced ? 0 : 0.03} position={[0, 1.5, 0]}>
      {audienceProblems.map((_, cat) => (
        <Arc key={cat} cat={cat} textures={textures[cat]} onHover={setHovered} />
      ))}
      <ActiveCard shown={shown} visible={hovered !== null} />
    </Rig>
  );
}

export function AudienceRing() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const spin = useRef(0);
  const pointerInside = useRef(false);
  const drag = useRef<{ id: number; x: number } | null>(null);
  const [ready, setReady] = useState(false);

  // Card text is drawn with the page fonts, so wait for them
  useEffect(() => {
    let alive = true;
    fontsReady().finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="w-full">
      <div
        ref={ref}
        className="relative h-[560px] w-full cursor-grab touch-pan-y active:cursor-grabbing sm:h-[680px]"
        // Drag horizontally to spin the ring; vertical swipes still scroll the page
        onPointerDown={(e) => {
          drag.current = { id: e.pointerId, x: e.clientX };
        }}
        onPointerMove={(e) => {
          if (drag.current?.id !== e.pointerId) return;
          spin.current += (e.clientX - drag.current.x) * 0.006;
          drag.current.x = e.clientX;
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onPointerEnter={() => (pointerInside.current = true)}
        onPointerLeave={() => {
          drag.current = null;
          pointerInside.current = false;
        }}
      >
        <Canvas dpr={[1, 1.5]} frameloop={inView ? "always" : "never"}>
          {ready && <Scene spin={spin} pointerInside={pointerInside} />}
        </Canvas>
        <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-eyebrow text-ink-tertiary uppercase">
          Drag to spin · hover a card
        </p>
      </div>
    </div>
  );
}

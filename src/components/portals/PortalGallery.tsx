import * as THREE from "three";
import { Suspense, useCallback, useEffect, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Canvas, extend, useFrame, useThree, type Catalogue, type ThreeElements } from "@react-three/fiber";
import { CameraControls, MeshPortalMaterial, Text, useCursor } from "@react-three/drei";
import { easing, geometry } from "maath";
import { GrassWorld } from "./GrassWorld";
import { CloudsWorld } from "./CloudsWorld";
import { WaterWorld } from "./WaterWorld";
import type { ScreenPose } from "./Laptop";
import { useInView } from "@/lib/visibility";

// Static files (not base64 JS modules) so the browser caches them separately
const interMedium = "/fonts/inter-medium.woff";
const interRegular = "/fonts/inter-regular.woff";

/**
 * Three portals, after the pmndrs "enter-portals" example
 * (https://pmndrs.github.io/examples/enter-portals). Each frame is a window into
 * its own world; click one and the camera flies through it. Back / Esc returns.
 *   left   → drifting clouds, with a laptop showing the live chunky.fm site
 *   middle → grass shader, with a floating laptop showing the live Continuum site
 *   right  → water shader, with a laptop showing the live velendamulelo.vercel.app site
 */

// maath's geometry also exports helpers that aren't constructors; extend() only
// needs RoundedPlaneGeometry, the extras are harmless at runtime.
extend(geometry as unknown as Catalogue);

declare module "@react-three/fiber" {
  interface ThreeElements {
    roundedPlaneGeometry: ThreeElements["planeGeometry"];
  }
}

type PortalId = "01" | "02" | "03";

const PORTALS: {
  id: PortalId;
  name: string;
  /** Title font size: longer names run smaller to fit the frame */
  size: number;
  label: string;
  /** The live site the world's laptop shows */
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
}[] = [
  { id: "01", name: "chunky.fm", size: 0.16, label: "Social listening", url: "https://chunkyfm-production.up.railway.app/", position: [-1.15, 0, 0], rotation: [0, 0.5, 0] },
  { id: "02", name: "continuum", size: 0.16, label: "Project management", url: "https://joincontinuum.co.za/", position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: "03", name: "vele", size: 0.3, label: "Creative portfolio", url: "https://velendamulelo.vercel.app/", position: [1.15, 0, 0], rotation: [0, -0.5, 0] },
];

type FrameProps = Omit<ThreeElements["group"], "id"> & {
  id: PortalId;
  name: string;
  size: number;
  label: string;
  active: PortalId | null;
  onEnter: (id: PortalId) => void;
  width?: number;
  height?: number;
  children: ReactNode;
};

function Frame({
  id,
  name,
  size,
  label,
  active,
  onEnter,
  width = 1,
  height = 1.61803398875,
  children,
  ...props
}: FrameProps) {
  const portal = useRef<ComponentRef<typeof MeshPortalMaterial>>(null!);
  const [hovered, hover] = useState(false);
  useCursor(hovered && !active);
  const isActive = active === id;
  useFrame((_, dt) => easing.damp(portal.current, "blend", isActive ? 1 : 0, 0.2, dt));
  return (
    <group {...props}>
      <Text
        font={interMedium}
        fontSize={size}
        anchorY="top"
        anchorX="left"
        lineHeight={0.8}
        position={[-0.4, 0.715, 0.01]}
        material-toneMapped={false}
      >
        {name}
      </Text>
      <Text
        font={interRegular}
        fontSize={0.1}
        anchorX="right"
        position={[0.4, -0.659, 0.01]}
        material-toneMapped={false}
      >
        /{id}
      </Text>
      <Text
        font={interRegular}
        fontSize={0.04}
        anchorX="left"
        position={[-0.4, -0.677, 0.01]}
        material-toneMapped={false}
      >
        {label}
      </Text>
      <mesh
        name={id}
        onClick={(e) => {
          if (active) return;
          e.stopPropagation();
          onEnter(id);
        }}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
      >
        <roundedPlaneGeometry args={[width, height, 0.1]} />
        <MeshPortalMaterial ref={portal} events={isActive} side={THREE.DoubleSide} blur={0} resolution={512}>
          {children}
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
}

/** Flies the camera to the entered frame (or back to the overview). */
// Breathing room around the laptop screen when the camera lines up with it.
const SCREEN_MARGIN = 1.15;

/**
 * Flies the camera to the entered frame (or back to the overview). Once the
 * world's laptop reports its screen, the camera squares up to it: centred,
 * head-on, and just far enough back for the whole screen to fit.
 */
function Rig({ active, screen }: { active: PortalId | null; screen: ScreenPose | null }) {
  const controls = useThree((state) => state.controls) as unknown as CameraControls | null;
  const scene = useThree((state) => state.scene);
  const size = useThree((state) => state.size);
  // Pull back on narrow canvases so all three frames fit
  const restZ = Math.max(1.55, 3.6 / (1.535 * (size.width / size.height)));

  useEffect(() => {
    if (!controls) return;
    const position = new THREE.Vector3(0, 0, restZ);
    const focus = new THREE.Vector3(0, 0, 0);
    const frame = active ? scene.getObjectByName(active) : undefined;
    if (active && screen) {
      const halfFov = THREE.MathUtils.degToRad(75 / 2);
      const aspect = size.width / size.height;
      const distance = Math.max(
        ((screen.width / 2) * SCREEN_MARGIN) / (Math.tan(halfFov) * aspect),
        ((screen.height / 2) * SCREEN_MARGIN) / Math.tan(halfFov),
      );
      focus.copy(screen.center);
      position.copy(screen.center).addScaledVector(screen.normal, distance);
    } else if (frame) {
      frame.parent!.localToWorld(position.set(0, 0.5, 0.25));
      frame.parent!.localToWorld(focus.set(0, 0, -2));
    }
    controls.setLookAt(...position.toArray(), ...focus.toArray(), true);
  }, [active, screen, controls, scene, size, restZ]);

  return (
    <CameraControls
      makeDefault
      // Look around only once inside a world; never hijack the page's wheel / touch scroll
      enabled={!!active}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
      mouseButtons={{ left: 1, middle: 0, right: 0, wheel: 0 }}
      touches={{ one: 32, two: 0, three: 0 }}
    />
  );
}

export function PortalGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [active, setActive] = useState<PortalId | null>(null);
  // Reported by the entered world's laptop once it has settled
  const [screen, setScreen] = useState<ScreenPose | null>(null);

  // Entering a world takes the whole screen: browser fullscreen where supported,
  // and the stage is pinned over the viewport either way (iPhone has no element fullscreen).
  const backButton = useRef<HTMLButtonElement>(null);
  // Where focus returns to on leaving (the keyboard button that opened the portal, if any)
  const returnFocus = useRef<HTMLElement | null>(null);

  const enter = useCallback((id: PortalId) => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setScreen(null);
    setActive(id);
    stage.current?.requestFullscreen?.().catch(() => {});
  }, []);
  const leave = useCallback(() => {
    setScreen(null);
    setActive(null);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  // Focus follows the view: Back button inside a world, the opener again outside
  useEffect(() => {
    if (active) backButton.current?.focus({ preventScroll: true });
    else if (returnFocus.current?.isConnected && returnFocus.current !== document.body) {
      returnFocus.current.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    // Esc: in browser fullscreen the browser handles it (fullscreenchange below); otherwise we do
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && leave();
    const onFullscreen = () => {
      if (document.fullscreenElement) return;
      setScreen(null);
      setActive(null);
    };
    // No page scrolling underneath while inside
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [active, leave]);

  const worlds: Record<PortalId, ReactNode> = {
    "01": <CloudsWorld live={active === "01"} onScreen={setScreen} />,
    "02": <GrassWorld live={active === "02"} onScreen={setScreen} />,
    "03": <WaterWorld live={active === "03"} onScreen={setScreen} />,
  };

  return (
    // Keeps the section's height while the stage is pinned fullscreen
    <div ref={ref} className="relative h-[560px] w-full sm:h-[720px]">
      <div ref={stage} className={active ? "fixed inset-0 z-[80] bg-black" : "absolute inset-0"}>
        <Canvas
          frameloop={inView || active ? "always" : "never"}
          dpr={[1, 1.5]}
          camera={{ fov: 75, position: [0, 0, 20] }}
        >
          <Suspense fallback={null}>
            {PORTALS.map((p) => (
              <Frame
                key={p.id}
                id={p.id}
                name={p.name}
                size={p.size}
                label={p.label}
                position={p.position}
                rotation={p.rotation}
                active={active}
                onEnter={enter}
              >
                {/* Once inside one world, the other two stop rendering into their portals */}
                {(!active || active === p.id) && worlds[p.id]}
              </Frame>
            ))}
          </Suspense>
          <Rig active={active} screen={screen} />
        </Canvas>

        {/* Overlay UI */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5">
          {active ? (
            <button
              ref={backButton}
              type="button"
              onClick={leave}
              className="pointer-events-auto rounded-full border border-white/20 bg-black/50 px-4 py-2 text-sm font-medium text-ink backdrop-blur transition-colors outline-none hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-accent-hover"
            >
              <span aria-hidden>←</span> Back
            </button>
          ) : (
            <span className="text-eyebrow text-ink-tertiary uppercase">Click a portal to step inside</span>
          )}
          {active ? (
            <span className="text-eyebrow text-white/70 uppercase">Drag to look around · Esc to leave</span>
          ) : null}
        </div>

        {/* The portals are WebGL, so give keyboards and screen readers real buttons (visible on focus) */}
        {/* Kept mounted (just hidden) while inside a world, so focus can return to the same button */}
        <ul hidden={!!active} className="absolute inset-x-0 bottom-5 flex justify-center gap-2" aria-label="Projects">
          {PORTALS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => enter(p.id)}
                className="sr-only rounded-full border border-white/20 bg-black/70 px-4 py-2 text-sm text-ink focus:not-sr-only focus-visible:outline-2 focus-visible:outline-accent-hover"
              >
                Step into {p.name}: {p.label.toLowerCase()}
              </button>
              <a href={p.url} target="_blank" rel="noreferrer" className="sr-only">
                Open {p.name} in a new tab
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

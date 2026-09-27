import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeElements, type ThreeEvent } from "@react-three/fiber";
import { Image } from "@react-three/drei";
import { easing } from "maath";
import { benefits } from "@/content/site";
import { spread } from "@/lib/spectrum";
import { useInView, useReducedMotion } from "@/lib/visibility";
import "./materials";
import { CARD_ASPECT, cardTexture, fontsReady } from "./textures";

/**
 * The six benefits as curved, rounded cards on a turning ring, after the pmndrs
 * "cards-with-border-radius" example (https://pmndrs.github.io/examples/cards-with-border-radius).
 * The example hijacks the scroll wheel; here the ring just turns on its own, so
 * the page scrolls normally.
 */

const BG = "#010102";
const RADIUS = 1.4;
const colors = spread(benefits.length);

// Radians per second.
const SPIN = 0.12;

function Rig({ spin, pointerInside, ...props }: ThreeElements["group"] & { spin: number; pointerInside: React.RefObject<boolean> }) {
  const ref = useRef<THREE.Group>(null!);
  const size = useThree((state) => state.size);
  // Pull the camera back on tall/narrow canvases so the whole ring fits
  const distance = Math.max(9.2, 12.8 / (size.width / size.height));

  useFrame((state, delta) => {
    ref.current.rotation.y -= delta * spin;
    // Cards move under a still pointer, so raycast every frame, but only while the pointer is over the canvas
    if (pointerInside.current) state.events.update?.();
    easing.damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y + 1.5, distance], 0.3, delta);
    state.camera.lookAt(0, 0, 0);
    if (state.scene.fog instanceof THREE.Fog) {
      // Fade the far side of the ring into the page background
      state.scene.fog.near = distance - 1.5;
      state.scene.fog.far = distance + 2;
    }
  });
  return <group ref={ref} {...props} />;
}

function Card({ texture, ...props }: { texture: THREE.Texture } & Pick<ThreeElements["mesh"], "position" | "rotation">) {
  const ref = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial & { radius: number }>>(null!);
  const [hovered, hover] = useState(false);
  const pointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hover(true);
  };
  useFrame((_, delta) => {
    const s = hovered ? 1.15 : 1;
    easing.damp3(ref.current.scale, [s, s * CARD_ASPECT, 1], 0.1, delta);
    easing.damp(ref.current.material, "radius", hovered ? 0.25 : 0.1, 0.2, delta);
  });
  return (
    <Image
      ref={ref}
      texture={texture}
      scale={[1, CARD_ASPECT]}
      transparent
      side={THREE.DoubleSide}
      onPointerOver={pointerOver}
      onPointerOut={() => hover(false)}
      {...props}
    >
      <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
    </Image>
  );
}

function Carousel({ textures }: { textures: THREE.Texture[] }) {
  const count = textures.length;
  return textures.map((texture, i) => (
    <Card
      key={i}
      texture={texture}
      position={[Math.sin((i / count) * Math.PI * 2) * RADIUS, 0, Math.cos((i / count) * Math.PI * 2) * RADIUS]}
      rotation={[0, Math.PI + (i / count) * Math.PI * 2, 0]}
    />
  ));
}

function useTextures() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    fontsReady().finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  const textures = useMemo(() => {
    if (!ready) return null;
    return benefits.map((b, i) => cardTexture(i, b.title, b.body, colors[i]));
  }, [ready]);
  useEffect(
    () => () => {
      textures?.forEach((t) => t.dispose());
    },
    [textures],
  );
  return textures;
}

/** `fallback` renders if WebGL is unavailable; it's also kept as an sr-only list. */
export function BenefitsCarousel({ fallback }: { fallback: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const textures = useTextures();
  const inView = useInView(ref);
  const reduced = useReducedMotion();
  const pointerInside = useRef(false);

  return (
    <div className="w-full">
      <div
        ref={ref}
        className="relative h-[480px] w-full sm:h-[600px]"
        onPointerEnter={() => (pointerInside.current = true)}
        onPointerLeave={() => (pointerInside.current = false)}
      >
        <Canvas
          frameloop={inView ? "always" : "never"}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 100], fov: 15 }}
          fallback={fallback}
        >
          <fog attach="fog" args={[BG, 8.5, 12]} />
          {textures && (
            <Rig rotation={[0, 0, 0.15]} spin={reduced ? 0 : SPIN} pointerInside={pointerInside}>
              <Carousel textures={textures} />
            </Rig>
          )}
        </Canvas>
      </div>
      <div className="sr-only">{fallback}</div>
    </div>
  );
}

import * as THREE from "three";
import { useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";

// Floating laptop from the pmndrs "mixing-html-and-webgl-w-occlusion" example
// (https://pmndrs.github.io/examples/mixing-html-and-webgl-w-occlusion).
const LAPTOP_URL = "/portals/mac-draco.glb";
// Self-hosted Draco decoder (drei otherwise fetches it from gstatic.com)
const DRACO_PATH = "/draco/";

type LaptopGLTF = GLTF & {
  nodes: Record<"Cube008" | "Cube008_1" | "Cube008_2" | "keyboard" | "Cube002" | "Cube002_1" | "touchbar", THREE.Mesh>;
  materials: Record<
    "aluminium" | "matte.001" | "screen.001" | "keys" | "trackpad" | "touchbar",
    THREE.MeshStandardMaterial
  >;
};

// The screen is 334×216 CSS px; the site renders at desktop width and is scaled down to fit.
const SCREEN = { width: 334, height: 216 };
const SITE_WIDTH = 1280;
const SITE_SCALE = SCREEN.width / SITE_WIDTH;

/** Where the screen is, in world space, so the camera can face it head-on. */
export type ScreenPose = {
  center: THREE.Vector3;
  /** Unit vector the screen faces. */
  normal: THREE.Vector3;
  /** Screen size in world units. */
  width: number;
  height: number;
};

// drei <Html transform> maps 40 CSS px to 1 world unit (at distanceFactor 10).
const PX_TO_WORLD = 1 / 40;
// Resting pose while in use: level, no sway (the float's mid-height).
const REST_Y = -1;
const SETTLED = 0.002;

/**
 * Floating laptop whose screen shows a live website (an iframe) — only when
 * `live`, i.e. once its portal is entered, since DOM can't be clipped to the
 * portal frame. While live it stops floating and settles level, then reports
 * its screen pose via `onScreen` so the camera can line up with it.
 */
export function Laptop({
  live,
  url,
  title,
  onScreen,
  ...props
}: ThreeElements["group"] & {
  live: boolean;
  url: string;
  title: string;
  onScreen?: (pose: ScreenPose) => void;
}) {
  const group = useRef<THREE.Group>(null!);
  const anchor = useRef<THREE.Group>(null!);
  const reported = useRef(false);
  const { nodes, materials } = useGLTF(LAPTOP_URL, DRACO_PATH) as unknown as LaptopGLTF;
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const g = group.current;
    const rx = live ? 0 : Math.cos(t / 2) / 20 + 0.25;
    const ry = live ? 0 : Math.sin(t / 4) / 20;
    const rz = live ? 0 : Math.sin(t / 8) / 20;
    const y = live ? REST_Y : (-2 + Math.sin(t / 2)) / 2;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, rx, 0.1);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, ry, 0.1);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, rz, 0.1);
    g.position.y = THREE.MathUtils.lerp(g.position.y, y, 0.1);

    if (!live) {
      reported.current = false;
      return;
    }
    const settled =
      Math.abs(g.rotation.x) + Math.abs(g.rotation.y) + Math.abs(g.rotation.z) + Math.abs(g.position.y - REST_Y) <
      SETTLED;
    if (settled && !reported.current && onScreen) {
      reported.current = true;
      anchor.current.updateWorldMatrix(true, false);
      const center = anchor.current.getWorldPosition(new THREE.Vector3());
      const quaternion = anchor.current.getWorldQuaternion(new THREE.Quaternion());
      const scale = anchor.current.getWorldScale(new THREE.Vector3());
      onScreen({
        center,
        normal: new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize(),
        width: SCREEN.width * PX_TO_WORLD * scale.x,
        height: SCREEN.height * PX_TO_WORLD * scale.y,
      });
    }
  });
  return (
    <group {...props}>
      <group ref={group} dispose={null}>
        <group rotation-x={-0.425} position={[0, -0.04, 0.41]}>
          <group position={[0, 2.96, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={materials.aluminium} geometry={nodes.Cube008.geometry} />
            <mesh material={materials["matte.001"]} geometry={nodes.Cube008_1.geometry} />
            <mesh material={materials["screen.001"]} geometry={nodes.Cube008_2.geometry}>
              {/* Screen anchor: the HTML sits here and faces its +z */}
              <group ref={anchor} rotation-x={-Math.PI / 2} position={[0, 0.05, -0.09]}>
                {live && (
                  <Html
                    className="overflow-hidden rounded-[3px] bg-white"
                    style={{ width: SCREEN.width, height: SCREEN.height }}
                    transform
                    occlude
                  >
                    <iframe
                      title={title}
                      src={url}
                      loading="lazy"
                      // Third-party site: it can run and link out, but not navigate this page or use device features
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow=""
                      className="origin-top-left border-0"
                      style={{
                        width: SITE_WIDTH,
                        height: SCREEN.height / SITE_SCALE,
                        transform: `scale(${SITE_SCALE})`,
                      }}
                      // Keep wheel / clicks inside the site instead of the 3D scene
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                  </Html>
                )}
              </group>
            </mesh>
          </group>
        </group>
        <mesh material={materials.keys} geometry={nodes.keyboard.geometry} position={[1.79, 0, 3.45]} />
        <group position={[0, -0.1, 3.39]}>
          <mesh material={materials.aluminium} geometry={nodes.Cube002.geometry} />
          <mesh material={materials.trackpad} geometry={nodes.Cube002_1.geometry} />
        </group>
        <mesh material={materials.touchbar} geometry={nodes.touchbar.geometry} position={[0, -0.03, 1.2]} />
      </group>
    </group>
  );
}

useGLTF.preload(LAPTOP_URL, DRACO_PATH);

// From the pmndrs "water-shader" example (https://pmndrs.github.io/examples/water-shader),
// using three.js' Water (three-stdlib).
import * as THREE from "three";
import { useMemo, useRef } from "react";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { Sky, useTexture } from "@react-three/drei";
import { Water } from "three-stdlib";
import { Laptop, type ScreenPose } from "./Laptop";

extend({ Water });

declare module "@react-three/fiber" {
  interface ThreeElements {
    water: ThreeElement<typeof Water>;
  }
}

function Ocean() {
  const ref = useRef<Water>(null!);
  const waterNormals = useTexture("/portals/waternormals.webp", (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  });
  const geom = useMemo(() => new THREE.PlaneGeometry(10000, 10000), []);
  const config = useMemo(
    () => ({
      textureWidth: 256,
      textureHeight: 256,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
    }),
    [waterNormals],
  );
  useFrame((_, delta) => {
    ref.current.material.uniforms.time.value += delta;
  });
  return <water ref={ref} args={[geom, config]} position={[0, -1.2, 0]} rotation-x={-Math.PI / 2} />;
}

// The right portal looks down this direction (the frame is turned 0.5 rad toward the middle).
const VIEW_X = Math.sin(0.5);
const VIEW_Z = -Math.cos(0.5);

/** Portal world: open ocean, sun low on the horizon, and a laptop over the water. */
export function WaterWorld({ live, onScreen }: { live: boolean; onScreen?: (pose: ScreenPose) => void }) {
  return (
    <>
      <pointLight position={[100, 100, 100]} intensity={Math.PI} decay={0} />
      <pointLight position={[-100, -100, -100]} intensity={Math.PI} decay={0} />
      <Ocean />
      <Laptop
        live={live}
        onScreen={onScreen}
        url="https://velendamulelo.vercel.app/"
        title="Vele Ndamulelo portfolio"
        position={[1.15 + VIEW_X * 2.6, 0.05, VIEW_Z * 2.6]}
        rotation={[0, -0.5, 0]}
        scale={0.22}
      />
      <Sky distance={1000} sunPosition={[500, 150, -1000]} turbidity={0.1} />
    </>
  );
}

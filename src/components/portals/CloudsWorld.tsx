// From the pmndrs "clouds" example (https://pmndrs.github.io/examples/clouds),
// using drei's <Clouds>. The example's leva panel is dropped; its default values
// are baked in below.
import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Cloud, Clouds, Sky } from "@react-three/drei";
import { Laptop, type ScreenPose } from "./Laptop";

type Vec3 = [number, number, number];

// The left portal looks down this direction (the frame is turned 0.5 rad toward the middle).
const VIEW = new THREE.Vector3(-Math.sin(0.5), 0, -Math.cos(0.5));
const along = (d: number, y = 0): Vec3 => [-1.15 + VIEW.x * d, y, VIEW.z * d];

// The example's scene is ~30 units across; shrink it and float it up ahead so we look up into it.
const SCALE = 0.3;
const CENTER = along(9, 2.5);
const world = ([x, y, z]: Vec3): Vec3 => [CENTER[0] + x * SCALE, CENTER[1] + y * SCALE, CENTER[2] + z * SCALE];

const config = {
  seed: 1,
  segments: 20,
  volume: 6,
  opacity: 0.8,
  fade: 10,
  growth: 4,
  speed: 0.1,
  bounds: [6, 1, 1] as Vec3,
};

function CloudCluster() {
  const ref = useRef<THREE.Group>(null!);
  const cloud0 = useRef<THREE.Group>(null!);
  useFrame((state, delta) => {
    ref.current.rotation.y = Math.cos(state.clock.elapsedTime / 2) / 2;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime / 2) / 2;
    cloud0.current.rotation.y -= delta;
  });
  return (
    <group position={CENTER} scale={SCALE}>
      <group ref={ref}>
        <Clouds material={THREE.MeshLambertMaterial} limit={400} texture="/portals/cloud.png">
          <Cloud ref={cloud0} {...config} color="white" />
          <Cloud {...config} color="#eed0d0" seed={2} position={[15, 0, 0]} />
          <Cloud {...config} color="#d0e0d0" seed={3} position={[-15, 0, 0]} />
          <Cloud {...config} color="#a0b0d0" seed={4} position={[0, 0, -12]} />
          <Cloud {...config} color="#c0c0dd" seed={5} position={[0, 0, 12]} />
          <Cloud concentrate="outside" growth={100} color="#ffccdd" opacity={1.25} seed={0.3} bounds={200} volume={200} />
        </Clouds>
      </group>
    </group>
  );
}

/** Portal world: drifting pastel clouds lit pink and red, with a laptop showing chunky.fm. */
export function CloudsWorld({ live, onScreen }: { live: boolean; onScreen?: (pose: ScreenPose) => void }) {
  return (
    <>
      <Sky />
      <ambientLight intensity={Math.PI / 1.5} />
      {/* The example's lights, moved and scaled with the clouds */}
      <spotLight
        position={world([0, 40, 0])}
        target-position={CENTER}
        decay={0}
        distance={45 * SCALE}
        penumbra={1}
        intensity={100}
      />
      <spotLight
        position={world([-20, 0, 10])}
        target-position={CENTER}
        color="red"
        angle={0.15}
        decay={0}
        penumbra={-1}
        intensity={30}
      />
      <spotLight
        position={world([20, -10, 10])}
        target-position={CENTER}
        color="red"
        angle={0.2}
        decay={0}
        penumbra={-1}
        intensity={20}
      />
      <CloudCluster />
      <Laptop
        live={live}
        onScreen={onScreen}
        url="https://chunkyfm-production.up.railway.app/"
        title="chunky.fm"
        position={along(2.6, 0.05)}
        rotation={[0, 0.5, 0]}
        scale={0.22}
      />
    </>
  );
}

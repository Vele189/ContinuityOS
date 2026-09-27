import * as THREE from "three";
import { useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { lerpC } from "./util";

const w = 1;
const h = 1;
const r = 0.1;
const depth = 1;
const s = new THREE.Shape();
s.moveTo(-w / 2, -h / 2 + r);
s.lineTo(-w / 2, h / 2 - r);
s.absarc(-w / 2 + r, h / 2 - r, r, 1 * Math.PI, 0.5 * Math.PI, true);
s.lineTo(w / 2 - r, h / 2);
s.absarc(w / 2 - r, h / 2 - r, r, 0.5 * Math.PI, 0 * Math.PI, true);
s.lineTo(w / 2, -h / 2 + r);
s.absarc(w / 2 - r, -h / 2 + r, r, 2 * Math.PI, 1.5 * Math.PI, true);
s.lineTo(-w / 2 + r, -h / 2);
s.absarc(-w / 2 + r, -h / 2 + r, r, 1.5 * Math.PI, 1 * Math.PI, true);

const boxGeometry = new THREE.BoxGeometry();
const roundedBoxGeometry = new THREE.ExtrudeGeometry(s, {
  depth: 1,
  bevelEnabled: false,
});
roundedBoxGeometry.translate(0, 0, -depth / 2);
roundedBoxGeometry.computeVertexNormals();

export type BoxProps = Omit<ThreeElements["group"], "ref" | "rotation"> & {
  /** Z rotation while idle. */
  idleRotation: number;
  /** Z rotation that makes this block a mirror in the 01 → 07 chain. */
  chainRotation: number;
  /** Turn into the chain rotation (after `chainDelay` seconds). */
  chained?: boolean;
  chainDelay?: number;
  /** Beam is on this block right now. */
  lit?: boolean;
  /** Beam has touched this block at least once. */
  revealed?: boolean;
  onHit?: () => void;
  onLeave?: () => void;
};

/** Reflective block from the pmndrs prism example; glows while the beam is on it. */
export function Box({
  idleRotation,
  chainRotation,
  chained = false,
  chainDelay = 0,
  lit = false,
  revealed = false,
  onHit,
  onLeave,
  ...props
}: BoxProps) {
  const group = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>(null!);
  const chainedSince = useRef<number | null>(null);
  useFrame((state) => {
    const now = state.clock.elapsedTime;
    if (!chained) chainedSince.current = null;
    else if (chainedSince.current === null) chainedSince.current = now;
    const inPlace = chainedSince.current !== null && now - chainedSince.current >= chainDelay;
    const goal = inPlace ? chainRotation : idleRotation;
    // Shortest way round
    const z = group.current.rotation.z;
    group.current.rotation.z = z + Math.atan2(Math.sin(goal - z), Math.cos(goal - z)) * 0.14;
    lerpC(inner.current.material.emissive, lit ? "white" : revealed ? "#5e6ad2" : "#454545", 0.1);
  });
  return (
    <group ref={group} scale={0.5} rotation-z={idleRotation} {...props}>
      <mesh visible={false} onRayOver={onHit} onRayOut={onLeave} geometry={boxGeometry} />
      <mesh ref={inner} geometry={roundedBoxGeometry}>
        <meshStandardMaterial color="#333" toneMapped={false} emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// From the pmndrs "grass-shader" example (https://pmndrs.github.io/examples/grass-shader),
// based on https://codepen.io/al-ro/pen/jJJygQ by al-ro. Blade textures from
// "Realistic real-time grass rendering" by Eddie Lee, 2010.
import * as THREE from "three";
import { useMemo, useRef } from "react";
import SimplexNoise from "simplex-noise";
import { useFrame, useLoader, type ThreeElements } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { Laptop, type ScreenPose } from "./Laptop";
import "./grassMaterial";

const simplex = new SimplexNoise(Math.random);

type GrassProps = ThreeElements["group"] & {
  options?: { bW: number; bH: number; joints: number };
  width?: number;
  instances?: number;
};

function Grass({ options = { bW: 0.12, bH: 1, joints: 5 }, width = 100, instances = 50000, ...props }: GrassProps) {
  const { bW, bH, joints } = options;
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const [texture, alphaMap] = useLoader(THREE.TextureLoader, ["/portals/blade_diffuse.jpg", "/portals/blade_alpha.jpg"]);
  const attributeData = useMemo(() => getAttributeData(instances, width), [instances, width]);
  const baseGeom = useMemo(() => new THREE.PlaneGeometry(bW, bH, 1, joints).translate(0, bH / 2, 0), [bW, bH, joints]);
  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, width, 32, 32);
    geo.lookAt(new THREE.Vector3(0, 1, 0));
    const positions = geo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] = getYPosition(positions[i], positions[i + 2]);
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [width]);
  const boundingSphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(), (Math.sqrt(2) * width) / 2), [width]);

  useFrame((state) => {
    materialRef.current.uniforms.time.value = state.clock.elapsedTime / 4;
  });

  return (
    <group {...props}>
      <mesh>
        <instancedBufferGeometry
          index={baseGeom.index}
          attributes-position={baseGeom.attributes.position}
          attributes-uv={baseGeom.attributes.uv}
          boundingSphere={boundingSphere}
        >
          <instancedBufferAttribute attach="attributes-offset" args={[attributeData.offsets, 3]} />
          <instancedBufferAttribute attach="attributes-orientation" args={[attributeData.orientations, 4]} />
          <instancedBufferAttribute attach="attributes-stretch" args={[attributeData.stretches, 1]} />
          <instancedBufferAttribute attach="attributes-halfRootAngleSin" args={[attributeData.halfRootAngleSin, 1]} />
          <instancedBufferAttribute attach="attributes-halfRootAngleCos" args={[attributeData.halfRootAngleCos, 1]} />
        </instancedBufferGeometry>
        <grassMaterial ref={materialRef} map={texture} alphaMap={alphaMap} toneMapped={false} />
      </mesh>
      <mesh geometry={groundGeo}>
        <meshStandardMaterial color="#000f00" />
      </mesh>
    </group>
  );
}

function getAttributeData(instances: number, width: number) {
  const offsets: number[] = [];
  const orientations: number[] = [];
  const stretches: number[] = [];
  const halfRootAngleSin: number[] = [];
  const halfRootAngleCos: number[] = [];

  let quaternion0 = new THREE.Vector4();
  const quaternion1 = new THREE.Vector4();

  // The min and max angle for the growth direction (in radians)
  const min = -0.25;
  const max = 0.25;

  for (let i = 0; i < instances; i++) {
    // Offset of the roots
    const offsetX = Math.random() * width - width / 2;
    const offsetZ = Math.random() * width - width / 2;
    const offsetY = getYPosition(offsetX, offsetZ);
    offsets.push(offsetX, offsetY, offsetZ);

    // Rotate around Y
    let angle = Math.PI - Math.random() * (2 * Math.PI);
    halfRootAngleSin.push(Math.sin(0.5 * angle));
    halfRootAngleCos.push(Math.cos(0.5 * angle));
    quaternion0.set(0, Math.sin(angle / 2), 0, Math.cos(angle / 2)).normalize();

    // Rotate around X
    angle = Math.random() * (max - min) + min;
    quaternion1.set(Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)).normalize();
    quaternion0 = multiplyQuaternions(quaternion0, quaternion1);

    // Rotate around Z
    angle = Math.random() * (max - min) + min;
    quaternion1.set(0, 0, Math.sin(angle / 2), Math.cos(angle / 2)).normalize();
    quaternion0 = multiplyQuaternions(quaternion0, quaternion1);

    orientations.push(quaternion0.x, quaternion0.y, quaternion0.z, quaternion0.w);

    // Variety in height
    stretches.push(i < instances / 3 ? Math.random() * 1.8 : Math.random());
  }

  // Typed once here (and memoized by the caller) so re-renders don't re-create and re-upload the buffers
  return {
    offsets: new Float32Array(offsets),
    orientations: new Float32Array(orientations),
    stretches: new Float32Array(stretches),
    halfRootAngleCos: new Float32Array(halfRootAngleCos),
    halfRootAngleSin: new Float32Array(halfRootAngleSin),
  };
}

function multiplyQuaternions(q1: THREE.Vector4, q2: THREE.Vector4) {
  const x = q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x;
  const y = -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y;
  const z = q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z;
  const w = -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w;
  return new THREE.Vector4(x, y, z, w);
}

function getYPosition(x: number, z: number) {
  let y = 2 * simplex.noise2D(x / 50, z / 50);
  y += 4 * simplex.noise2D(x / 100, z / 100);
  y += 0.2 * simplex.noise2D(x / 10, z / 10);
  return y;
}

/** Portal world: a windswept meadow under a bright sky, with a laptop floating over it. */
export function GrassWorld({ live, onScreen }: { live: boolean; onScreen?: (pose: ScreenPose) => void }) {
  return (
    <>
      <Sky azimuth={1} inclination={0.6} distance={1000} />
      <ambientLight intensity={Math.PI} />
      <pointLight position={[10, 10, 10]} intensity={Math.PI} decay={0} />
      <Grass position={[0, -1.2, -4]} scale={0.08} instances={14000} />
      <Laptop
        live={live}
        onScreen={onScreen}
        url="https://joincontinuum.co.za/"
        title="Continuum, joincontinuum.co.za"
        position={[0, 0.05, -2.6]}
        scale={0.22}
      />
    </>
  );
}


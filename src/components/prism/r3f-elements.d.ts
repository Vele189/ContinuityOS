import type { RainbowMaterialProps } from "./Rainbow";

declare module "@react-three/fiber" {
  interface ThreeElements {
    rainbowMaterial: RainbowMaterialProps;
  }
}

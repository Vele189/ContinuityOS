import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { presets } from "./phasePresets";

/** Animated shader-gradient fill. Rendered for the active card only (see phaseStill for the others). */
export function PhaseGradient({ index, active }: { index: number; active: boolean }) {
  const preset = presets[index % presets.length];
  return (
    <ShaderGradientCanvas
      style={{ position: "absolute", inset: 0 }}
      pixelDensity={1}
      fov={45}
      pointerEvents="none"
      lazyLoad
    >
      <ShaderGradient control="props" {...preset} animate={active ? "on" : "off"} />
    </ShaderGradientCanvas>
  );
}

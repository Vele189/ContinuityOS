import { LookupTexture } from "postprocessing";

/**
 * The prism's colour grade, generated instead of loaded from a .cube file:
 * a slightly darker, cool-shadowed film look (mids pulled down, shadows
 * nudged toward blue, highlights left neutral, saturation eased off).
 * 16³ entries in RGBA float, red varying fastest, as LUTCubeLoader lays them out.
 */
export function createPrismGrade(size = 16) {
  const data = new Float32Array(size ** 3 * 4);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  let i = 0;
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        let rgb = [r, g, b].map((c) => c / (size - 1));
        // Tone: deepen mids, keep black and white pinned
        rgb = rgb.map((c) => Math.pow(c, 1.2));
        // Saturation eased off a little around luma
        const luma = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
        rgb = rgb.map((c) => lerp(luma, c, 0.82));
        // Cool shadows, fading out toward the highlights
        const shadow = Math.pow(1 - luma, 2) * 0.06;
        rgb = [rgb[0] - shadow * 0.5, rgb[1] + shadow * 0.2, rgb[2] + shadow];
        for (const c of rgb) data[i++] = Math.min(1, Math.max(0, c));
        data[i++] = 1;
      }
    }
  }
  return new LookupTexture(data, size);
}

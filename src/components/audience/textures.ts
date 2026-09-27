import * as THREE from "three";
import { rgba } from "@/lib/spectrum";

// Card faces drawn on a 2D canvas: the site's dark panel with a spectrum glow.

type RGB = [number, number, number];

function paintPanel(ctx: CanvasRenderingContext2D, w: number, h: number, color: RGB, accent: RGB, seed: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#18191a");
  bg.addColorStop(1, "#0b0c0d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Two soft glows; `seed` moves them so neighbouring cards differ
  const r = Math.max(w, h);
  const glows: [number, number, RGB, number][] = [
    [((seed * 0.37) % 1) * w, ((seed * 0.61) % 1) * h * 0.6, color, 0.55],
    [w - ((seed * 0.53) % 1) * w * 0.6, h - ((seed * 0.29) % 1) * h * 0.4, accent, 0.35],
  ];
  for (const [x, y, c, a] of glows) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.9);
    g.addColorStop(0, rgba(c, a));
    g.addColorStop(0.55, rgba(c, a * 0.18));
    g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // Grain
  const image = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    image.data[i] += n;
    image.data[i + 1] += n;
    image.data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Small card on the ring: gradient only (it's seen at angles, often from behind). */
export function ringCardTexture(color: RGB, accent: RGB, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 324;
  canvas.height = 200;
  const ctx = canvas.getContext("2d")!;
  paintPanel(ctx, canvas.width, canvas.height, color, accent, seed);
  // Accent rule
  ctx.fillStyle = rgba(color);
  ctx.fillRect(20, 20, 36, 4);
  return toTexture(canvas);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** The big centre card: the hovered statement, readable. Portrait, 1 : 1.618. */
export function activeCardTexture(tag: string, quote: string, index: string, color: RGB, accent: RGB, seed: number) {
  const W = 640;
  const H = Math.round(W * 1.618);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  paintPanel(ctx, W, H, color, accent, seed);
  const pad = 64;
  ctx.textBaseline = "top";

  ctx.fillStyle = rgba(color);
  ctx.fillRect(pad, pad, 72, 6);
  ctx.font = '500 30px "Geist Mono", ui-monospace, monospace';
  ctx.fillText(tag.toUpperCase(), pad, pad + 36);

  ctx.fillStyle = "#f7f8f8";
  ctx.font = '600 58px Inter, ui-sans-serif, system-ui, sans-serif';
  const lines = wrap(ctx, `“${quote}”`, W - pad * 2);
  const lh = 70;
  let y = H - pad - 60 - lines.length * lh;
  for (const line of lines) {
    ctx.fillText(line, pad, y);
    y += lh;
  }

  ctx.fillStyle = "#8a8f98";
  ctx.font = '500 26px "Geist Mono", ui-monospace, monospace';
  ctx.fillText(index, pad, H - pad - 26);
  return toTexture(canvas);
}

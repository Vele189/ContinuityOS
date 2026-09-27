import * as THREE from "three";
import { rgba, type SPECTRUM } from "@/lib/spectrum";

// Card faces are drawn on a 2D canvas, then used as textures.

export const CARD_ASPECT = 1.25; // height / width
const W = 1024;
const H = Math.round(W * CARD_ASPECT);

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

/** Benefit card face: dark panel, spectrum glow, number, title, body. */
export function cardTexture(index: number, title: string, body: string, color: (typeof SPECTRUM)[number]) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const pad = 96;
  // The cards' front faces point into the ring, so we see them from behind.
  // Draw mirrored so the text reads correctly from outside.
  ctx.translate(W, 0);
  ctx.scale(-1, 1);

  // Panel
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#18191a");
  bg.addColorStop(1, "#0f1011");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Spectrum glow from the top-left corner
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 1.1);
  glow.addColorStop(0, rgba(color, 0.45));
  glow.addColorStop(0.5, rgba(color, 0.08));
  glow.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Accent rule
  ctx.fillStyle = rgba(color);
  ctx.fillRect(pad, pad, 96, 8);

  ctx.textBaseline = "top";

  ctx.fillStyle = rgba(color);
  ctx.font = '500 52px "Geist Mono", ui-monospace, monospace';
  ctx.fillText(String(index + 1).padStart(2, "0"), pad, pad + 56);

  // Title and body sit at the bottom
  ctx.font = '600 92px Inter, ui-sans-serif, system-ui, sans-serif';
  const titleLines = wrap(ctx, title, W - pad * 2);
  ctx.font = '400 50px Inter, ui-sans-serif, system-ui, sans-serif';
  const bodyLines = wrap(ctx, body, W - pad * 2);
  const titleLH = 104;
  const bodyLH = 72;
  let y = H - pad - bodyLines.length * bodyLH - 40 - titleLines.length * titleLH;

  ctx.fillStyle = "#f7f8f8";
  ctx.font = '600 92px Inter, ui-sans-serif, system-ui, sans-serif';
  for (const line of titleLines) {
    ctx.fillText(line, pad, y);
    y += titleLH;
  }
  y += 40;
  ctx.fillStyle = "#8a8f98";
  ctx.font = '400 50px Inter, ui-sans-serif, system-ui, sans-serif';
  for (const line of bodyLines) {
    ctx.fillText(line, pad, y);
    y += bodyLH;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Wait for the page fonts so the canvas draws Inter / Geist Mono, not a fallback. */
export function fontsReady() {
  return Promise.all([
    document.fonts.load('600 92px "Inter"'),
    document.fonts.load('400 50px "Inter"'),
    document.fonts.load('500 52px "Geist Mono"'),
  ]).then(() => undefined);
}

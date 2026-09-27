/** The rainbow used by the "CONTINUE" colourful text; shared by accents that echo it. */
export const SPECTRUM: [number, number, number][] = [
  [131, 179, 32],
  [47, 195, 106],
  [42, 169, 210],
  [4, 112, 202],
  [107, 10, 255],
  [183, 0, 218],
  [218, 0, 171],
  [230, 64, 92],
  [232, 98, 63],
  [249, 129, 47],
];

export function rgba([r, g, b]: [number, number, number], alpha = 1) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** `count` colours spread evenly across the spectrum, first to last. */
export function spread(count: number) {
  return Array.from({ length: count }, (_, i) =>
    SPECTRUM[Math.round((i * (SPECTRUM.length - 1)) / Math.max(1, count - 1))],
  );
}

const CANVAS: [number, number, number] = [1, 1, 2];

function luminance([r, g, b]: [number, number, number]) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * The colour, lifted toward white just enough to reach `ratio`:1 contrast on the
 * page background. For spectrum colours used as small text (the deep blues and
 * violets are too dark as-is).
 */
export function readable(color: [number, number, number], ratio = 4.5): [number, number, number] {
  const bg = luminance(CANVAS) + 0.05;
  let mixed = color;
  for (let t = 0; t <= 1; t += 0.02) {
    mixed = color.map((c) => Math.round(c + (255 - c) * t)) as [number, number, number];
    if ((luminance(mixed) + 0.05) / bg >= ratio) break;
  }
  return mixed;
}

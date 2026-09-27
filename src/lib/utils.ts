import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the custom type-scale utilities in globals.css so
// they are not mistaken for text colors and dropped (e.g. `text-eyebrow text-ink`).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-lg",
            "display-md",
            "headline",
            "card-title",
            "body-lg",
            "body",
            "body-sm",
            "caption",
            "eyebrow",
            "mono",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

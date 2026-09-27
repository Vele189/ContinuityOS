import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { rgba, SPECTRUM } from "@/lib/spectrum";
import { useReducedMotion } from "@/lib/visibility";

const colors = SPECTRUM.map((c) => rgba(c));

export default function ColourfulText({ text, className }: { text: string; className?: string }) {
  const [currentColors, setCurrentColors] = React.useState(colors);
  const [count, setCount] = React.useState(0);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    // Reduced motion: keep the first colours, no recurring blur-and-bounce
    if (reduced) return;
    const interval = setInterval(() => {
      const shuffled = [...colors].sort(() => Math.random() - 0.5);
      setCurrentColors(shuffled);
      setCount((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [reduced]);

  return text.split("").map((char, index) => (
    <motion.span
      key={`${char}-${count}-${index}`}
      initial={{
        y: 0,
      }}
      animate={{
        color: currentColors[index % currentColors.length],
        y: [0, -3, 0],
        scale: [1, 1.01, 1],
        filter: ["blur(0px)", `blur(5px)`, "blur(0px)"],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
      }}
      className={cn("inline-block whitespace-pre font-sans tracking-tight", className)}
    >
      {char}
    </motion.span>
  ));
}

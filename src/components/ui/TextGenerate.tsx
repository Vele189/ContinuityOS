import { motion } from "motion/react";

/** Aceternity: Text Generate Effect — words fade and un-blur in sequence on view. */
export function TextGenerate({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      transition={{ staggerChildren: 0.08 }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, filter: "blur(8px)" },
            visible: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.5 } },
          }}
        >
          {word}
          {i < words.length - 1 && " "}
        </motion.span>
      ))}
    </motion.span>
  );
}

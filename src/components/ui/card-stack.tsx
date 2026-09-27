import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Card = {
  id: number;
  name?: string;
  designation?: string;
  content: React.ReactNode;
};

/**
 * Aceternity: Card Stack.
 * Uncontrolled: flips the top card to the back every 5s (original behaviour).
 * Controlled (`activeIndex`): cards 0..activeIndex are dealt onto the stack,
 * newest on top; later cards wait below, hidden, until they are reached.
 */
export const CardStack = ({
  items,
  offset,
  scaleFactor,
  activeIndex,
  className,
  cardClassName,
}: {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
  activeIndex?: number;
  className?: string;
  cardClassName?: string;
}) => {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const controlled = activeIndex !== undefined;
  const [cards, setCards] = useState<Card[]>(items);

  useEffect(() => {
    if (controlled) return;
    const interval = setInterval(() => {
      setCards((prevCards: Card[]) => {
        const newArray = [...prevCards]; // create a copy of the array
        newArray.unshift(newArray.pop()!); // move the last element to the front
        return newArray;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [controlled]);

  const list = controlled ? items : cards;

  return (
    <div className={cn("relative h-60 w-60 md:h-60 md:w-96", className)}>
      {list.map((card, index) => {
        // Depth 0 = top card. Controlled mode counts back from the active card.
        const depth = controlled ? activeIndex - index : index;
        const pending = depth < 0;
        return (
          <motion.div
            key={card.id}
            className={cn(
              "absolute dark:bg-black bg-white h-60 w-60 md:h-60 md:w-96 rounded-3xl p-4 shadow-xl border border-neutral-200 dark:border-white/[0.1]  shadow-black/[0.1] dark:shadow-white/[0.05] flex flex-col justify-between",
              cardClassName,
            )}
            style={{
              transformOrigin: "top center",
              // Hidden and buried cards must not swallow the pointer (e.g. glare hover).
              pointerEvents: depth === 0 ? "auto" : "none",
            }}
            initial={false}
            animate={
              pending
                ? { top: 80, scale: 1, opacity: 0, zIndex: list.length + 1 }
                : {
                    top: depth * -CARD_OFFSET,
                    scale: 1 - depth * SCALE_FACTOR, // decrease scale for cards that are behind
                    opacity: depth > 2 ? 0 : 1, // only a few cards peek out behind
                    zIndex: list.length - depth, //  decrease z-index for the cards that are behind
                  }
            }
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            aria-hidden={depth !== 0}
          >
            <div className="font-normal text-neutral-700 dark:text-neutral-200">
              {card.content}
            </div>
            {card.name || card.designation ? (
              <div>
                <p className="text-neutral-500 font-medium dark:text-white">
                  {card.name}
                </p>
                <p className="text-neutral-400 font-normal dark:text-neutral-200">
                  {card.designation}
                </p>
              </div>
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
};

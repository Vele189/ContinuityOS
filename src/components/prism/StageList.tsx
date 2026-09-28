import { modelStages } from "@/content/site";
import { cn } from "@/lib/utils";

/** `copy`: the visual-only duplicate (the WebGL fallback) — hidden from assistive tech, no heading tags. */
export function StageList({ className, copy }: { className?: string; copy?: boolean }) {
  const Title = copy ? "p" : "h3";
  return (
    <ol aria-hidden={copy || undefined} className={cn("grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {modelStages.map((stage, i) => (
        <li key={stage.name} className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-1 px-4 py-[18px]">
          <Title className="text-eyebrow text-ink uppercase">
            {String(i + 1).padStart(2, "0")} {stage.name}
          </Title>
          <p className="text-body-sm text-ink-subtle">{stage.body}</p>
        </li>
      ))}
    </ol>
  );
}

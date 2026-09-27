import { cn } from "@/lib/utils";

export function LogoMark({
  size = 22,
  className,
  beamTarget = false,
  ref,
}: {
  size?: number;
  className?: string;
  ref?: React.Ref<HTMLImageElement>;
  /** The prism section's light beam aims at this mark (see NavBeam). */
  beamTarget?: boolean;
}) {
  return (
    <img
      ref={ref}
      data-continuity-logo={beamTarget || undefined}
      src="/brand/logo-mark-light.svg"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}

export function LogoLockup({ className, beamTarget = false }: { className?: string; beamTarget?: boolean }) {
  return (
    <a href="/" aria-label="ContinuityOS home" className={cn("flex items-center gap-2.5", className)}>
      <LogoMark beamTarget={beamTarget} />
      <span className="font-brand text-base leading-none font-bold tracking-[-0.16px] text-ink">
        ContinuityOS
      </span>
    </a>
  );
}

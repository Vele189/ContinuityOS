import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders `children` only once the placeholder comes within `rootMargin` of the
 * viewport, then keeps them mounted. `React.lazy` alone splits the code but
 * still fetches and builds every 3D scene at page load; this defers that work
 * until the section is about to be seen.
 */
export function MountWhenNear({
  children,
  className,
  rootMargin = "600px",
}: {
  children: ReactNode;
  className?: string;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || mounted) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {mounted ? children : null}
    </div>
  );
}

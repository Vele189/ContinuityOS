import { footerColumns } from "@/content/site";
import { LogoLockup } from "@/components/ui/Logo";

/** Figma: 11 — Footer (8:87). */
export function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-14 px-6 pt-16 pb-10 lg:px-[120px]">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="flex flex-col gap-3 lg:w-[340px] lg:shrink-0">
            <LogoLockup />
            <p className="text-body-sm text-ink-subtle">Technology · Creative · Research · Products</p>
            <p className="font-script text-lg leading-[1.3] text-ink-subtle">it simply continues</p>
          </div>
          <nav aria-label="Footer" className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-12">
            {footerColumns.map((column) => (
              <div key={column.title} className="flex flex-col gap-3">
                <p className="text-eyebrow text-ink-tertiary uppercase">{column.title}</p>
                {column.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-body-sm whitespace-nowrap text-ink-subtle transition-colors hover:text-ink"
                    {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <div className="border-t border-hairline pt-6">
          <p className="text-caption text-ink-tertiary">© 2026 ContinuityOS · South Africa</p>
        </div>
      </div>
    </footer>
  );
}

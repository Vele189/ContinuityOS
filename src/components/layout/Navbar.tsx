import { useCallback, useState, type CSSProperties } from "react";
import { navLinks } from "@/content/site";
import { GlassButton } from "@/components/ui/GlassButton";
import { rgba, spread } from "@/lib/spectrum";
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

const items = navLinks.map((link) => ({ name: link.label, link: link.href }));
const colors = spread(items.length);
const MENU_ID = "mobile-menu";

/** Figma: 00 — Nav (3:2). Aceternity: Resizable Navbar — shrinks to a floating pill on scroll. */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <ResizableNavbar className="top-0 pt-3">
      <NavBody>
        <NavbarLogo />
        <NavItems items={items} />
        <div className="relative z-20 flex items-center gap-2.5">
          <GlassButton href="#work">View our work</GlassButton>
          <GlassButton href="#contact">Start a conversation</GlassButton>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader className="px-4">
          <NavbarLogo />
          <MobileNavToggle isOpen={open} onClick={() => setOpen((v) => !v)} controls={MENU_ID} />
        </MobileNavHeader>

        <MobileNavMenu id={MENU_ID} isOpen={open} onClose={close}>
          {items.map((item, idx) => (
            <a
              key={item.name}
              href={item.link}
              onClick={close}
              className="text-body text-ink-subtle transition-colors hover:text-(--nav)"
              style={{ "--nav": rgba(colors[idx]) } as CSSProperties}
            >
              {item.name}
            </a>
          ))}
          <div className="flex w-full flex-col gap-3 pt-2">
            <GlassButton href="#work" onClick={close} block>
              View our work
            </GlassButton>
            <GlassButton href="#contact" onClick={close} block>
              Start a conversation
            </GlassButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  );
}

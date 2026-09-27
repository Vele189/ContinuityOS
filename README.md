# ContinuityOS: landing page

Marketing site for ContinuityOS, built from the Figma file
[ContinuityOS Landing (Desktop 1440)](https://www.figma.com/design/2nS5XzgHyIX0g1tOeQRIZB/ContinuityOS?node-id=2-41).

**Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · Motion · three.js (React Three Fiber, drei)

## Getting started

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # production build (dist/)
npm run preview # serve the build
npm run lint
```

The contact form needs `RESEND_API_KEY` and, in production, `CONTACT_FROM` (see `.env.example`).

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel (**Add New → Project**). `vercel.json` sets the framework (Vite),
   build command and output folder, so the defaults need no changes.
2. Under **Settings → Environment Variables**, add for Production (and Preview if you want the form to work there):
   - `RESEND_API_KEY`: from https://resend.com/api-keys
   - `CONTACT_FROM`: a sender on a domain verified in Resend, e.g. `ContinuityOS <website@continuityos.co.za>`
   - `CONTACT_TO` (optional): defaults to `info@continuityos.co.za`
3. Deploy, then add the domain under **Settings → Domains**. The canonical URL, sitemap and social tags assume
   `https://continuityos.co.za`; update `index.html`, `public/robots.txt` and `public/sitemap.xml` if it differs.
4. Optional: add a rate-limit rule for `/api/contact` in **Firewall** (the in-code limit is per instance).

`api/contact.ts` deploys as a serverless function; `vercel.json` also sets the security headers (CSP), clean URLs
(`/privacy`, `/terms`) and long-lived caching for hashed assets.

## Project structure

```
public/
  brand/            Logo mark (from Figma Logo/Mark)
  draco/            Self-hosted Draco decoder for the laptop model
  fonts/            Self-hosted web fonts (Inter, Open Sans, Geist Mono, Sarina) + 3D text fonts
  icons/            Timeline nodes
  portals/          Laptop model and textures for the Work portals
  prism/            Prism model and generated flare textures (see LICENSE.txt)
  privacy.html      Privacy notice (POPIA)
  terms.html        Terms of use
  og.jpg            Social preview image
index.html          Metadata, structured data, font preload
vercel.json         Security headers (CSP etc.), clean URLs, asset caching
api/
  contact.ts        Lead form endpoint: validation, spam checks, sends via Resend. Served by vite.config.ts in dev
src/
  main.tsx          React entry
  App.tsx           Composes the page; MotionConfig honours reduced motion
  styles/
    globals.css     Design tokens (Figma variables), fonts, type scale, keyframes
  components/
    layout/         Navbar, Footer
    sections/       One file per Figma section (Hero, Statement, ValueProposition, …)
    ui/             Reusable primitives (Eyebrow, GlassButton, MountWhenNear, …)
    audience/       "Who we work with" card ring (three.js)
    benefits/       Benefits carousel (three.js)
    portals/        Work section portals: clouds, grass and water worlds with live-site laptops
    prism/          Continuity Model prism and beam
  content/
    site.ts         All copy and data: edit text here
  lib/
    spectrum.ts     The "CONTINUE" colour spectrum and contrast helper
    visibility.ts   In-view, idle and reduced-motion hooks
    utils.ts        `cn()` helper (clsx + tailwind-merge aware of the type scale)
```

## Performance notes

- Every three.js section loads only as it nears the viewport (`MountWhenNear`) and stops rendering when off-screen.
- The hero globe mounts once the browser is idle and pauses when scrolled away.
- Canvases cap device pixel ratio at 1.5.

## Section map

| Figma node | Section | Component |
| --- | --- | --- |
| 3:2 | 00 Nav | `layout/Navbar.tsx` |
| 3:20 | 01 Hero | `sections/Hero.tsx` |
| 17:13 | 01b Statement | `sections/Statement.tsx` |
| 4:3 | 02 Value Proposition | `sections/ValueProposition.tsx` |
| 4:44 | 03 What We Do | `sections/Capabilities.tsx` |
| 4:172 | 04 The Continuity Model | `sections/ContinuityModel.tsx` |
| 5:2 | 05 Why Continuity Is Different | `sections/WhyDifferent.tsx` |
| 5:94 | 06 Work & Products | `sections/Work.tsx` |
| 6:71 | 08 Who We Work With | `sections/WhoWeWorkWith.tsx` |
| 6:112 | 09 About | `sections/About.tsx` |
| 8:2 | 10 Final CTA + Lead Form | `sections/FinalCta.tsx`, `sections/ContactForm.tsx` |
| 8:87 | 11 Footer | `layout/Footer.tsx` |

## Still to supply

- Real social profile URLs (footer "Connect" links in `content/site.ts`)
- Legal review of `public/privacy.html` and `public/terms.html`

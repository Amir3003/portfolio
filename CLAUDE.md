# Portfolio: rules for agents

## Mandatory check before handing over any task

Every change that touches UI, layout, styles or interactivity must pass both checks before it is reported as done:

1. `pnpm verify` (TypeScript `tsc --noEmit` plus `next build`). Next.js 16.4 sometimes stops the first build with an upgrade notice; run it again.
2. `pnpm test:ui` (Playwright, `tests/portfolio-ui.spec.ts`). It serves the production build on port 3100 and checks every route at 1440x900 and 390x844:
   - every visible link and button is clickable (no layer intercepts pointer events);
   - the page scrolls from top to footer and the footer is not covered by fixed layers;
   - no horizontal overflow;
   - no `console.error`, `pageerror` or 4xx/5xx responses;
   - full-page screenshots of the home page go to `/tmp/portfolio-desktop.png` and `/tmp/portfolio-mobile.png`. Open them and look at contrast, spacing and overlaps.

Playwright is pinned to 1.63.0 to match the browser preinstalled in cloud sessions. Do not run `playwright install`.

After builds: `git checkout tsconfig.tsbuildinfo next-env.d.ts; rm -f AGENTS.md`.

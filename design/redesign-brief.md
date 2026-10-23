# Portfolio redesign brief (shared by all agents)

Repo: /home/user/portfolio (Next.js 16 App Router, React 19, Tailwind 4, R3F). Git branch: redesign/ticket.
NEVER commit, push, or change git state. Never edit files another agent owns (see "Ownership").
Owner: Amir Nagiyev, 17, AI & ML developer, Astana. Studies at Qazaq AI Research University (QAIRU).
Projects: Voyage AI (travel concierge, EN/RU) and QADAM ("qadam" = step in Kazakh, AI opportunity hub).
Owner approved concept: the site is his future boarding pass Astana NQZ -> Tokyo NRT, 28 AUG 2029,
seat 17A, gate N2 (JLPT N2), class STUDENT, boarding "THE NEXT STEP", katakana アミル・ナギエフ.
Approved mockup (static, works): design/mock-ticket/
  index.html, sky.css, sky.js (animated sky + silhouettes), ticket.css, ticket.js (boarding pass with tilt, tear,
  live clocks, countdown, real QR -> https://www.instagram.com/ijustwannaw1n/), fonts/ (TikTok Sans variable).
  Screenshots of the approved look: design/mock-ticket/c-rest2.png, summary.png.
  The owner liked: the ticket, the moving sky with clouds and a plane, the huge wide words VOYAGE AI / QADAM.

## Story of the page (the scroll is the flight)
Top of page = daytime over Astana (Baiterek bottom-left). Scrolling down, the sky moves from day to golden hour
to night as we "fly" to Tokyo; at the bottom it is night over Tokyo with Tokyo Tower lit (bottom-right) and
Mt Fuji behind it. The sky is one fixed full-viewport background for the whole home page, driven by
sky.setTime(t) with t in [0,1] (0 = day, ~0.5 = golden hour, 1 = night).

## Rules
- English UI copy, no em dashes or en dashes, no emojis, no invented facts.
- Keep the existing 3D laptop scroll story (components/laptop/*) and the Voyage AI / QADAM panels working
  exactly as now, including mobile full-screen mode and the RU/EN switch. Do not edit voyage-dashboard.tsx,
  qadam-showcase.tsx, lib/voyage/*.
- Keep SEO: one h1 on the home page with his name, metadata, JSON-LD, sitemap, case pages.
- prefers-reduced-motion: no motion, content intact. Mobile 390px first-class, no horizontal scroll.
- Verify: `cd /home/user/portfolio && npx tsc --noEmit -p .` and `pnpm build` must pass; afterwards run
  `git checkout tsconfig.tsbuildinfo next-env.d.ts; rm -f AGENTS.md`. A dev server may run on localhost:3000
  (start one with `pnpm dev -p 3000` in the background if not). Screenshots: playwright-core in
  /tmp/claude-0/-home-user-portfolio/a5334d2d-c16b-5a4f-80a7-a3b08fac3063/scratchpad/shot (chromium
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'; avoid swiftshader flags; pass timeout:120000 to screenshot).

## Ownership
- Agent ART: only design/mock-ticket/sky.js, sky.css, sky-demo.html (+ new art files there).
- Agent HERO: app/page.tsx, app/layout.tsx, app/globals.css, components/sky/*, components/ticket/*,
  components/laptop/story-laptop.tsx (only overlay colours/hero hand-off), lib/fonts if needed, public/fonts/*.
- Agent SECTIONS: components/projects-section.tsx, components/contact.tsx, components/project-case.tsx,
  components/site-header.tsx, components/site-footer.tsx (new), components/section-heading.tsx,
  app/projects/*/page.tsx (layout only, keep text), components/legal/legal-page.tsx.

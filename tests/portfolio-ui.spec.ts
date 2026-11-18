import { expect, test, type Page } from '@playwright/test'

const ROUTES = ['/', '/projects/qadam', '/projects/voyage-ai', '/privacy', '/terms', '/refund']

function watch(page: Page) {
  const problems: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`)
  })
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith('http://localhost')) problems.push(`${r.status()}: ${r.url()}`)
  })
  return problems
}

// Walks the page top to bottom so scroll-driven sections mount and lazy images load.
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6)
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 60))
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    await new Promise((r) => setTimeout(r, 400))
  })
}

// A returning visitor has already answered the consent banner, so it does not sit over the page.
test.beforeEach(async ({ page }, info) => {
  if (info.title === 'consent banner') return
  await page.addInitScript(() => localStorage.setItem('consent.analytics.v1', 'denied'))
})

test('consent banner', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  const banner = page.getByRole('region', { name: 'Analytics consent' })
  await expect(banner).toBeVisible()
  await page.getByRole('button', { name: 'Accept analytics' }).click({ trial: true })
  await page.getByRole('button', { name: 'Decline' }).click()
  await expect(banner).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('consent.analytics.v1'))).toBe('denied')
})

for (const route of ROUTES) {
  test(`layout ${route}`, async ({ page }, info) => {
    const problems = watch(page)
    await page.goto(route, { waitUntil: 'networkidle' })
    await scrollThrough(page)

    const m = await page.evaluate(() => {
      const de = document.documentElement
      const vw = de.clientWidth
      const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) return false
          // Ignore anything inside a clipping ancestor.
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const o = getComputedStyle(p)
            if (/(hidden|clip|auto|scroll)/.test(o.overflowX)) return false
          }
          return r.right > vw + 1 || r.left < -1
        })
        .slice(0, 10)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`)
      const bodyStyle = getComputedStyle(document.body)
      return {
        scrollWidth: de.scrollWidth,
        innerWidth: window.innerWidth,
        scrollHeight: de.scrollHeight,
        innerHeight: window.innerHeight,
        scrollY: window.scrollY,
        overflowY: [getComputedStyle(de).overflowY, bodyStyle.overflowY],
        offenders,
      }
    })

    expect.soft(m.scrollWidth, `horizontal overflow: ${m.offenders.join(', ')}`).toBeLessThanOrEqual(m.innerWidth)
    expect.soft(m.overflowY.includes('hidden'), 'page scroll locked').toBe(false)
    if (m.scrollHeight > m.innerHeight) {
      expect.soft(m.scrollY, 'page could not reach the bottom').toBeGreaterThanOrEqual(m.scrollHeight - m.innerHeight - 2)
    }

    // The last content in the footer must not sit under a fixed or sticky layer.
    const footerBlocked = await page.evaluate(() => {
      const f = [...document.querySelectorAll('footer')].pop()
      if (!f) return null
      const items = [...f.querySelectorAll<HTMLElement>('a, button, p')].filter((e) => e.getBoundingClientRect().height > 0)
      const last = items[items.length - 1]
      if (!last) return null
      const r = last.getBoundingClientRect()
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return hit && (last === hit || last.contains(hit)) ? null : `${hit?.tagName}.${hit?.className}`
    })
    expect.soft(footerBlocked, 'footer covered by').toBeNull()

    if (route === '/') {
      // A CSS filter on the drifting cloud layers is re-run every frame and made the end of the
      // page stutter on phones: the tints must stay baked into bitmaps.
      const filters = await page.evaluate(() => [...document.querySelectorAll('.sky__drift')].map((e) => getComputedStyle(e).filter))
      expect.soft(filters.length, 'cloud layers present').toBeGreaterThan(0)
      expect.soft(filters.filter((f) => f !== 'none'), 'cloud layers with a CSS filter').toEqual([])
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.waitForTimeout(400)
      await page.screenshot({ path: `/tmp/portfolio-${info.project.name}.png`, fullPage: true })
    }
    expect.soft(problems, 'console / network errors').toEqual([])
  })

  test(`hit targets ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' })
    await scrollThrough(page)
    const targets = page.locator('a[href], button, [role="button"], [role="switch"], [role="tab"], summary')
    const count = await targets.count()
    const blocked: string[] = []
    for (let i = 0; i < count; i++) {
      const el = targets.nth(i)
      if (!(await el.isVisible())) continue
      // Visually hidden helpers (the skip link) only appear on focus.
      const box = await el.boundingBox()
      if (!box || box.width <= 1 || box.height <= 1) continue
      const label = ((await el.getAttribute('aria-label')) || (await el.innerText()).trim() || (await el.getAttribute('href')) || '').slice(0, 50)
      try {
        await el.scrollIntoViewIfNeeded({ timeout: 2000 })
        await el.click({ trial: true, timeout: 2500 })
      } catch (e) {
        const msg = String(e)
        const why = msg.match(/<[^>]+> (?:from <[^>]+> subtree )?intercepts pointer events/)?.[0] ?? msg.split('\n')[0]
        blocked.push(`${label} -> ${why}`)
      }
    }
    expect(blocked, `blocked targets on ${route}`).toEqual([])
  })
}

// Phones: in the story the project screen is a landscape rectangle just wider than the laptop,
// with the full screen button under it, and full screen hides the site header.
test('phone project screens', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'phone layout only')
  await page.addInitScript(() => localStorage.setItem('consent.analytics.v1', 'denied'))
  await page.goto('/', { waitUntil: 'networkidle' })
  const geo = await page.evaluate(() => {
    const st = [...document.querySelectorAll<HTMLElement>('div')].find((d) => d.style.height.endsWith('vh') && d.children.length)!
    const r = st.getBoundingClientRect()
    return { top: r.top + scrollY, range: r.height - innerHeight }
  })
  for (const [id, p, label] of [['voyage-panel', 0.64, 'Voyage AI'], ['qadam-panel', 0.83, 'QADAM']] as const) {
    for (const q of [0.3, 0.45, 0.55, p]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(geo.top + q * geo.range))
      await page.waitForTimeout(500)
    }
    const box = await page.locator(`#${id}`).boundingBox()
    expect(box, `${label} panel visible`).not.toBeNull()
    expect(box!.width, `${label} panel width`).toBeGreaterThan(360)
    expect(box!.width, `${label} panel fits the screen`).toBeLessThanOrEqual(390)
    expect(box!.height, `${label} panel is a landscape rectangle, not a tall card`).toBeLessThan(box!.width)
    const open = page.getByRole('button', { name: new RegExp(`Open ${label}`) })
    const pill = await open.boundingBox()
    expect(pill!.y, 'button sits under the screen').toBeGreaterThanOrEqual(box!.y + box!.height)
    await open.tap()
    await expect(page.locator('html[data-panel-open]')).toHaveCount(1)
    await expect(page.locator('.site-header')).toBeHidden()
    await page.getByRole('button', { name: /Close/ }).tap()
    await expect(page.locator('html[data-panel-open]')).toHaveCount(0)
  }
})

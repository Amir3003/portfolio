// Pings IndexNow (Bing, Yandex, Seznam, Naver) with every URL in the live sitemap.
// Usage: node scripts/indexnow.mjs   (run after a deploy has finished)
const HOST = 'www.a-nagiyev.dev'
const KEY = 'e234a55247a344465155372f2b890393'

const sitemap = await fetch(`https://${HOST}/sitemap.xml`).then((r) => r.text())
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (urlList.length === 0) throw new Error('No URLs found in sitemap.xml')

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
})
console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs`)
if (res.status >= 400) process.exit(1)

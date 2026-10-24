import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

/**
 * Share card for every page that does not define its own: 1200x630, rendered at build time.
 * The art (night over Tokyo, from the site's sky) is a pre-rendered PNG in public/og-home.png.
 */
export const alt = 'Amir Nagiyev, AI and ML developer from Astana'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const png = await readFile(join(process.cwd(), 'public', 'og-home.png'))
  const src = `data:image/png;base64,${png.toString('base64')}`
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} width={size.width} height={size.height} alt="" />
    ),
    size,
  )
}

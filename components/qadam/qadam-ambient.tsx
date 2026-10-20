'use client'

import { useEffect, useRef } from 'react'

/**
 * The QADAM web app's interactive background (AmbientBackground.tsx), scoped to its parent
 * instead of the window: drifting constellation particles over #0B101E with slow emerald,
 * indigo and cyan glows. Particles are pulled toward the pointer and pushed by a ripple on
 * click or tap. Rendering pauses while the canvas is hidden.
 */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseRadius: number
  color: string
  glowColor: string
  phase: number
  phaseSpeed: number
}

interface Shockwave {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
}

const PALETTE = [
  { fill: 'rgba(16, 185, 129, 0.95)', glow: 'rgba(16, 185, 129, 0.35)' },
  { fill: 'rgba(6, 182, 212, 0.95)', glow: 'rgba(6, 182, 212, 0.35)' },
  { fill: 'rgba(99, 102, 241, 0.95)', glow: 'rgba(99, 102, 241, 0.35)' },
  { fill: 'rgba(20, 184, 166, 0.90)', glow: 'rgba(20, 184, 166, 0.30)' },
  { fill: 'rgba(245, 158, 11, 0.85)', glow: 'rgba(245, 158, 11, 0.25)' },
] as const

export function QadamAmbient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !host || !ctx) return

    let width = 0
    let height = 0
    const particles: Particle[] = []

    // The panel mounts hidden at zero size, so particles are seeded on the first real size and
    // rescaled (not re-seeded) on later resizes.
    const seed = () => {
      // Fewer particles on small panels keeps the density of the original page.
      const count = Math.round(Math.min(48, Math.max(20, (width * height) / 26000)))
      for (let i = 0; i < count; i++) {
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]
        const speed = 0.4 + Math.random() * 0.75
        const angle = Math.random() * Math.PI * 2
        const baseRadius = 2.4 + Math.random() * 2.8
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: baseRadius,
          baseRadius,
          color: color.fill,
          glowColor: color.glow,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.02 + Math.random() * 0.02,
        })
      }
    }

    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (w < 2 || h < 2) return
      if (particles.length === 0) {
        width = w
        height = h
        seed()
      } else if (width > 0 && height > 0) {
        for (const p of particles) {
          p.x *= w / width
          p.y *= h / height
        }
      }
      width = w
      height = h
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(host)

    const mouse = { x: -1000, y: -1000, active: false }
    const shockwaves: Shockwave[] = []
    const local = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      // The panel is scaled while it expands; map back to unscaled host pixels.
      const sx = rect.width > 0 ? width / rect.width : 1
      const sy = rect.height > 0 ? height / rect.height : 1
      return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const p = local(e)
      mouse.x = p.x
      mouse.y = p.y
      mouse.active = true
    }
    const onLeave = () => {
      mouse.active = false
    }
    const onDown = (e: PointerEvent) => {
      const p = local(e)
      shockwaves.push({ x: p.x, y: p.y, radius: 4, maxRadius: 180, alpha: 0.8 })
    }
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('pointerdown', onDown)

    const glow = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, 10, x, y, r)
      g.addColorStop(0, color)
      g.addColorStop(1, 'rgba(11, 16, 30, 0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, width, height)
    }

    let waveTime = 0
    let raf = 0
    const render = () => {
      raf = requestAnimationFrame(render)
      // Skip work while the panel is hidden (visibility: hidden on an ancestor).
      if (width === 0) return
      if (typeof canvas.checkVisibility === 'function' && !canvas.checkVisibility({ visibilityProperty: true })) {
        return
      }

      ctx.fillStyle = '#0B101E'
      ctx.fillRect(0, 0, width, height)

      waveTime += 0.005
      glow(width * 0.25 + Math.cos(waveTime) * 140, height * 0.3 + Math.sin(waveTime * 0.8) * 100, width * 0.5, 'rgba(16, 185, 129, 0.14)')
      glow(width * 0.75 + Math.sin(waveTime * 0.9) * 150, height * 0.65 + Math.cos(waveTime * 0.7) * 120, width * 0.55, 'rgba(99, 102, 241, 0.14)')
      glow(width * 0.5 + Math.cos(waveTime * 1.1) * 160, height * 0.15 + Math.sin(waveTime * 1.2) * 80, width * 0.45, 'rgba(6, 182, 212, 0.12)')

      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s]
        sw.radius += 5.5
        sw.alpha *= 0.94
        ctx.strokeStyle = `rgba(16, 185, 129, ${sw.alpha})`
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
        ctx.stroke()
        for (const p of particles) {
          const dx = p.x - sw.x
          const dy = p.y - sw.y
          const dist = Math.hypot(dx, dy)
          if (dist > 0 && Math.abs(dist - sw.radius) < 35) {
            const force = (1 - Math.abs(dist - sw.radius) / 35) * 1.8
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }
        if (sw.radius > sw.maxRadius || sw.alpha < 0.02) shockwaves.splice(s, 1)
      }

      const maxDistance = 180
      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y)
          if (dist < maxDistance) {
            ctx.strokeStyle = `rgba(14, 165, 233, ${(1 - dist / maxDistance) * 0.38})`
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      if (mouse.active) {
        const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 110)
        mg.addColorStop(0, 'rgba(16, 185, 129, 0.22)')
        mg.addColorStop(0.5, 'rgba(6, 182, 212, 0.10)')
        mg.addColorStop(1, 'rgba(11, 16, 30, 0)')
        ctx.fillStyle = mg
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 110, 0, Math.PI * 2)
        ctx.fill()
        for (const p of particles) {
          const mdx = mouse.x - p.x
          const mdy = mouse.y - p.y
          const mDist = Math.hypot(mdx, mdy)
          if (mDist > 0 && mDist < 220) {
            const force = (1 - mDist / 220) * 0.16
            p.vx += (mdx / mDist) * force
            p.vy += (mdy / mDist) * force
            ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - mDist / 220) * 0.55})`
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
          }
        }
      }

      for (const p of particles) {
        const speed = Math.hypot(p.vx, p.vy)
        if (speed > 1.6) {
          p.vx = (p.vx / speed) * 1.6
          p.vy = (p.vy / speed) * 1.6
        } else if (speed < 0.4) {
          p.vx = (p.vx / (speed || 1)) * 0.4
          p.vy = (p.vy / (speed || 1)) * 0.4
        }
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) {
          p.x = Math.min(width, Math.max(0, p.x))
          p.vx *= -1
        }
        if (p.y < 0 || p.y > height) {
          p.y = Math.min(height, Math.max(0, p.y))
          p.vy *= -1
        }
        p.phase += p.phaseSpeed
        p.radius = p.baseRadius + Math.sin(p.phase) * 0.8

        const aura = ctx.createRadialGradient(p.x, p.y, p.radius * 0.4, p.x, p.y, p.radius * 4)
        aura.addColorStop(0, p.glowColor)
        aura.addColorStop(1, 'rgba(11, 16, 30, 0)')
        ctx.fillStyle = aura
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block size-full" />
}

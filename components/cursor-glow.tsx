'use client'

import { useEffect, useRef } from 'react'

export function CursorGlow() {
  const orbRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const orb = orbRef.current
    const dot = dotRef.current
    if (!finePointer || !orb || !dot) return

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let orbX = targetX
    let orbY = targetY
    let frame = 0
    let visible = false

    const render = () => {
      const ease = reducedMotion ? 1 : 0.12
      orbX += (targetX - orbX) * ease
      orbY += (targetY - orbY) * ease
      orb.style.transform = `translate3d(${orbX}px, ${orbY}px, 0) translate(-50%, -50%)`
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`
      if (Math.abs(targetX - orbX) > 0.1 || Math.abs(targetY - orbY) > 0.1) {
        frame = requestAnimationFrame(render)
      } else {
        frame = 0
      }
    }

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX
      targetY = e.clientY
      if (!visible) {
        visible = true
        orb.style.opacity = '1'
        dot.style.opacity = '1'
      }
      if (!frame) frame = requestAnimationFrame(render)
    }

    const onLeave = () => {
      visible = false
      orb.style.opacity = '0'
      dot.style.opacity = '0'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <div
        ref={orbRef}
        className="absolute left-0 top-0 size-[28rem] rounded-full opacity-0 mix-blend-screen blur-3xl transition-opacity duration-500 will-change-transform"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, oklch(0.84 0.2 128 / 0.16), transparent 55%), radial-gradient(circle at 62% 62%, oklch(0.62 0.24 25 / 0.14), transparent 60%)',
        }}
      />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 size-1.5 rounded-[1px] bg-lime-300 opacity-0 shadow-[0_0_12px_2px] shadow-red-500/60 transition-opacity duration-300 will-change-transform"
      />
    </div>
  )
}

/**
 * Shared scroll timeline for the laptop story (progress 0 to 1 over the pinned section).
 * The WebGL scene and the DOM overlays both read these windows so they stay in sync.
 *
 *  0.000 - 0.046  intro, laptop slightly ajar
 *  0.046 - 0.215  outer lid and profile
 *  0.215 - 0.385  bottom chassis and architecture
 *  0.385 - 0.550  flips upright, lid opens on Voyage AI
 *  0.565 - 0.720  Voyage AI panel expands, holds, returns to the display
 *  0.725 - 0.745  display switches to QADAM Hub
 *  0.750 - 0.900  QADAM Hub panel expands, holds, returns to the display
 *  0.910 - 0.970  lid closes, hand-off to Contact
 */

/** Height of the pinned section in vh. The scroll range is this minus one viewport. */
export const STORY_HEIGHT_VH = 700

export interface PanelWindow {
  /** Panel fades in on the display. */
  fadeIn: readonly [number, number]
  /** Panel grows from the display to the full panel. */
  expand: readonly [number, number]
  /** Panel shrinks back onto the display. */
  collapse: readonly [number, number]
  /** Panel fades out on the display. */
  fadeOut: readonly [number, number]
}

export const VOYAGE_WINDOW: PanelWindow = {
  fadeIn: [0.56, 0.575],
  expand: [0.58, 0.62],
  collapse: [0.68, 0.71],
  fadeOut: [0.712, 0.722],
}

export const QADAM_WINDOW: PanelWindow = {
  fadeIn: [0.748, 0.76],
  expand: [0.765, 0.805],
  collapse: [0.865, 0.895],
  fadeOut: [0.897, 0.907],
}

/** The laptop display crossfades from the Voyage AI artwork to QADAM Hub. */
export const SCREEN_SWITCH: readonly [number, number] = [0.722, 0.745]

/** Pose keyframes of the laptop (see laptop-scene.tsx). */
export const POSE_KEYS = {
  introEnd: 0.046,
  lid: 0.138,
  lidHold: 0.215,
  bottom: 0.29,
  bottomHold: 0.385,
  upright: 0.445,
  open: 0.55,
  openHold: 0.91,
  closed: 0.97,
} as const

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))

export const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** 0 = panel sits on the laptop display, 1 = fully expanded. */
export const expandAmount = (w: PanelWindow, p: number): number =>
  smoothstep(w.expand[0], w.expand[1], p) * (1 - smoothstep(w.collapse[0], w.collapse[1], p))

/** Panel layer opacity: on while the panel is anywhere between the display and full size. */
export const panelOpacity = (w: PanelWindow, p: number): number =>
  smoothstep(w.fadeIn[0], w.fadeIn[1], p) * (1 - smoothstep(w.fadeOut[0], w.fadeOut[1], p))

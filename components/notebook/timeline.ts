/**
 * Scroll timeline for the notebook story. `p` is the section's scroll progress, 0 → 1.
 *
 *   0.00  closed notebook, intro copy
 *   0.33  notebook has flipped to its back cover: architecture + About profile
 *   0.66  notebook has turned face-up again and starts to open, scaling toward the viewer
 *   0.76+ Voyage AI dashboard fades in on the open pages
 *   1.00  stage dissolves into the Skills → Projects → Terminal sections
 */

export const MILESTONES = {
  intro: 0,
  about: 0.33,
  project: 0.66,
  outro: 1,
} as const

/** Where the section's dedicated anchors sit along the timeline. */
export const ANCHORS = {
  top: 0,
  about: 0.36,
  voyage: 0.88,
} as const

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export interface SceneState {
  /** Rotation about the vertical axis, radians (0 → π → 2π). */
  rotY: number
  /** Gentle forward tilt while flipping. */
  tiltX: number
  /** Front-cover hinge angle, radians (0 closed → ~π open). */
  hinge: number
  /** 0 closed … 1 fully open; re-centres the spread on the spine. */
  open: number
  /** 0 … 1 move from the side/top layout position to the screen centre. */
  centre: number
  /** Uniform scale multiplier (1 → ~2.35). */
  zoom: number
  /** Upward drift while leaving the stage. */
  lift: number
  /** 0 ... 1: fade-out of the canvas near the end of the timeline. */
  exit: number
}

export function sceneState(p: number): SceneState {
  const flip = smoothstep(0.08, 0.33, p)
  const unflip = smoothstep(0.5, 0.66, p)
  const open = smoothstep(0.62, 0.76, p)
  const zoomT = smoothstep(0.66, 0.88, p)
  const exit = smoothstep(0.92, 1, p)
  return {
    rotY: Math.PI * flip + Math.PI * unflip,
    tiltX: Math.sin(flip * Math.PI) * 0.1 + Math.sin(unflip * Math.PI) * 0.1,
    hinge: open * Math.PI * 0.985,
    open,
    centre: smoothstep(0.58, 0.8, p),
    zoom: lerp(1, 2.35, zoomT),
    lift: exit * 1.4,
    exit,
  }
}


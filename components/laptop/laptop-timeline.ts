/**
 * Laptop choreographic timeline.
 * p is scroll progress from 0.0 to 1.0.
 *
 * 1. Initial State (0.00 - 0.10):
 *    - Model occupies 65% - 70% of vertical viewport height.
 *    - Translated lower down in the vertical viewport: bottom edge sits strictly no more
 *      than 1.5 grid lines above the scroll cue indicator.
 *    - Facing user directly (rotY = 0), slightly open at 15-20 deg (0.31 rad).
 *    - Pristine viewport: only minimalist bottom scroll cue.
 *
 * 2. Stage 1 (0.12 - 0.30):
 *    - Lid smoothly closes to 0 rad and laptop tilts to present outer top lid.
 *    - Profile branding ("17-year-old AI & ML Engineer Amir Nagiyev") is oriented right-side up.
 *    - Single-line title formatting: surnames and titles never wrap awkwardly.
 *
 * 3. Stage 2 & 3 (0.32 - 0.56):
 *    - Rotates further to reveal bottom chassis with cooling intake grilles and mechanical details.
 *    - Clean 3-column architectural layout:
 *        Col 1 (Left third): AI & Machine Learning.
 *        Col 2 (Center third): Systems Engineering & Infrastructure Stack.
 *        Col 3 (Right third): Academic Focus & Languages.
 *
 * 4. Stage 4 (0.60 - 0.86):
 *    - Returns upright (rotX = 0.10, rotY = 0) and lid opens smoothly to ~106 deg (1.85 rad).
 *    - Authentic Voyage AI dashboard renders strictly inside the physical display screen geometry.
 *    - Embedded and interactive with internal scrolling.
 *
 * 5. Stage 5 (0.88 - 1.00):
 *    - Laptop closes down gracefully on its hinge (1.85 -> 0 rad).
 *    - Transitions smoothly into the final Contact section.
 */

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export interface LaptopSceneState {
  rotX: number
  rotY: number
  rotZ: number
  lidAngle: number       // in radians
  posX: number
  posY: number
  posZ: number
  scale: number
  screenGlow: number     // 0 = off, 1 = active
  exitOpacity: number
  stageIndex: number     // 0 = initial, 1 = lid, 2 = bottom/arch, 3 = voyage screen, 4 = closing/outro
}

export function computeLaptopState(p: number, isWide: boolean): LaptopSceneState {
  // Milestone transitions
  const toLid = smoothstep(0.08, 0.22, p)       // 0 -> Stage 1 (top lid)
  const toBottom = smoothstep(0.30, 0.44, p)    // Stage 1 -> Stage 2/3 (bottom chassis)
  const toUpright = smoothstep(0.54, 0.64, p)   // Stage 2/3 -> Stage 4 (upright front)
  const lidOpen = smoothstep(0.62, 0.74, p)     // Opening hinge for Stage 4
  const lidClose = smoothstep(0.86, 0.94, p)    // Outro graceful closing
  const exitFade = smoothstep(0.92, 1.00, p)    // Fade out

  // Orientations
  // Initial: Facing user directly (rotY = 0), natural perspective tilt (rotX = 0.14)
  const initRotX = 0.14
  const initRotY = 0

  // Stage 1: Face top lid toward camera
  const lidRotX = 1.36
  const lidRotY = 0

  // Stage 2/3: Flip to reveal bottom chassis with cooling grilles
  const bottomRotX = -1.36
  const bottomRotY = 0

  // Stage 4: Upright viewing orientation
  const screenRotX = 0.10
  const screenRotY = 0

  // Interpolate X & Y rotations across stages
  let rotX = initRotX
  let rotY = initRotY

  if (p < 0.26) {
    // Initial -> Top Lid
    rotX = lerp(initRotX, lidRotX, toLid)
    rotY = lerp(initRotY, lidRotY, toLid)
  } else if (p < 0.50) {
    // Top Lid -> Bottom Chassis
    rotX = lerp(lidRotX, bottomRotX, toBottom)
    rotY = lerp(lidRotY, bottomRotY, toBottom)
  } else {
    // Bottom Chassis -> Upright
    rotX = lerp(bottomRotX, screenRotX, toUpright)
    rotY = lerp(bottomRotY, screenRotY, toUpright)
  }

  const rotZ = 0

  // Hinge logic:
  // Starts slightly open at ~18 deg (0.31 rad)
  // Closes to 0 rad as user scrolls into Stage 1
  // Stays closed during bottom chassis
  // Opens to ~106 deg (1.85 rad) in Stage 4
  // Closes back to 0 rad in Stage 5
  let lidAngle = lerp(0.31, 0, toLid)

  if (p >= 0.58) {
    lidAngle = lerp(0, 1.85, lidOpen)
    if (p >= 0.86) {
      lidAngle = lerp(1.85, 0, lidClose)
    }
  }

  // Vertical positioning:
  // Initial state: Translated lower down so chassis bottom sits no more than 1.5 grid lines above scroll cue
  const initialPosY = isWide ? -0.46 : -0.38
  const midPosY = isWide ? -0.05 : -0.02
  const screenPosY = isWide ? -0.36 : -0.26

  let posY = initialPosY
  if (p < 0.26) {
    posY = lerp(initialPosY, midPosY, toLid)
  } else if (p < 0.58) {
    posY = midPosY
  } else {
    posY = lerp(midPosY, screenPosY, toUpright)
  }
  posY += exitFade * 1.5

  // Scale: 65% - 70% vertical viewport height
  const baseScale = isWide ? 1.08 : 0.84
  const screenScaleAdjust = lerp(1.0, 1.06, lidOpen)
  const targetScale = baseScale * screenScaleAdjust

  // Screen glow: active in Stage 4 while open
  const screenGlow = smoothstep(0.66, 0.74, p) * (1 - smoothstep(0.86, 0.92, p))

  // Determine stage index
  let stageIndex = 0
  if (p >= 0.88) stageIndex = 4
  else if (p >= 0.60) stageIndex = 3
  else if (p >= 0.32) stageIndex = 2
  else if (p >= 0.12) stageIndex = 1

  return {
    rotX,
    rotY,
    rotZ,
    lidAngle,
    posX: 0,
    posY,
    posZ: 0,
    scale: targetScale,
    screenGlow,
    exitOpacity: 1 - exitFade,
    stageIndex,
  }
}

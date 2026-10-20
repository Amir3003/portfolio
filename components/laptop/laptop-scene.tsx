'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import type { MotionValue } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CanvasTexture,
  CylinderGeometry,
  MathUtils,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
  type Group,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { POSE_KEYS, SCREEN_SWITCH, smoothstep } from '@/components/laptop/story-timeline'
import {
  createBottomChassisTexture,
  createDefaultScreenTexture,
  createKeyboardDeckTexture,
  createQadamScreenTexture,
  makeCanvas,
  textureFonts,
  textureScale,
  toTexture,
} from '@/components/laptop/laptop-textures'

/* -------------------------------------------------------------------------- */
/*  Public contract with story-laptop.tsx                                      */
/* -------------------------------------------------------------------------- */

/** Projected display rectangle in CSS px, relative to the canvas top-left. */
export interface ScreenRect {
  x: number
  y: number
  w: number
  h: number
  /** False until the first frame has been projected. */
  valid: boolean
}

export interface MutableNumber {
  current: number
}

export interface MutableScreenRect {
  current: ScreenRect
}

export interface LaptopSceneProps {
  progress: MotionValue<number>
  active: boolean
  onContextLost: () => void
  /** Distance in CSS px from the viewport bottom to the chassis bottom edge at 0% scroll. */
  bottomInsetRef: MutableNumber
  /** Written every frame with the on-screen rectangle of the laptop display. */
  screenRectRef: MutableScreenRect
}

/* -------------------------------------------------------------------------- */
/*  Physical dimensions (scene units)                                         */
/* -------------------------------------------------------------------------- */

const W = 3.6 // width
const D = 2.4 // depth
const BH = 0.08 // base thickness
const LH = 2.3 // lid height
const LT = 0.045 // lid thickness

const SCREEN_W = W - 0.24
const SCREEN_H = LH - 0.22
const SCREEN_Z = 0.002 // display plane offset from the lid inner face

/* -------------------------------------------------------------------------- */
/*  Camera and framing                                                        */
/* -------------------------------------------------------------------------- */

const FOV = 30
const CAM_Z = 8
const TAN_HALF_FOV = Math.tan(MathUtils.degToRad(FOV / 2))

/** Share of the viewport height the laptop silhouette should fill. */
const TARGET_HEIGHT_SHARE = 0.675
/** The laptop never exceeds this share of the viewport width. */
const MAX_WIDTH_SHARE = 0.9

const INTRO_ALPHA = MathUtils.degToRad(18) // slightly ajar at 0% scroll
const INTRO_TILT = 0.78 // camera looks down onto the deck: gives a 66-68% silhouette on desktop viewports
const OPEN_ALPHA = 1.85 // fully open, about 106 degrees
const OPEN_TILT = OPEN_ALPHA - Math.PI / 2 // makes the display face the camera exactly

/** Vertical extent of the laptop silhouette for a pose (orthographic estimate). */
function poseExtent(alpha: number, tilt: number): number {
  const theta = Math.PI / 2 - alpha
  const lidTopY = LH * Math.cos(theta)
  const lidTopZ = -D / 2 + LH * Math.sin(theta)
  const project = (y: number, z: number) => y * Math.cos(tilt) - z * Math.sin(tilt)
  const ys = [project(-BH, D / 2), project(0, -D / 2), project(lidTopY, lidTopZ)]
  return Math.max(...ys) - Math.min(...ys)
}

const INTRO_EXTENT = poseExtent(INTRO_ALPHA, INTRO_TILT)
const OPEN_EXTENT = poseExtent(OPEN_ALPHA, OPEN_TILT)

function fitScale(extent: number, viewH: number, viewW: number): number {
  return Math.min((TARGET_HEIGHT_SHARE * viewH) / extent, (MAX_WIDTH_SHARE * viewW) / W)
}

/* -------------------------------------------------------------------------- */
/*  Scroll timeline (progress 0 to 1 over the sticky section)                 */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2

interface Pose {
  /** Lid opening angle in radians (0 = closed). */
  alpha: number
  rotX: number
  rotY: number
  /** Local height of the visual centre, used to centre the pose vertically. */
  centerY: number
  /** Vertical offset as a fraction of the viewport height (negative = lower). */
  shift: number
  /** Extra vertical offset on portrait phones, where the overlay copy needs more room. */
  narrowShift: number
  /** Scale multiplier relative to the fitted open-laptop scale. */
  zoom: number
  /** 1 = chassis bottom pinned above the scroll cue, 0 = free centring. */
  anchor: number
  /** Display glow, 0 to 1. */
  glow: number
}

interface Key extends Pose {
  p: number
}

/**
 * Stage timing lives in story-timeline.ts (POSE_KEYS).
 *
 * Orientation notes:
 *  - The laptop only ever tumbles forward around X, so there is no sideways spin.
 *  - rotX = PI / 2 shows the closed outer lid with the hinge at the top. The back cover
 *    artwork is turned 180 degrees in-plane so it reads right-side up in this view and
 *    in the ajar intro pose.
 *  - rotX = PI + tilt shows the bottom chassis.
 */
const REST: Key = {
  p: 0,
  alpha: INTRO_ALPHA,
  rotX: INTRO_TILT,
  rotY: 0,
  centerY: 0,
  shift: 0,
  narrowShift: 0,
  zoom: 1,
  anchor: 1,
  glow: 0,
}

const LID_VIEW: Omit<Key, 'p'> = {
  alpha: 0,
  rotX: Math.PI / 2 - 0.16,
  rotY: 0,
  centerY: 0,
  shift: -0.16,
  narrowShift: -0.06,
  zoom: 1.12,
  anchor: 0,
  glow: 0,
}

const BOTTOM_VIEW: Omit<Key, 'p'> = {
  alpha: 0,
  rotX: Math.PI + 0.95,
  rotY: 0,
  centerY: 0,
  shift: -0.22,
  narrowShift: -0.12,
  zoom: 1,
  anchor: 0,
  glow: 0,
}

const OPEN_VIEW: Omit<Key, 'p'> = {
  alpha: OPEN_ALPHA,
  rotX: TAU + OPEN_TILT,
  rotY: 0,
  centerY: 1.0,
  shift: 0,
  narrowShift: 0,
  zoom: 1.15,
  anchor: 0,
  glow: 1,
}

const KEYS: readonly Key[] = [
  REST,
  { ...REST, p: POSE_KEYS.introEnd },
  { ...LID_VIEW, p: POSE_KEYS.lid },
  { ...LID_VIEW, p: POSE_KEYS.lidHold },
  { ...BOTTOM_VIEW, p: POSE_KEYS.bottom },
  { ...BOTTOM_VIEW, p: POSE_KEYS.bottomHold },
  {
    alpha: 0,
    rotX: TAU + 0.3,
    rotY: 0,
    centerY: 0.05,
    shift: 0,
    narrowShift: 0,
    zoom: 1.1,
    anchor: 0,
    glow: 0,
    p: POSE_KEYS.upright,
  },
  { ...OPEN_VIEW, p: POSE_KEYS.open },
  { ...OPEN_VIEW, p: POSE_KEYS.openHold },
  {
    alpha: 0,
    rotX: TAU + 0.45,
    rotY: 0,
    centerY: 0.1,
    shift: 0.04,
    narrowShift: 0,
    zoom: 1,
    anchor: 0,
    glow: 0,
    p: POSE_KEYS.closed,
  },
  {
    alpha: 0,
    rotX: TAU + 0.45,
    rotY: 0,
    centerY: 0.1,
    shift: 0.04,
    narrowShift: 0,
    zoom: 1,
    anchor: 0,
    glow: 0,
    p: 1,
  },
]

const smooth = (t: number) => t * t * (3 - 2 * t)

function mixPose(a: Key, b: Key, p: number): Pose {
  const span = b.p - a.p
  const t = span <= 0 ? 1 : smooth(MathUtils.clamp((p - a.p) / span, 0, 1))
  return {
    alpha: MathUtils.lerp(a.alpha, b.alpha, t),
    rotX: MathUtils.lerp(a.rotX, b.rotX, t),
    rotY: MathUtils.lerp(a.rotY, b.rotY, t),
    centerY: MathUtils.lerp(a.centerY, b.centerY, t),
    shift: MathUtils.lerp(a.shift, b.shift, t),
    narrowShift: MathUtils.lerp(a.narrowShift, b.narrowShift, t),
    zoom: MathUtils.lerp(a.zoom, b.zoom, t),
    anchor: MathUtils.lerp(a.anchor, b.anchor, t),
    glow: MathUtils.lerp(a.glow, b.glow, t),
  }
}

function samplePose(progress: number): Pose {
  const p = MathUtils.clamp(progress, 0, 1)
  let prev: Key | undefined
  for (const next of KEYS) {
    if (prev && p <= next.p) return mixPose(prev, next, p)
    prev = next
  }
  return prev ?? REST
}

/* -------------------------------------------------------------------------- */
/*  Textures                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Outer lid artwork. The canvas top is the texture top, so the text reads
 * correctly on a plane that faces the viewer with no texture rotation.
 */
function createLidBrandTexture(anisotropy: number): CanvasTexture {
  const w = 2048
  const h = Math.round((w * (LH - 0.16)) / (W - 0.16))
  // 2560 px wide on desktop, about 1830 px on phones.
  const [, ctx, canvas] = makeCanvas(w, h, textureScale() / 1.4)
  const { sans: SANS, mono: MONO } = textureFonts()

  const base = ctx.createLinearGradient(0, 0, w, h)
  base.addColorStop(0, '#0d0f12')
  base.addColorStop(1, '#16191e')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 0.05
  ctx.fillStyle = '#ffffff'
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1)
  ctx.globalAlpha = 1

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const ex = w / 2
  const ey = h * 0.3
  const es = 210
  ctx.lineWidth = 6
  ctx.strokeStyle = '#a3e635'
  ctx.beginPath()
  ctx.roundRect(ex - es / 2, ey - es / 2, es, es, 44)
  ctx.stroke()
  ctx.fillStyle = '#a3e635'
  ctx.font = `700 104px ${MONO}`
  ctx.fillText('AN', ex, ey + 6)

  // Name on a single line: shrink the font until it fits.
  const name = 'Amir Nagiyev'
  let size = 190
  const sans = (px: number) => `600 ${px}px ${SANS}`
  ctx.font = sans(size)
  while (ctx.measureText(name).width > w * 0.78 && size > 80) {
    size -= 4
    ctx.font = sans(size)
  }
  ctx.fillStyle = '#fafafa'
  ctx.fillText(name, w / 2, h * 0.57)

  ctx.fillStyle = '#a3a3a3'
  ctx.font = `500 70px ${SANS}`
  ctx.fillText('17-year-old AI & ML Engineer', w / 2, h * 0.72)

  ctx.fillStyle = '#a3e635'
  ctx.fillRect(w / 2 - 90, h * 0.8, 180, 5)

  ctx.fillStyle = '#737373'
  ctx.font = `500 46px ${MONO}`
  ctx.fillText('Astana, Kazakhstan', w / 2, h * 0.87)

  return toTexture(canvas, anisotropy)
}

/* -------------------------------------------------------------------------- */
/*  GPU assets                                                                */
/* -------------------------------------------------------------------------- */

interface LaptopAssets {
  textures: {
    lid: CanvasTexture
    bottomChassis: CanvasTexture
    keyboard: CanvasTexture
    screen: CanvasTexture
    qadamScreen: CanvasTexture
  }
  materials: {
    aluminum: MeshStandardMaterial
    hinge: MeshStandardMaterial
    rubberFoot: MeshStandardMaterial
    deck: MeshStandardMaterial
    bottomPlate: MeshStandardMaterial
    backCover: MeshStandardMaterial
    screen: MeshStandardMaterial
    qadamScreen: MeshStandardMaterial
  }
  geometries: {
    baseChassis: RoundedBoxGeometry
    deckPlane: PlaneGeometry
    bottomPlane: PlaneGeometry
    lidChassis: RoundedBoxGeometry
    lidBackPlane: PlaneGeometry
    screenPlane: PlaneGeometry
    hingeBar: CylinderGeometry
    rubberFoot: CylinderGeometry
  }
}

/**
 * GPU assets are owned by this component and disposed on unmount. Three re-uploads a
 * disposed resource on next use, so React StrictMode's mount/unmount/mount is safe.
 */
function useLaptopAssets(): LaptopAssets {
  const gl = useThree((s) => s.gl)

  const assets = useMemo<LaptopAssets>(() => {
    const aniso = gl.capabilities.getMaxAnisotropy()
    const textures = {
      lid: createLidBrandTexture(aniso),
      bottomChassis: createBottomChassisTexture(aniso),
      keyboard: createKeyboardDeckTexture(aniso),
      screen: createDefaultScreenTexture(aniso),
      qadamScreen: createQadamScreenTexture(aniso),
    }

    const materials = {
      aluminum: new MeshStandardMaterial({ color: '#121215', roughness: 0.32, metalness: 0.82 }),
      hinge: new MeshStandardMaterial({ color: '#0a0a0c', roughness: 0.25, metalness: 0.9 }),
      rubberFoot: new MeshStandardMaterial({ color: '#08080a', roughness: 0.9, metalness: 0.05 }),
      deck: new MeshStandardMaterial({ map: textures.keyboard, roughness: 0.6, metalness: 0.2 }),
      bottomPlate: new MeshStandardMaterial({
        map: textures.bottomChassis,
        roughness: 0.45,
        metalness: 0.65,
      }),
      backCover: new MeshStandardMaterial({
        map: textures.lid,
        emissiveMap: textures.lid,
        emissive: '#ffffff',
        emissiveIntensity: 0.25,
        roughness: 0.4,
        metalness: 0.6,
      }),
      screen: new MeshStandardMaterial({
        map: textures.screen,
        emissiveMap: textures.screen,
        emissive: '#ffffff',
        emissiveIntensity: 0,
        roughness: 0.3,
        metalness: 0.1,
      }),
      // Second display layer: fades in over the Voyage AI artwork when the story moves on.
      qadamScreen: new MeshStandardMaterial({
        map: textures.qadamScreen,
        emissiveMap: textures.qadamScreen,
        emissive: '#ffffff',
        emissiveIntensity: 0,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    }

    const geometries = {
      baseChassis: new RoundedBoxGeometry(W, BH, D, 4, 0.04),
      deckPlane: new PlaneGeometry(W - 0.12, D - 0.12),
      bottomPlane: new PlaneGeometry(W - 0.12, D - 0.12),
      lidChassis: new RoundedBoxGeometry(W, LH, LT, 4, 0.035),
      lidBackPlane: new PlaneGeometry(W - 0.16, LH - 0.16),
      screenPlane: new PlaneGeometry(SCREEN_W, SCREEN_H),
      hingeBar: new CylinderGeometry(0.038, 0.038, W - 0.6, 24),
      rubberFoot: new CylinderGeometry(0.08, 0.08, 0.015, 16),
    }

    return { textures, materials, geometries }
  }, [gl])

  useEffect(
    () => () => {
      Object.values(assets.textures).forEach((t) => t.dispose())
      Object.values(assets.materials).forEach((m) => m.dispose())
      Object.values(assets.geometries).forEach((g) => g.dispose())
    },
    [assets],
  )

  return assets
}

/* -------------------------------------------------------------------------- */
/*  Laptop                                                                    */
/* -------------------------------------------------------------------------- */

const FOOT_X = W / 2 - 0.25
const FOOT_Z = D / 2 - 0.25
const FOOT_POSITIONS: ReadonlyArray<readonly [number, number, number]> = [
  [-FOOT_X, -BH / 2 - 0.007, -FOOT_Z],
  [FOOT_X, -BH / 2 - 0.007, -FOOT_Z],
  [-FOOT_X, -BH / 2 - 0.007, FOOT_Z],
  [FOOT_X, -BH / 2 - 0.007, FOOT_Z],
]

/** Display corners in hinge-pivot space (the lid's local frame). */
const SCREEN_CORNERS: readonly Vector3[] = [
  new Vector3(-SCREEN_W / 2, LH / 2 - SCREEN_H / 2, SCREEN_Z),
  new Vector3(SCREEN_W / 2, LH / 2 - SCREEN_H / 2, SCREEN_Z),
  new Vector3(-SCREEN_W / 2, LH / 2 + SCREEN_H / 2, SCREEN_Z),
  new Vector3(SCREEN_W / 2, LH / 2 + SCREEN_H / 2, SCREEN_Z),
]

interface LaptopMeshProps {
  progress: MotionValue<number>
  bottomInsetRef: MutableNumber
  screenRectRef: MutableScreenRect
}

function LaptopMesh({ progress, bottomInsetRef, screenRectRef }: LaptopMeshProps) {
  const { materials: m, geometries: g } = useLaptopAssets()
  const root = useRef<Group>(null)
  const spin = useRef<Group>(null)
  const hingePivot = useRef<Group>(null)
  const firstFrame = useRef(true)
  const scratch = useRef(new Vector3())

  useFrame((state, delta) => {
    const r = root.current
    const sp = spin.current
    const hp = hingePivot.current
    if (!r || !sp || !hp) return

    const { width, height } = state.size
    const aspect = width / height
    const viewH = 2 * CAM_Z * TAN_HALF_FOV
    const viewW = viewH * aspect

    const pose = samplePose(progress.get())

    // Fitted scale: ajar scale while anchored, open scale afterwards.
    const openScale = fitScale(OPEN_EXTENT, viewH, viewW) * pose.zoom
    // The front edge of the ajar pose is much closer to the camera than the hinge, so also cap
    // the scale so that the perspective-enlarged front edge stays within the viewport width.
    const introEdgeZ = (D / 2) * Math.cos(INTRO_TILT) - BH * Math.sin(INTRO_TILT)
    const halfLimit = (MAX_WIDTH_SHARE * viewW) / 2
    const introPerspectiveCap = (halfLimit * CAM_Z) / ((W / 2) * CAM_Z + halfLimit * introEdgeZ)
    const introScale = Math.min(fitScale(INTRO_EXTENT, viewH, viewW), introPerspectiveCap)
    const scale = MathUtils.lerp(openScale, introScale, pose.anchor)

    // Free centring for the story stages. Portrait phones (aspect 0.75 and below) blend in the
    // extra offset so the laptop sits under the overlay copy instead of behind it.
    const narrow = MathUtils.clamp((1 - aspect) / 0.25, 0, 1)
    const shift = pose.shift + pose.narrowShift * narrow
    const yFree = shift * viewH - pose.centerY * scale

    // Anchored Y: solve the pinhole projection so the front bottom edge of the chassis
    // lands exactly `bottomInsetRef.current` px above the viewport bottom.
    const sinT = Math.sin(INTRO_TILT)
    const cosT = Math.cos(INTRO_TILT)
    const edgeY = -BH * cosT - (D / 2) * sinT
    const edgeZ = -BH * sinT + (D / 2) * cosT
    const ndcBottom = -1 + (2 * bottomInsetRef.current) / height
    const depth = CAM_Z - scale * edgeZ
    const yAnchored = ndcBottom * depth * TAN_HALF_FOV - scale * edgeY

    const posY = MathUtils.lerp(yFree, yAnchored, pose.anchor)
    const float = Math.sin(state.clock.elapsedTime * 0.75) * 0.012 * (1 - pose.glow)

    // Snap on the very first frame so the intro never visibly slides into place.
    const k = firstFrame.current ? 1000 : 10
    firstFrame.current = false

    r.position.set(0, MathUtils.damp(r.position.y, posY + float, k, delta), 0)
    r.scale.setScalar(MathUtils.damp(r.scale.x, scale, k, delta))
    sp.rotation.x = MathUtils.damp(sp.rotation.x, pose.rotX, k, delta)
    sp.rotation.y = MathUtils.damp(sp.rotation.y, pose.rotY, k, delta)

    // Closed: rotation.x = PI / 2 (lid lies on the deck). Upright: 0.
    hp.rotation.x = MathUtils.damp(hp.rotation.x, Math.PI / 2 - pose.alpha, k, delta)

    m.screen.emissiveIntensity = 0.2 + pose.glow * 0.25
    const qadamMix = smoothstep(SCREEN_SWITCH[0], SCREEN_SWITCH[1], progress.get())
    m.qadamScreen.opacity = qadamMix
    m.qadamScreen.emissiveIntensity = (0.2 + pose.glow * 0.25) * 0.7
    m.qadamScreen.visible = qadamMix > 0.001

    // Publish the projected display rectangle for the DOM hybrid transition.
    r.updateMatrixWorld(true)
    state.camera.updateMatrixWorld()
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    const v = scratch.current
    for (const corner of SCREEN_CORNERS) {
      v.copy(corner).applyMatrix4(hp.matrixWorld).project(state.camera)
      const px = ((v.x + 1) / 2) * width
      const py = ((1 - v.y) / 2) * height
      minX = Math.min(minX, px)
      maxX = Math.max(maxX, px)
      minY = Math.min(minY, py)
      maxY = Math.max(maxY, py)
    }
    const rect = screenRectRef.current
    rect.x = minX
    rect.y = minY
    rect.w = maxX - minX
    rect.h = maxY - minY
    rect.valid = true
  })

  return (
    <group ref={root}>
      <group ref={spin}>
        {/* ================= BASE / KEYBOARD CHASSIS ================= */}
        <group position={[0, -BH / 2, 0]}>
          <mesh geometry={g.baseChassis} material={m.aluminum} />

          {/* Keyboard deck and trackpad (top face) */}
          <mesh
            geometry={g.deckPlane}
            material={m.deck}
            position={[0, BH / 2 + 0.001, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />

          {/* Bottom chassis with grilles and regulatory details (bottom face) */}
          <mesh
            geometry={g.bottomPlane}
            material={m.bottomPlate}
            position={[0, -BH / 2 - 0.001, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          />

          {/* Rear hinge bar */}
          <mesh
            geometry={g.hingeBar}
            material={m.hinge}
            position={[0, BH / 2, -D / 2]}
            rotation={[0, 0, Math.PI / 2]}
          />

          {FOOT_POSITIONS.map((pos) => (
            <mesh
              key={`${pos[0]}:${pos[2]}`}
              geometry={g.rubberFoot}
              material={m.rubberFoot}
              position={[pos[0], pos[1], pos[2]]}
            />
          ))}
        </group>

        {/* ================= HINGED SCREEN LID ================= */}
        <group ref={hingePivot} position={[0, 0, -D / 2]}>
          <mesh geometry={g.lidChassis} material={m.aluminum} position={[0, LH / 2, -LT / 2]} />

          {/* Outer back cover (faces -Z in lid space). Turned PI around Y to face outwards,
              then PI in-plane so the artwork reads right-side up whenever the closed lid
              faces the camera (intro and outer lid stages). */}
          <mesh
            geometry={g.lidBackPlane}
            material={m.backCover}
            position={[0, LH / 2, -LT - 0.002]}
            rotation={[0, Math.PI, Math.PI]}
          />

          {/* Inner display (faces +Z). The interactive dashboard is a native DOM layer
              that starts exactly on this rectangle and expands to full width. */}
          <mesh geometry={g.screenPlane} material={m.screen} position={[0, LH / 2, SCREEN_Z]} />
          <mesh
            geometry={g.screenPlane}
            material={m.qadamScreen}
            position={[0, LH / 2, SCREEN_Z + 0.002]}
          />
        </group>
      </group>
    </group>
  )
}

/** Reports WebGL context loss so the parent can switch to the static fallback. */
function ContextGuard({ onLost }: { onLost: () => void }) {
  const canvas = useThree((s) => s.gl.domElement)
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      onLost()
    }
    canvas.addEventListener('webglcontextlost', handler)
    return () => canvas.removeEventListener('webglcontextlost', handler)
  }, [canvas, onLost])
  return null
}

/** Device pixel ratio range; a slow GPU drops to the lower range, never below 1. */
const DPR_HIGH: [number, number] = [1, 2]
const DPR_LOW: [number, number] = [1, 1.5]

/**
 * The procedural textures draw text with the site fonts, so wait for them (with a short
 * timeout) instead of baking the system fallback into the artwork.
 */
function useFontsReady(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setReady(true)
    }
    const timer = window.setTimeout(finish, 1500)
    document.fonts.ready.then(finish, finish)
    return () => {
      done = true
      window.clearTimeout(timer)
    }
  }, [])
  return ready
}

export default function LaptopScene({
  progress,
  active,
  onContextLost,
  bottomInsetRef,
  screenRectRef,
}: LaptopSceneProps) {
  const [dpr, setDpr] = useState<[number, number]>(DPR_HIGH)
  const fontsReady = useFontsReady()

  return (
    <Canvas
      flat
      frameloop={active ? 'always' : 'never'}
      dpr={dpr}
      camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 0, CAM_Z] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      className="pointer-events-none"
    >
      <PerformanceMonitor onDecline={() => setDpr(DPR_LOW)} onIncline={() => setDpr(DPR_HIGH)} />
      <ContextGuard onLost={onContextLost} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 5]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[-4, 3, -4]} intensity={0.9} color="#cbd5e1" />
      <pointLight position={[-3, 1, 2.5]} intensity={16} distance={12} decay={2} color="#2dd4bf" />
      <pointLight position={[3.5, -1, 3]} intensity={14} distance={12} decay={2} color="#ffffff" />
      {fontsReady && (
        <LaptopMesh
          progress={progress}
          bottomInsetRef={bottomInsetRef}
          screenRectRef={screenRectRef}
        />
      )}
    </Canvas>
  )
}

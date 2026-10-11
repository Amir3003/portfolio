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
  SRGBColorSpace,
  type Group,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import {
  createBottomChassisTexture,
  createDefaultScreenTexture,
  createKeyboardDeckTexture,
} from '@/components/laptop/laptop-textures'

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

/* -------------------------------------------------------------------------- */
/*  Camera and framing                                                        */
/* -------------------------------------------------------------------------- */

const FOV = 30
const CAM_Z = 8
const TAN_HALF_FOV = Math.tan(MathUtils.degToRad(FOV / 2))

/** Share of the viewport height the laptop silhouette should fill. */
const TARGET_HEIGHT_SHARE = 0.675
/** Never let the laptop exceed this share of the viewport width. */
const MAX_WIDTH_SHARE = 0.9

const INTRO_ALPHA = MathUtils.degToRad(18) // slightly ajar at 0% scroll
const INTRO_TILT = 0.5 // camera looks down onto the deck
const OPEN_ALPHA = 1.85 // fully open, about 106 degrees
const OPEN_TILT = OPEN_ALPHA - Math.PI / 2 // makes the screen face the camera exactly

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
/*  Scroll timeline                                                           */
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
  /** Scale multiplier relative to the fitted open-laptop scale. */
  zoom: number
  /** 1 = bottom edge pinned above the scroll cue, 0 = free centring. */
  anchor: number
  /** Screen emissive glow, 0 to 1. */
  glow: number
}

interface Key extends Pose {
  p: number
}

/**
 * Keyframes. Rotation notes:
 * - rotY = PI shows the outer lid with the lid upright. The back cover plane is
 *   rotated by PI around Y (not X), so its text stays right-side up when the
 *   whole laptop turns around.
 * - rotX = PI + tilt shows the bottom chassis, rotY returns to TAU (identity), so
 *   the bottom texture also stays right-side up.
 */
const REST: Key = {
  p: 0,
  alpha: INTRO_ALPHA,
  rotX: INTRO_TILT,
  rotY: 0,
  centerY: 0,
  shift: 0,
  zoom: 1,
  anchor: 1,
  glow: 0,
}

const KEYS: readonly Key[] = [
  REST,
  // Hold the intro pose while the scroll cue fades.
  { ...REST, p: 0.08 },
  // Stage 1: lid opens upright, laptop turns to show the outer lid.
  {
    p: 0.2,
    alpha: Math.PI / 2,
    rotX: 0.1,
    rotY: Math.PI,
    centerY: 1.15,
    shift: -0.12,
    zoom: 1,
    anchor: 0,
    glow: 0,
  },
  {
    p: 0.31,
    alpha: Math.PI / 2,
    rotX: 0.1,
    rotY: Math.PI,
    centerY: 1.15,
    shift: -0.12,
    zoom: 1,
    anchor: 0,
    glow: 0,
  },
  // Stage 2 and 3: lid closes, laptop flips to show the bottom chassis.
  {
    p: 0.42,
    alpha: 0,
    rotX: Math.PI + 0.95,
    rotY: TAU,
    centerY: 0,
    shift: -0.22,
    zoom: 1,
    anchor: 0,
    glow: 0,
  },
  {
    p: 0.58,
    alpha: 0,
    rotX: Math.PI + 0.95,
    rotY: TAU,
    centerY: 0,
    shift: -0.22,
    zoom: 1,
    anchor: 0,
    glow: 0,
  },
  // Flip back to upright while still closed.
  {
    p: 0.68,
    alpha: 0,
    rotX: TAU + 0.3,
    rotY: TAU,
    centerY: 0.05,
    shift: 0,
    zoom: 1.1,
    anchor: 0,
    glow: 0,
  },
  // Stage 4: lid opens, screen faces the camera, dashboard becomes interactive.
  {
    p: 0.8,
    alpha: OPEN_ALPHA,
    rotX: TAU + OPEN_TILT,
    rotY: TAU,
    centerY: 1.0,
    shift: 0,
    zoom: 1.15,
    anchor: 0,
    glow: 1,
  },
  { p: 0.9, alpha: OPEN_ALPHA, rotX: TAU + OPEN_TILT, rotY: TAU, centerY: 1.0, shift: 0, zoom: 1.15, anchor: 0, glow: 1 },
  // Stage 5: laptop closes down.
  {
    p: 1,
    alpha: 0,
    rotX: TAU + 0.45,
    rotY: TAU,
    centerY: 0.1,
    shift: 0.04,
    zoom: 1,
    anchor: 0,
    glow: 0,
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
 * Outer lid artwork. Drawn on a canvas with the top of the canvas as the top of
 * the texture, so the text reads correctly on a plane that faces the viewer
 * without any rotation applied to the texture itself.
 */
function createLidBrandTexture(anisotropy: number): CanvasTexture {
  const w = 2048
  const h = Math.round((w * (LH - 0.16)) / (W - 0.16))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = anisotropy

  const ctx = canvas.getContext('2d')
  if (!ctx) return texture

  // Brushed dark aluminium base.
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

  // AN emblem.
  const ex = w / 2
  const ey = h * 0.3
  const es = 210
  ctx.lineWidth = 6
  ctx.strokeStyle = '#a3e635'
  ctx.beginPath()
  ctx.roundRect(ex - es / 2, ey - es / 2, es, es, 44)
  ctx.stroke()
  ctx.fillStyle = '#a3e635'
  ctx.font = '700 104px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillText('AN', ex, ey + 6)

  // Name, always on one line: shrink the font until it fits.
  const name = 'Amir Nagiyev'
  let size = 190
  ctx.font = `600 ${size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
  while (ctx.measureText(name).width > w * 0.78 && size > 80) {
    size -= 4
    ctx.font = `600 ${size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
  }
  ctx.fillStyle = '#fafafa'
  ctx.fillText(name, w / 2, h * 0.57)

  ctx.fillStyle = '#a3a3a3'
  ctx.font = '500 70px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillText('17-year-old AI & ML Engineer', w / 2, h * 0.72)

  ctx.fillStyle = '#a3e635'
  ctx.fillRect(w / 2 - 90, h * 0.8, 180, 5)

  ctx.fillStyle = '#737373'
  ctx.font = '500 46px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillText('Astana, Kazakhstan', w / 2, h * 0.87)

  texture.needsUpdate = true
  return texture
}

/* -------------------------------------------------------------------------- */
/*  GPU assets                                                                */
/* -------------------------------------------------------------------------- */

/** GPU assets created once and disposed on unmount. */
function useLaptopAssets() {
  const gl = useThree((s) => s.gl)

  const assets = useMemo(() => {
    const aniso = gl.capabilities.getMaxAnisotropy()
    const textures = {
      lid: createLidBrandTexture(aniso),
      bottomChassis: createBottomChassisTexture(aniso),
      keyboard: createKeyboardDeckTexture(aniso),
      screen: createDefaultScreenTexture(aniso),
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
      // OLED display panel showing Voyage AI graphics with emissive response to pose.glow.
      screen: new MeshStandardMaterial({
        map: textures.screen,
        emissiveMap: textures.screen,
        emissive: '#ffffff',
        emissiveIntensity: 0,
        roughness: 0.2,
        metalness: 0.2,
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

interface InsetRef {
  current: number
}

interface LaptopMeshProps {
  progress: MotionValue<number>
  /** Distance in CSS px from the viewport bottom to where the chassis bottom edge must sit at 0%. */
  bottomInsetRef: InsetRef
}

const FOOT_X = W / 2 - 0.25
const FOOT_Z = D / 2 - 0.25
const FOOT_POSITIONS: ReadonlyArray<readonly [number, number, number]> = [
  [-FOOT_X, -BH / 2 - 0.007, -FOOT_Z],
  [FOOT_X, -BH / 2 - 0.007, -FOOT_Z],
  [-FOOT_X, -BH / 2 - 0.007, FOOT_Z],
  [FOOT_X, -BH / 2 - 0.007, FOOT_Z],
]

function LaptopMesh({ progress, bottomInsetRef }: LaptopMeshProps) {
  const { materials: m, geometries: g } = useLaptopAssets()
  const root = useRef<Group>(null)
  const spin = useRef<Group>(null)
  const hingePivot = useRef<Group>(null)
  const firstFrame = useRef(true)

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

    // Scale: fitted open scale in later stages, fitted ajar scale while anchored.
    const openScale = fitScale(OPEN_EXTENT, viewH, viewW) * pose.zoom
    const introScale = fitScale(INTRO_EXTENT, viewH, viewW)
    const scale = MathUtils.lerp(openScale, introScale, pose.anchor)

    // Free centring for the story stages.
    const yFree = pose.shift * viewH - pose.centerY * scale

    // Anchored Y: solve the pinhole projection so the front bottom edge of the
    // chassis lands exactly `bottomInsetRef.current` px above the viewport bottom.
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

    r.position.x = 0
    r.position.y = MathUtils.damp(r.position.y, posY + float, k, delta)
    r.position.z = 0
    r.scale.setScalar(MathUtils.damp(r.scale.x, scale, k, delta))

    sp.rotation.x = MathUtils.damp(sp.rotation.x, pose.rotX, k, delta)
    sp.rotation.y = MathUtils.damp(sp.rotation.y, pose.rotY, k, delta)

    // Closed: rotation.x = PI / 2 (lid lies on the deck). Upright: 0.
    hp.rotation.x = MathUtils.damp(hp.rotation.x, Math.PI / 2 - pose.alpha, k, delta)

    m.screen.emissiveIntensity = pose.glow * 0.45
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

          {/* Outer back cover (faces -Z in lid space).
              Rotated PI around Y, not X: a rotation around X flips the texture
              upside down whenever the lid is upright, which was the inversion bug. */}
          <mesh
            geometry={g.lidBackPlane}
            material={m.backCover}
            position={[0, LH / 2, -LT - 0.002]}
            rotation={[0, Math.PI, 0]}
          />

          {/* Inner display panel (faces +Z) */}
          <mesh geometry={g.screenPlane} material={m.screen} position={[0, LH / 2, 0.002]} />
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

export interface LaptopSceneProps {
  progress: MotionValue<number>
  active: boolean
  onContextLost: () => void
  bottomInsetRef: InsetRef
}

export default function LaptopScene({
  progress,
  active,
  onContextLost,
  bottomInsetRef,
}: LaptopSceneProps) {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75])

  return (
    <Canvas
      flat
      frameloop={active ? 'always' : 'never'}
      dpr={dpr}
      camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 0, CAM_Z] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      className="pointer-events-none"
    >
      <PerformanceMonitor onDecline={() => setDpr([0.75, 1])} onIncline={() => setDpr([1, 1.75])} />
      <ContextGuard onLost={onContextLost} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 5]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[-4, 3, -4]} intensity={0.9} color="#cbd5e1" />
      <pointLight position={[-3, 1, 2.5]} intensity={16} distance={12} decay={2} color="#2dd4bf" />
      <pointLight position={[3.5, -1, 3]} intensity={14} distance={12} decay={2} color="#ffffff" />
      <LaptopMesh progress={progress} bottomInsetRef={bottomInsetRef} />
    </Canvas>
  )
}

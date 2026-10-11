'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import type { MotionValue } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MathUtils, MeshStandardMaterial, PlaneGeometry, type Group, type PerspectiveCamera } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { lerp, sceneState } from '@/components/notebook/timeline'
import {
  createArchitectureTexture,
  createCoverTexture,
  createPageTexture,
} from '@/components/notebook/textures'

// Notebook dimensions (scene units).
const W = 2.2
const H = 3.0
const D = 0.46
const COVER_T = 0.07

/** Everything that owns GPU resources, created once and disposed on unmount. */
function useNotebookAssets() {
  const gl = useThree((s) => s.gl)
  const assets = useMemo(() => {
    const aniso = gl.capabilities.getMaxAnisotropy()
    const textures = {
      cover: createCoverTexture(aniso),
      arch: createArchitectureTexture(aniso),
      left: createPageTexture(aniso, 'left'),
      right: createPageTexture(aniso, 'right'),
    }
    const printed = (map: (typeof textures)[keyof typeof textures]) =>
      new MeshStandardMaterial({ map, emissiveMap: map, emissive: '#ffffff', emissiveIntensity: 0.4, roughness: 0.85 })
    const materials = {
      leather: new MeshStandardMaterial({ color: '#141414', roughness: 0.55, metalness: 0.15 }),
      spine: new MeshStandardMaterial({ color: '#0b0b0b', roughness: 0.5, metalness: 0.2 }),
      pageEdge: new MeshStandardMaterial({ color: '#d9d2bd', roughness: 0.9 }),
      band: new MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.6 }),
      cover: printed(textures.cover),
      arch: printed(textures.arch),
      left: printed(textures.left),
      right: printed(textures.right),
    }
    const geometries = {
      cover: new RoundedBoxGeometry(W, H, COVER_T, 3, 0.04),
      art: new PlaneGeometry(W - 0.2, H - 0.2),
      page: new PlaneGeometry(W - 0.12, H - 0.1),
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

function Notebook({ progress }: { progress: MotionValue<number> }) {
  const { materials: m, geometries: g } = useNotebookAssets()
  const root = useRef<Group>(null)
  const spin = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const hinge = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!root.current || !spin.current || !inner.current || !hinge.current) return
    const s = sceneState(progress.get())
    const aspect = state.size.width / state.size.height
    const wide = aspect > 1.15

    // Keep the closed notebook fully in frame on any viewport.
    const camera = state.camera as PerspectiveCamera
    const tan = Math.tan(MathUtils.degToRad(camera.fov / 2))
    const needH = wide ? 3.7 : 3.4
    const needW = wide ? 2.9 : 3.0
    camera.position.z = Math.max(needH / (2 * tan), needW / (2 * tan * aspect))

    const baseScale = wide ? 1 : 0.9
    const sideX = wide ? 1.7 : 0
    const topY = wide ? 0 : 1.05
    const float = Math.sin(state.clock.elapsedTime * 0.9) * 0.045 * (1 - s.centre)

    const k = 9 // critically-damped follow: smooths any remaining scroll jitter
    const r = root.current
    r.position.x = MathUtils.damp(r.position.x, lerp(sideX, 0, s.centre), k, delta)
    r.position.y = MathUtils.damp(r.position.y, lerp(topY, 0, s.centre) + s.lift + float, k, delta)
    r.scale.setScalar(MathUtils.damp(r.scale.x, baseScale * s.zoom, k, delta))

    spin.current.rotation.y = MathUtils.damp(spin.current.rotation.y, s.rotY, k, delta)
    spin.current.rotation.x = MathUtils.damp(spin.current.rotation.x, s.tiltX, k, delta)
    spin.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.012 * (1 - s.centre)

    inner.current.position.x = MathUtils.damp(inner.current.position.x, (-W / 2) * (1 - s.open), k, delta)
    hinge.current.rotation.y = MathUtils.damp(hinge.current.rotation.y, -s.hinge, k, delta)
  })

  const pagesDepth = D - 2 * COVER_T - 0.02

  return (
    <group ref={root}>
      <group ref={spin}>
        {/* Initial position offsets the notebook so its centre sits on the origin when closed. */}
        <group ref={inner} position={[-W / 2, 0, 0]}>
          {/* spine */}
          <mesh position={[0.02, 0, 0]} material={m.spine}>
            <boxGeometry args={[0.12, H, D]} />
          </mesh>

          {/* back cover + architecture print on its outer face */}
          <mesh geometry={g.cover} material={m.leather} position={[W / 2, 0, -D / 2 + COVER_T / 2]} />
          <mesh
            geometry={g.art}
            material={m.arch}
            position={[W / 2, 0, -D / 2 - 0.003]}
            rotation={[0, Math.PI, 0]}
          />

          {/* page block + right-hand page */}
          <mesh position={[W / 2 - 0.02, 0, 0]} material={m.pageEdge}>
            <boxGeometry args={[W - 0.12, H - 0.1, pagesDepth]} />
          </mesh>
          <mesh geometry={g.page} material={m.right} position={[W / 2 - 0.02, 0, pagesDepth / 2 + 0.003]} />

          {/* hinged front cover */}
          <group ref={hinge} position={[0, 0, D / 2 - COVER_T / 2]}>
            <mesh geometry={g.cover} material={m.leather} position={[W / 2, 0, 0]} />
            <mesh geometry={g.art} material={m.cover} position={[W / 2, 0, COVER_T / 2 + 0.003]} />
            <mesh
              geometry={g.page}
              material={m.left}
              position={[W / 2, 0, -COVER_T / 2 - 0.003]}
              rotation={[0, Math.PI, 0]}
            />
            <mesh position={[W - 0.35, 0, 0]} material={m.band}>
              <boxGeometry args={[0.06, H + 0.01, COVER_T + 0.035]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

/** Surfaces a lost WebGL context to the parent so it can swap in the static fallback. */
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

export interface NotebookSceneProps {
  progress: MotionValue<number>
  /** Render loop only runs while the section is on screen. */
  active: boolean
  onContextLost: () => void
}

/**
 * The WebGL canvas. R3F tears the renderer down (and force-loses the context) when this unmounts;
 * textures, materials and geometries created above are disposed explicitly.
 */
export default function NotebookScene({ progress, active, onContextLost }: NotebookSceneProps) {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75])

  return (
    <Canvas
      flat
      frameloop={active ? 'always' : 'never'}
      dpr={dpr}
      camera={{ fov: 32, near: 0.1, far: 60, position: [0, 0, 9] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      className="!pointer-events-none"
    >
      {/* Drop resolution if the frame rate sags; restore it when headroom returns. */}
      <PerformanceMonitor onDecline={() => setDpr([0.75, 1])} onIncline={() => setDpr([1, 1.75])} />
      <ContextGuard onLost={onContextLost} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 4, 5]} intensity={1.7} color="#fff5e6" />
      <pointLight position={[-3.5, -1, 3]} intensity={22} distance={14} decay={2} color="#a3e635" />
      <pointLight position={[4, 2, -3]} intensity={16} distance={14} decay={2} color="#f87171" />
      <Notebook progress={progress} />
    </Canvas>
  )
}


import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import { Pencil, Notebook, GradCap, Laptop, PaperBall } from './Models3D'

function MovingPencil({ scroll, isScrolling }) {
  const ref = useRef()

  // Calculate target positions based on scroll percent (0 to 1)
  const getTargets = (s) => {
    let x = 0
    let y = 1
    let z = 0
    let rx = Math.PI / 4
    let ry = 0
    let rz = Math.PI / 6

    if (s < 0.15) {
      const t = s / 0.15
      x = 3.5 - 7 * t
      y = 1.5 - 0.5 * t
      rz = Math.PI / 4 - (Math.PI / 2) * t
    } else if (s < 0.3) {
      const t = (s - 0.15) / 0.15
      x = -3.5 + 7 * t
      y = 1 - 0.5 * t
      rz = -Math.PI / 4 + (Math.PI / 2) * t
    } else if (s < 0.45) {
      const t = (s - 0.3) / 0.15
      x = 3.5 - 7 * t
      y = 0.5 - 0.5 * t
      rz = Math.PI / 4 - (Math.PI / 2) * t
    } else if (s < 0.6) {
      const t = (s - 0.45) / 0.15
      x = -3.5 + 7 * t
      y = 0 - 0.5 * t
      rz = -Math.PI / 4 + (Math.PI / 2) * t
    } else if (s < 0.75) {
      const t = (s - 0.6) / 0.15
      x = 3.5 - 7 * t
      y = -0.5 - 0.5 * t
      rz = Math.PI / 4 - (Math.PI / 2) * t
    } else if (s < 0.9) {
      const t = (s - 0.75) / 0.15
      x = -3.5 + 7 * t
      y = -1 - 0.5 * t
      rz = -Math.PI / 4 + (Math.PI / 2) * t
    } else {
      const t = Math.min(1, (s - 0.9) / 0.1)
      x = 3.5 - 3.5 * t
      y = -1.5 - 4.5 * t
      rx = (Math.PI / 4) * (1 - t)
      ry = 0
      rz = -Math.PI / 4 * (1 - t) - (Math.PI / 2) * t
    }

    // Apply resting rotation adjustments if user stops scrolling
    if (!isScrolling && s < 0.9) {
      // Rotate pencil to a resting angle (e.g. leaning flat horizontally against the background)
      rz = x > 0 ? Math.PI / 2 : -Math.PI / 2
      rx = 0.1
    }

    return { pos: [x, y, z], rot: [rx, ry, rz] }
  }

  useFrame(() => {
    if (!ref.current) return
    const targets = getTargets(scroll)
    
    // Smooth lerp coordinates
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targets.pos[0], 0.08)
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targets.pos[1], 0.08)
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, targets.pos[2], 0.08)
    
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targets.rot[0], 0.08)
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targets.rot[1], 0.08)
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targets.rot[2], 0.08)
  })

  return (
    <group ref={ref}>
      <Pencil scale={1.2} />
    </group>
  )
}

function HeroProps({ scroll }) {
  const notebookRef = useRef()
  const capRef = useRef()
  const laptopRef = useRef()
  const ball1Ref = useRef()
  const ball2Ref = useRef()
  const ball3Ref = useRef()

  useFrame(() => {
    // If scroll > 0.12 (past first page), fade out/scale to 0. Otherwise scale is normal.
    const targetScale = scroll > 0.12 ? 0 : 1
    const lerpSpeed = 0.1

    if (notebookRef.current) {
      const current = notebookRef.current.scale.x
      const next = THREE.MathUtils.lerp(current, targetScale, lerpSpeed)
      notebookRef.current.scale.set(next * 0.5, next * 0.5, next * 0.5)
    }
    if (capRef.current) {
      const current = capRef.current.scale.x
      const next = THREE.MathUtils.lerp(current, targetScale, lerpSpeed)
      capRef.current.scale.set(next * 0.6, next * 0.6, next * 0.6)
    }
    if (laptopRef.current) {
      const current = laptopRef.current.scale.x
      const next = THREE.MathUtils.lerp(current, targetScale, lerpSpeed)
      laptopRef.current.scale.set(next * 0.7, next * 0.7, next * 0.7)
    }
    if (ball1Ref.current) {
      const current = ball1Ref.current.scale.x
      const next = THREE.MathUtils.lerp(current, targetScale, lerpSpeed)
      ball1Ref.current.scale.set(next * 0.6, next * 0.6, next * 0.6)
    }
    if (ball2Ref.current) {
      const current = ball2Ref.current.scale.x
      const next = THREE.MathUtils.lerp(current, targetScale, lerpSpeed)
      ball2Ref.current.scale.set(next * 0.8, next * 0.8, next * 0.8)
    }
    if (ball3Ref.current) {
      const current = ball3Ref.current.scale.x
      const next = THREE.MathUtils.lerp(current, targetScale, lerpSpeed)
      ball3Ref.current.scale.set(next * 0.5, next * 0.5, next * 0.5)
    }
  })

  return (
    <group>
      <group ref={notebookRef} position={[-7, 4, -4]}><Notebook /></group>
      <group ref={capRef} position={[7, 4, -5]}><GradCap /></group>
      <group ref={laptopRef} position={[7, -4, -6]}><Laptop /></group>
      <group ref={ball1Ref} position={[5, 1, -8]}><PaperBall /></group>
      <group ref={ball2Ref} position={[-6, -1, -9]}><PaperBall /></group>
      <group ref={ball3Ref} position={[4, -6, -7]}><PaperBall /></group>
    </group>
  )
}

export default function Scene3D({ scroll = 0, isScrolling = false, isMainPage = true }) {
  if (!isMainPage) return null

  return (
    <div className="fixed inset-0 z-[-100] pointer-events-none w-full h-full">
      <Canvas shadows camera={{ position: [0, 0, 15], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[10, 15, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <Environment preset="city" />
        
        {/* Props pinned to the first page (Hero) only */}
        <HeroProps scroll={scroll} />

        {/* The active 3D pencil guided by page scroll and resting when idle */}
        <MovingPencil scroll={scroll} isScrolling={isScrolling} />

        <ContactShadows position={[0, -8, 0]} opacity={0.25} scale={30} blur={3} far={15} />
      </Canvas>
    </div>
  )
}

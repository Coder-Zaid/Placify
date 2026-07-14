import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import { Pencil, Notebook, GradCap, Laptop, PaperBall } from './Models3D'

function MovingPencil({ scroll }) {
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
      // Hero area
      const t = s / 0.15
      x = 3.5 - 7 * t // moves from right to left
      y = 1.5 - 0.5 * t
      rz = Math.PI / 4 - (Math.PI / 2) * t
    } else if (s < 0.3) {
      // School
      const t = (s - 0.15) / 0.15
      x = -3.5 + 7 * t // moves left to right
      y = 1 - 0.5 * t
      rz = -Math.PI / 4 + (Math.PI / 2) * t
    } else if (s < 0.45) {
      // College
      const t = (s - 0.3) / 0.15
      x = 3.5 - 7 * t // moves right to left
      y = 0.5 - 0.5 * t
      rz = Math.PI / 4 - (Math.PI / 2) * t
    } else if (s < 0.6) {
      // Learning
      const t = (s - 0.45) / 0.15
      x = -3.5 + 7 * t // moves left to right
      y = 0 - 0.5 * t
      rz = -Math.PI / 4 + (Math.PI / 2) * t
    } else if (s < 0.75) {
      // Resume
      const t = (s - 0.6) / 0.15
      x = 3.5 - 7 * t // moves right to left
      y = -0.5 - 0.5 * t
      rz = Math.PI / 4 - (Math.PI / 2) * t
    } else if (s < 0.9) {
      // Interview & Placement
      const t = (s - 0.75) / 0.15
      x = -3.5 + 7 * t // moves left to right
      y = -1 - 0.5 * t
      rz = -Math.PI / 4 + (Math.PI / 2) * t
    } else {
      // Resting at Footer
      const t = Math.min(1, (s - 0.9) / 0.1)
      x = 3.5 - 3.5 * t // Centers horizontally
      y = -1.5 - 4.5 * t // Drops down below footer text
      rx = (Math.PI / 4) * (1 - t)
      ry = 0
      rz = -Math.PI / 4 * (1 - t) - (Math.PI / 2) * t // Lays flat horizontally
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

export default function Scene3D({ scroll = 0, isMainPage = true }) {
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
        
        {/* Floating background props fixed in the viewport scene to hover gently */}
        <Notebook position={[-7, 4, -4]} scale={0.5} />
        <GradCap position={[7, 4, -5]} scale={0.6} />
        <Laptop position={[7, -4, -6]} scale={0.7} />
        
        {/* Scattered paper balls */}
        <PaperBall position={[5, 1, -8]} scale={0.6} />
        <PaperBall position={[-6, -1, -9]} scale={0.8} />
        <PaperBall position={[4, -6, -7]} scale={0.5} />

        {/* The active 3D pencil guided by page scroll */}
        <MovingPencil scroll={scroll} />

        <ContactShadows position={[0, -8, 0]} opacity={0.25} scale={30} blur={3} far={15} />
      </Canvas>
    </div>
  )
}

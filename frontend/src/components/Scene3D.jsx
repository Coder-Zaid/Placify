import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import { Pencil, Notebook, GradCap, Laptop, PaperBall } from './Models3D'

function MovingPencil({ isScrolling, scrollDirection, pathRef, mainRef }) {
  const ref = useRef()
  const { viewport } = useThree()

  useFrame(() => {
    if (!ref.current) return
    const path = pathRef?.current
    const main = mainRef?.current
    if (!path || !main) return

    // 1. Calculate precise scroll progress directly from the DOM scroll
    const scrollY = window.scrollY
    const maxScroll = main.clientHeight - window.innerHeight
    const s = maxScroll > 0 ? scrollY / maxScroll : 0

    // 2. Extract SVG path tip coordinates
    const totalLength = path.getTotalLength() || 2000
    const point = path.getPointAtLength(s * totalLength)

    // 3. Map viewBox percentage to normalized screen coordinates
    const normalizedX = (point.x / 100) - 0.5
    const pointYPixels = (point.y / 100) * main.clientHeight
    const screenYPixels = pointYPixels - scrollY
    const normalizedY = 0.5 - (screenYPixels / window.innerHeight)

    // 4. Map normalized coordinates to world coordinates
    let x = normalizedX * viewport.width
    let y = normalizedY * viewport.height
    let z = 0
    let rx = Math.PI / 4
    let ry = 0
    
    // Dynamic tilt based on screen side
    let rz = x > 0 ? -Math.PI / 12 : Math.PI / 12

    // Hero section hover (pass control to inner float animations)
    if (s < 0.05) {
      x = 0
      y = 1
      rz = Math.PI / 4
    }
    // Erasing rotation flip and offset when scrolling up
    if (scrollDirection === 'up' && s < 0.99) {
      rz += Math.PI // Rotate 180 degrees so eraser points down
      rx = -Math.PI / 4 // Angle for eraser contact
      
      // Offset the group position so the eraser tip (located 3.8 units up the body)
      // sits exactly on the path coordinates (x, y)
      x += 3.8 * Math.sin(rz)
      y -= 3.8 * Math.cos(rz)
    }

    // Final sleep mode at the end (preserve exact path coordinates, only lie flat)
    if (s >= 0.99) {
      rx = 0
      ry = 0
      rz = -Math.PI / 2 // Flat horizontal below text
    } 
    // When scrolling stops (but not at the end or hero), pencil rests vertically on the side margin
    else if (!isScrolling && s >= 0.05) {
      x = x > 0 ? (viewport.width * 0.4) : (-viewport.width * 0.4) // Snap to nearest edge
      rx = 0
      ry = x > 0 ? -Math.PI / 4 : Math.PI / 4
      rz = 0 // Rest vertically (straight up)
    }

    // Smooth snap lerp weight: 0.25 (buttery smooth snaps when scroll starts)
    const lerpWeight = isScrolling ? 0.25 : 0.06

    // Smooth lerp coordinates
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, x, lerpWeight)
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, y, lerpWeight)
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, z, lerpWeight)
    
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, rx, lerpWeight)
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, ry, lerpWeight)
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, rz, lerpWeight)
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
  
  // Track a single scale factor
  const factorRef = useRef(1)

  useFrame(() => {
    const target = scroll > 0.12 ? 0 : 1
    factorRef.current = THREE.MathUtils.lerp(factorRef.current, target, 0.1)

    const f = factorRef.current
    if (notebookRef.current) notebookRef.current.scale.set(f * 0.6, f * 0.6, f * 0.6)
    if (capRef.current) capRef.current.scale.set(f * 0.7, f * 0.7, f * 0.7)
    if (laptopRef.current) laptopRef.current.scale.set(f * 0.8, f * 0.8, f * 0.8)
    if (ball1Ref.current) ball1Ref.current.scale.set(f * 0.8, f * 0.8, f * 0.8)
    if (ball2Ref.current) ball2Ref.current.scale.set(f * 1.1, f * 1.1, f * 1.1)
    if (ball3Ref.current) ball3Ref.current.scale.set(f * 0.6, f * 0.6, f * 0.6)
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

export default function Scene3D({ scroll = 0, isScrolling = false, scrollDirection = 'down', pathRef, mainRef, isMainPage = true }) {
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
        <MovingPencil isScrolling={isScrolling} scrollDirection={scrollDirection} pathRef={pathRef} mainRef={mainRef} />

        <ContactShadows position={[0, -8, 0]} opacity={0.25} scale={30} blur={3} far={15} />
      </Canvas>
    </div>
  )
}

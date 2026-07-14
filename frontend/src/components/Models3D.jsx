import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Icosahedron } from '@react-three/drei'
import * as THREE from 'three'

// Premium materials
const premiumMaterial = new THREE.MeshPhysicalMaterial({
  color: '#111111',
  metalness: 0.1,
  roughness: 0.8,
  clearcoat: 0.1,
  clearcoatRoughness: 0.2,
})

const paperMaterial = new THREE.MeshStandardMaterial({
  color: '#F4F0E6',
  roughness: 1,
  metalness: 0,
})

const applePencilBodyMaterial = new THREE.MeshPhysicalMaterial({
  color: '#FFFFFF',
  roughness: 0.2,
  metalness: 0.05,
  clearcoat: 0.3,
  clearcoatRoughness: 0.1,
})

const applePencilTipMaterial = new THREE.MeshPhysicalMaterial({
  color: '#E2E8F0',
  roughness: 0.5,
  metalness: 0,
})

// Interactive click-to-spin wrapper
function InteractiveWrapper({ children, defaultRotation = [0, 0, 0], ...props }) {
  const ref = useRef()
  const [spinAngle, setSpinAngle] = useState(0)

  const handleClick = (e) => {
    e.stopPropagation()
    setSpinAngle(prev => prev + Math.PI / 2) // Spins 90 deg on click
  }

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, spinAngle, 0.1)
    }
  })

  return (
    <group ref={ref} onClick={handleClick} rotation={defaultRotation} {...props}>
      {children}
    </group>
  )
}

// The Traveling Paper Ball
export function PaperBall({ isTraveling = false, ...props }) {
  const ref = useRef()
  
  useFrame((state) => {
    if (isTraveling && ref.current) {
      ref.current.rotation.x += 0.01
      ref.current.rotation.y += 0.015
    }
  })

  return (
    <InteractiveWrapper {...props}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh castShadow receiveShadow>
          <Icosahedron args={[0.3, 2]} />
          <primitive object={paperMaterial} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.IcosahedronGeometry(0.301, 2)]} />
          <lineBasicMaterial color="#555555" transparent opacity={0.3} />
        </lineSegments>
      </Float>
    </InteractiveWrapper>
  )
}

// Sleek White Highlighter Pen with pivot at the TIP [0, 0, 0]
export function Pencil({ isHero = false, ...props }) {
  const ref = useRef()
  
  useFrame((state) => {
    if (isHero && ref.current) {
      const t = state.clock.getElapsedTime()
      ref.current.rotation.x = Math.sin(t / 4) / 8
      ref.current.rotation.y = Math.cos(t / 4) / 8
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, (state.mouse.x * 2), 0.05)
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, (state.mouse.y * 2), 0.05)
    }
  })

  return (
    <group ref={ref} {...props}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <group>
          {/* Highlighter blue felt tip (matching drawing path, centered at Y=0.05, reaches Y=0) */}
          <mesh castShadow receiveShadow position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]} scale={[1.4, 1.0, 0.4]}>
            <coneGeometry args={[0.04, 0.1, 4]} />
            <meshStandardMaterial color="#2563EB" roughness={0.8} />
          </mesh>

          {/* Light grey pencil tip cone - tapered/chiseled (tip reaches Y=0.1, base at Y=0.5) */}
          <mesh castShadow receiveShadow position={[0, 0.3, 0]} rotation={[Math.PI, 0, 0]} scale={[1.4, 1.0, 0.4]}>
            <coneGeometry args={[0.15, 0.4, 4]} />
            <primitive object={applePencilTipMaterial} />
          </mesh>

          {/* Highlighter Main Body (cylinder of height 3.4, starting at Y=0.5, ending at Y=3.9) */}
          <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 3.4, 32]} />
            <primitive object={applePencilBodyMaterial} />
          </mesh>

          {/* Minimalist grey cap line (Apple Pencil style, at Y=3.92) */}
          <mesh castShadow receiveShadow position={[0, 3.92, 0]}>
            <cylinderGeometry args={[0.151, 0.151, 0.04, 32]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.5} roughness={0.2} />
          </mesh>
          
          {/* White top cap dome (at Y=3.94) */}
          <mesh castShadow receiveShadow position={[0, 3.94, 0]}>
            <sphereGeometry args={[0.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <primitive object={applePencilBodyMaterial} />
          </mesh>
        </group>
      </Float>
    </group>
  )
}

export function Notebook(props) {
  return (
    <InteractiveWrapper {...props}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group rotation={[-Math.PI / 6, Math.PI / 4, 0]}>
          <mesh castShadow receiveShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[2.8, 0.2, 3.8]} />
            <meshStandardMaterial color="#FFFFFF" roughness={1} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
            <boxGeometry args={[3, 0.1, 4]} />
            <primitive object={paperMaterial} />
          </mesh>
          <mesh castShadow receiveShadow position={[-1.55, -0.05, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 4, 16]} />
            <primitive object={premiumMaterial} />
          </mesh>
        </group>
      </Float>
    </InteractiveWrapper>
  )
}

export function GradCap(props) {
  return (
    <InteractiveWrapper {...props}>
      <Float speed={2.5} rotationIntensity={0.8} floatIntensity={1.2}>
        <group rotation={[Math.PI / 8, Math.PI / 4, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[2.5, 0.05, 2.5]} />
            <primitive object={premiumMaterial} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 1, 32]} />
            <primitive object={premiumMaterial} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
            <meshStandardMaterial color="#2563EB" />
          </mesh>
          <mesh castShadow position={[0.7, -0.2, 0.7]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
            <meshStandardMaterial color="#2563EB" />
          </mesh>
        </group>
      </Float>
    </InteractiveWrapper>
  )
}

export function Laptop(props) {
  return (
    <InteractiveWrapper {...props}>
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
        <group rotation={[Math.PI / 12, -Math.PI / 6, 0]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[4, 0.1, 3]} />
            <meshStandardMaterial color="#CCCCCC" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 1.5, -1.4]} rotation={[Math.PI / 12, 0, 0]}>
            <boxGeometry args={[4, 3, 0.1]} />
            <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </Float>
    </InteractiveWrapper>
  )
}

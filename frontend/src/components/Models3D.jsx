import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Icosahedron } from '@react-three/drei'
import * as THREE from 'three'

// Premium Monochrome Material
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

// The Traveling Paper Ball
export function PaperBall({ isTraveling = false, ...props }) {
  const ref = useRef()
  
  useFrame((state) => {
    if (isTraveling && ref.current) {
      // Gentle spin as it travels
      ref.current.rotation.x += 0.01
      ref.current.rotation.y += 0.015
    }
  })

  return (
    <group ref={ref} {...props}>
      <Float speed={2} rotationIntensity={isTraveling ? 0 : 0.5} floatIntensity={isTraveling ? 0 : 1}>
        <mesh castShadow receiveShadow>
          {/* Icosahedron gives a slightly jagged, crumpled look compared to a perfect sphere */}
          <Icosahedron args={[0.3, 2]} />
          <primitive object={paperMaterial} />
        </mesh>
        {/* Drawn graphite lines on the ball */}
        <lineSegments>
          <edgesGeometry args={[new THREE.IcosahedronGeometry(0.301, 2)]} />
          <lineBasicMaterial color="#555555" transparent opacity={0.3} />
        </lineSegments>
      </Float>
    </group>
  )
}

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
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <group rotation={[Math.PI / 4, 0, Math.PI / 6]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 3, 6]} />
            <meshStandardMaterial color="#E0A96D" roughness={0.7} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -1.7, 0]}>
            <coneGeometry args={[0.2, 0.4, 6]} />
            <meshStandardMaterial color="#E8DCC4" roughness={0.9} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -1.9, 0]}>
            <coneGeometry args={[0.05, 0.1, 6]} />
            <primitive object={premiumMaterial} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.21, 0.21, 0.2, 16]} />
            <meshStandardMaterial color="#A1A1AA" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 1.85, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
            <meshStandardMaterial color="#D98383" roughness={0.9} />
          </mesh>
        </group>
      </Float>
    </group>
  )
}

export function Notebook(props) {
  return (
    <group {...props}>
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
    </group>
  )
}

export function GradCap(props) {
  return (
    <group {...props}>
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
    </group>
  )
}

export function Laptop(props) {
  return (
    <group {...props}>
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
        <group rotation={[Math.PI / 12, -Math.PI / 6, 0]}>
          {/* Base */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[4, 0.1, 3]} />
            <meshStandardMaterial color="#CCCCCC" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Screen */}
          <mesh castShadow receiveShadow position={[0, 1.5, -1.4]} rotation={[Math.PI / 12, 0, 0]}>
            <boxGeometry args={[4, 3, 0.1]} />
            <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </Float>
    </group>
  )
}

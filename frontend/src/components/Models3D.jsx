import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// Premium Monochrome Material
const premiumMaterial = new THREE.MeshPhysicalMaterial({
  color: '#111111',
  metalness: 0.1,
  roughness: 0.8,
  clearcoat: 0.1,
  clearcoatRoughness: 0.2,
})

const lightMaterial = new THREE.MeshPhysicalMaterial({
  color: '#FFFFFF',
  metalness: 0.1,
  roughness: 0.6,
})

export function Pencil({ isHero = false, ...props }) {
  const ref = useRef()
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime()
      // Slower rotation
      ref.current.rotation.x = Math.sin(t / 6) / 10
      ref.current.rotation.y = Math.cos(t / 6) / 10
      
      if (isHero) {
        ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, (state.mouse.x * 1.5), 0.05)
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, (state.mouse.y * 1.5), 0.05)
      }
    }
  })

  return (
    <group ref={ref} {...props}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.8}>
        <group rotation={[Math.PI / 4, 0, Math.PI / 6]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 3, 6]} />
            <primitive object={premiumMaterial} />
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
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.CylinderGeometry(0.201, 0.201, 3, 6)]} />
            <lineBasicMaterial color="#0F62FE" transparent opacity={0.15} />
          </lineSegments>
        </group>
      </Float>
    </group>
  )
}

export function Notebook({ isVisible = true, ...props }) {
  const ref = useRef()
  const scale = isVisible ? 1 : 0
  
  return (
    <group ref={ref} {...props} scale={scale}>
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
        <group rotation={[-Math.PI / 6, Math.PI / 4, 0]}>
          <mesh castShadow receiveShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[2.8, 0.2, 3.8]} />
            <primitive object={lightMaterial} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
            <boxGeometry args={[3, 0.1, 4]} />
            <primitive object={premiumMaterial} />
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

export function Laptop({ isVisible = false, ...props }) {
  const scale = isVisible ? 1 : 0
  return (
    <group {...props} scale={scale}>
      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.4}>
        <group rotation={[Math.PI / 8, -Math.PI / 6, 0]}>
          {/* Base */}
          <mesh castShadow receiveShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[4, 0.15, 2.8]} />
            <meshStandardMaterial color="#E5E5E5" metalness={0.7} roughness={0.2} />
          </mesh>
          {/* Keyboard indent */}
          <mesh receiveShadow position={[0, 0, 0.2]}>
            <boxGeometry args={[3.6, 0.16, 1.4]} />
            <meshStandardMaterial color="#111111" roughness={0.8} />
          </mesh>
          {/* Screen (Open) */}
          <group position={[0, 0, -1.4]} rotation={[Math.PI / 3, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 1.4, 0]}>
              <boxGeometry args={[4, 2.8, 0.1]} />
              <meshStandardMaterial color="#E5E5E5" metalness={0.7} roughness={0.2} />
            </mesh>
            {/* Screen Inner */}
            <mesh position={[0, 1.4, 0.06]}>
              <boxGeometry args={[3.8, 2.6, 0.02]} />
              <meshStandardMaterial color="#0A0A0A" />
            </mesh>
          </group>
        </group>
      </Float>
    </group>
  )
}

export function GradCap(props) {
  return (
    <group {...props}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
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
            <meshStandardMaterial color="#0F62FE" />
          </mesh>
          <mesh castShadow position={[0.7, -0.2, 0.7]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
            <meshStandardMaterial color="#0F62FE" />
          </mesh>
        </group>
      </Float>
    </group>
  )
}

export function PaperSheets(props) {
  return (
    <group {...props}>
      <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1.5}>
        <mesh position={[0, 0, 0]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.02, 3.5]} />
          <primitive object={lightMaterial} />
        </mesh>
        <mesh position={[0.2, 0.1, -0.2]} rotation={[0, -0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.02, 3.5]} />
          <primitive object={lightMaterial} />
        </mesh>
      </Float>
    </group>
  )
}

export function ParticleSystem({ count = 150 }) {
  const points = useRef()

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5
    }
    return positions
  }, [count])

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.getElapsedTime() * 0.02
      points.current.rotation.x = state.clock.getElapsedTime() * 0.01
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#A1A1AA"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  )
}

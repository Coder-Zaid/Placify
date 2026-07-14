import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Line } from '@react-three/drei'
import * as THREE from 'three'

// Premium Monochrome Material
const premiumMaterial = new THREE.MeshPhysicalMaterial({
  color: '#111111',
  metalness: 0.1,
  roughness: 0.8,
  clearcoat: 0.1,
  clearcoatRoughness: 0.2,
})

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#FFFFFF',
  transmission: 0.9,
  opacity: 1,
  metalness: 0,
  roughness: 0,
  ior: 1.5,
  thickness: 0.1,
  transparent: true,
})

export function Pencil({ isHero = false, ...props }) {
  const ref = useRef()
  
  // Floating parallax effect if it's the hero pencil
  useFrame((state) => {
    if (isHero && ref.current) {
      const t = state.clock.getElapsedTime()
      ref.current.rotation.x = Math.sin(t / 4) / 8
      ref.current.rotation.y = Math.cos(t / 4) / 8
      // Subtle mouse follow
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, (state.mouse.x * 2), 0.05)
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, (state.mouse.y * 2), 0.05)
    }
  })

  return (
    <group ref={ref} {...props}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <group rotation={[Math.PI / 4, 0, Math.PI / 6]}>
          {/* Main Body (Hexagonal Cylinder) */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 3, 6]} />
            <primitive object={premiumMaterial} />
          </mesh>
          
          {/* Wooden Tip Base */}
          <mesh castShadow receiveShadow position={[0, -1.7, 0]}>
            <coneGeometry args={[0.2, 0.4, 6]} />
            <meshStandardMaterial color="#E8DCC4" roughness={0.9} />
          </mesh>
          
          {/* Graphite Point */}
          <mesh castShadow receiveShadow position={[0, -1.9, 0]}>
            <coneGeometry args={[0.05, 0.1, 6]} />
            <primitive object={premiumMaterial} />
          </mesh>

          {/* Metal Ring (Ferrule) */}
          <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.21, 0.21, 0.2, 16]} />
            <meshStandardMaterial color="#A1A1AA" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Eraser */}
          <mesh castShadow receiveShadow position={[0, 1.85, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </mesh>
          
          {/* Wireframe Outline for Tech Aesthetic */}
          <lineSegments>
            <edgesGeometry args={[new THREE.CylinderGeometry(0.201, 0.201, 3, 6)]} />
            <lineBasicMaterial color="#0F62FE" transparent opacity={0.15} />
          </lineSegments>
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
          {/* Base Pages */}
          <mesh castShadow receiveShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[2.8, 0.2, 3.8]} />
            <meshStandardMaterial color="#FFFFFF" roughness={1} />
          </mesh>
          
          {/* Cover */}
          <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
            <boxGeometry args={[3, 0.1, 4]} />
            <primitive object={premiumMaterial} />
          </mesh>
          
          {/* Spine Binding */}
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
          {/* Top Board */}
          <mesh castShadow receiveShadow position={[0, 0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[2.5, 0.05, 2.5]} />
            <primitive object={premiumMaterial} />
          </mesh>
          
          {/* Skull Cap Base */}
          <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 1, 32]} />
            <primitive object={premiumMaterial} />
          </mesh>
          
          {/* Tassel Button */}
          <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
            <meshStandardMaterial color="#0F62FE" />
          </mesh>

          {/* Tassel String */}
          <mesh castShadow position={[0.7, -0.2, 0.7]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
            <meshStandardMaterial color="#0F62FE" />
          </mesh>
        </group>
      </Float>
    </group>
  )
}

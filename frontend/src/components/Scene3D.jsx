import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows, PresentationControls } from '@react-three/drei'
import { EffectComposer, DepthOfField } from '@react-three/postprocessing'
import { Pencil, Notebook, Laptop, GradCap, PaperSheets, ParticleSystem } from './Models3D'
import * as THREE from 'three'
import { useRef } from 'react'

function CameraRig() {
  const group = useRef()
  useFrame((state) => {
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, (window.scrollY * -0.002), 0.05)
  })
  return <group ref={group} />
}

export default function Scene3D({ scrollProgress = 0, currentSection = 'hero' }) {
  
  return (
    <div className="fixed inset-0 z-[-10] pointer-events-none opacity-40">
      <Canvas shadows camera={{ position: [0, 0, 15], fov: 35 }}>
        <color attach="background" args={['#FAF9F7']} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />
        <Environment preset="city" />
        
        <CameraRig />
        
        <PresentationControls 
          global 
          config={{ mass: 2, tension: 500 }} 
          snap={{ mass: 4, tension: 1500 }} 
          rotation={[0, 0.3, 0]} 
          polar={[-Math.PI / 3, Math.PI / 3]} 
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          {/* Particles */}
          <ParticleSystem count={200} />
          
          {/* Main Animated Elements based on scroll context */}
          <Pencil isHero={true} position={[0, 0, 0]} scale={1.2} />
          
          <Notebook isVisible={currentSection !== 'college' && currentSection !== 'placement'} position={[-5, 2, -4]} scale={0.6} />
          <Laptop isVisible={currentSection === 'college' || currentSection === 'projects'} position={[-5, 2, -4]} scale={0.6} />
          
          <GradCap position={[4, -3, -2]} scale={0.7} />
          <PaperSheets position={[5, 4, -6]} scale={0.8} />
          
        </PresentationControls>

        <ContactShadows position={[0, -5, 0]} opacity={0.4} scale={20} blur={2} far={10} />
        
        <EffectComposer>
          <DepthOfField focusDistance={0.05} focalLength={0.15} bokehScale={2.5} height={480} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

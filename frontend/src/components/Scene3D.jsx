import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows, PresentationControls } from '@react-three/drei'
import { Pencil, Notebook, GradCap } from './Models3D'

export default function Scene3D({ type = 'hero' }) {
  
  if (type === 'hero') {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas shadows camera={{ position: [0, 0, 15], fov: 35 }}>
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize-width={1024} 
            shadow-mapSize-height={1024} 
          />
          <Environment preset="city" />
          
          <PresentationControls 
            global 
            config={{ mass: 2, tension: 500 }} 
            snap={{ mass: 4, tension: 1500 }} 
            rotation={[0, 0.3, 0]} 
            polar={[-Math.PI / 3, Math.PI / 3]} 
            azimuth={[-Math.PI / 1.4, Math.PI / 2]}
          >
            {/* The Main Hero Pencil */}
            <Pencil isHero={true} position={[0, 0, 0]} scale={1.2} />
            
            {/* Background Floating Elements */}
            <Notebook position={[-5, 2, -4]} scale={0.6} />
            <GradCap position={[4, -3, -2]} scale={0.7} />
            
            {/* Additional Decorative Elements can go here */}
          </PresentationControls>

          <ContactShadows position={[0, -5, 0]} opacity={0.4} scale={20} blur={2} far={10} />
        </Canvas>
      </div>
    )
  }

  // Fallback or specific object rendering
  return (
    <div className="w-full h-full">
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 35 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="studio" />
        
        {type === 'pencil' && <Pencil position={[0, 0, 0]} scale={1.5} />}
        {type === 'book' && <Notebook position={[0, 0, 0]} scale={1.2} />}
        {type === 'cap' && <GradCap position={[0, 0, 0]} scale={1.5} />}
        
        <ContactShadows position={[0, -3, 0]} opacity={0.3} blur={2} />
      </Canvas>
    </div>
  )
}

import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows, PresentationControls } from '@react-three/drei'
import { Pencil, Notebook, GradCap, Laptop, PaperBall } from './Models3D'

export default function Scene3D() {
  return (
    <div className="fixed inset-0 z-[-100] pointer-events-none w-full h-full">
      <Canvas shadows camera={{ position: [0, 0, 20], fov: 35 }}>
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <Environment preset="city" />
        
        {/* Background Floating Elements - Spread around the edges */}
        <Notebook position={[-8, 6, -5]} scale={0.6} rotation={[0.2, 0.5, -0.2]} />
        <GradCap position={[8, 7, -8]} scale={0.7} rotation={[0.1, -0.4, 0.3]} />
        <Laptop position={[9, -4, -10]} scale={0.8} rotation={[-0.2, -0.5, 0.1]} />
        <Pencil position={[-7, -6, -6]} scale={1.2} rotation={[0.5, 0.1, -0.3]} />
        
        {/* Some scattered paper balls */}
        <PaperBall position={[5, 2, -15]} scale={0.8} />
        <PaperBall position={[-9, 0, -12]} scale={1.1} />
        <PaperBall position={[6, -8, -10]} scale={0.6} />

        <ContactShadows position={[0, -10, 0]} opacity={0.3} scale={40} blur={2.5} far={20} />
      </Canvas>
    </div>
  )
}

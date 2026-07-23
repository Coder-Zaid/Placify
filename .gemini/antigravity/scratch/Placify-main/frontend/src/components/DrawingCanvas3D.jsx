import { useEffect, useRef } from 'react'

export default function DrawingCanvas3D({ type = 'pencil', width = 160, height = 160, isInteractive = true }) {
  const canvasRef = useRef(null)
  const angleRef = useRef({ x: 0.5, y: 0.5 })
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    // Define 3D wireframe points
    let vertices = []
    let faces = []

    if (type === 'pencil') {
      // 3D Cylinder/Hexagonal Pencil model points
      // Bottom flat end (x, y, z)
      for (let i = 0; i < 6; i++) {
        const theta = (i * Math.PI) / 3
        vertices.push({ x: Math.cos(theta) * 15, y: -45, z: Math.sin(theta) * 15 })
      }
      // Top cylinder end
      for (let i = 0; i < 6; i++) {
        const theta = (i * Math.PI) / 3
        vertices.push({ x: Math.cos(theta) * 15, y: 35, z: Math.sin(theta) * 15 })
      }
      // Pencil Tip Point
      vertices.push({ x: 0, y: 65, z: 0 })

      // Define lines / faces
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6
        faces.push([i, next]) // bottom ring
        faces.push([i + 6, next + 6]) // top ring
        faces.push([i, i + 6]) // sides
        faces.push([i + 6, 12]) // tip connections
      }
    } else if (type === 'book') {
      // 3D Wireframe Notebook
      vertices = [
        // Front cover page
        { x: -35, y: -45, z: -5 }, { x: 35, y: -45, z: -5 },
        { x: 35, y: 45, z: -5 }, { x: -35, y: 45, z: -5 },
        // Back cover page
        { x: -35, y: -45, z: 5 }, { x: 35, y: -45, z: 5 },
        { x: 35, y: 45, z: 5 }, { x: -35, y: 45, z: 5 }
      ]
      faces = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Front face
        [4, 5], [5, 6], [6, 7], [7, 4], // Back face
        [0, 4], [1, 5], [2, 6], [3, 7]  // Thickness connectors
      ]
    } else if (type === 'cap') {
      // 3D Graduation Cap
      // Top Diamond board
      vertices = [
        { x: 0, y: 15, z: -45 }, { x: 45, y: 15, z: 0 },
        { x: 0, y: 15, z: 45 }, { x: -45, y: 15, z: 0 },
        // Cap base cylinder
        { x: -18, y: -5, z: -18 }, { x: 18, y: -5, z: -18 },
        { x: 18, y: -5, z: 18 }, { x: -18, y: -5, z: 18 },
        { x: -18, y: 15, z: -18 }, { x: 18, y: 15, z: -18 },
        { x: 18, y: 15, z: 18 }, { x: -18, y: 15, z: 18 }
      ]
      faces = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Top diamond board outline
        [4, 5], [5, 6], [6, 7], [7, 4], // Base bottom ring
        [8, 9], [9, 10], [10, 11], [11, 8], // Base top ring
        [4, 8], [5, 9], [6, 10], [7, 11] // Base height connectors
      ]
    }

    const project = (x, y, z, angleX, angleY) => {
      // Rotate around X axis
      let radX = angleX
      let cosX = Math.cos(radX)
      let sinX = Math.sin(radX)
      let y1 = y * cosX - z * sinX
      let z1 = y * sinX + z * cosX

      // Rotate around Y axis
      let radY = angleY
      let cosY = Math.cos(radY)
      let sinY = Math.sin(radY)
      let x2 = x * cosY - z1 * sinY
      let z2 = x * sinY + z1 * cosY

      // Perspective Projection
      const fov = 180
      const distance = 160
      const scale = fov / (distance + z2)
      return {
        x: canvas.width / 2 + x2 * scale,
        y: canvas.height / 2 - y1 * scale
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Decay spin
      if (!isInteractive) {
        angleRef.current.y += 0.006
        angleRef.current.x = 0.35 + Math.sin(Date.now() / 2000) * 0.1
      } else {
        // Soft lag follow mouse rotation
        angleRef.current.y += (mouseRef.current.x - angleRef.current.y) * 0.08
        angleRef.current.x += (mouseRef.current.y - angleRef.current.x) * 0.08
      }

      ctx.strokeStyle = 'rgba(15, 15, 17, 0.95)'
      ctx.lineWidth = 1.3

      // Draw all connections
      faces.forEach((edge) => {
        const p1 = project(vertices[edge[0]].x, vertices[edge[0]].y, vertices[edge[0]].z, angleRef.current.x, angleRef.current.y)
        const p2 = project(vertices[edge[1]].x, vertices[edge[1]].y, vertices[edge[1]].z, angleRef.current.x, angleRef.current.y)

        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      })

      // Draw small connector pins for wireframe nodes
      ctx.fillStyle = '#0F0F11'
      vertices.forEach((v) => {
        const p = project(v.x, v.y, v.z, angleRef.current.x, angleRef.current.y)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationFrameId)
  }, [type, isInteractive])

  const handleMouseMove = (e) => {
    if (!isInteractive) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 4 - 2 // Horizontal rotation limits
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1 // Vertical rotation limits
    mouseRef.current = { x, y }
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      className="cursor-grab active:cursor-grabbing transition-transform duration-200"
    />
  )
}

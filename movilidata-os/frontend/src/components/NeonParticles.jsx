import { useEffect, useRef } from 'react'

export default function NeonParticles({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }))

    const drawConnection = (p1, p2, dist) => {
      const maxDist = 150
      if (dist > maxDist) return
      const alpha = (1 - dist / maxDist) * 0.15
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    let time = 0
    const animate = () => {
      time += 0.01
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.pulse += 0.02
        p.x += p.vx + Math.sin(time + p.pulse) * 0.1
        p.y += p.vy + Math.cos(time + p.pulse) * 0.1

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        const alpha = p.alpha + Math.sin(p.pulse) * 0.15
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 255, 255, ${Math.max(0.1, alpha)})`
        ctx.fill()

        ctx.shadowBlur = 4
        ctx.shadowColor = '#00FFFF'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(138, 43, 226, ${Math.max(0.05, alpha * 0.5)})`
        ctx.fill()
        ctx.shadowBlur = 0
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          drawConnection(particles[i], particles[j], dist)
        }
      }

      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      className={className}
    />
  )
}

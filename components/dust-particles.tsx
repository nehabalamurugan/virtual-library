'use client'

import { useEffect, useState } from 'react'

interface InkMark {
  id: number
  top: number
  left: number
  width: number
  rotation: number
  opacity: number
  type: 'dot' | 'scratch' | 'smudge'
}

export function InkMarks() {
  const [marks, setMarks] = useState<InkMark[]>([])

  useEffect(() => {
    const generated: InkMark[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      width: Math.random() * 30 + 5,
      rotation: Math.random() * 360,
      opacity: Math.random() * 0.04 + 0.01,
      type: (['dot', 'scratch', 'smudge'] as const)[Math.floor(Math.random() * 3)],
    }))
    setMarks(generated)
  }, [])

  if (marks.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {marks.map((mark) => (
        <div key={mark.id}>
          {mark.type === 'dot' && (
            <div
              className="absolute rounded-full bg-foreground"
              style={{
                top: `${mark.top}%`,
                left: `${mark.left}%`,
                width: `${Math.max(2, mark.width / 8)}px`,
                height: `${Math.max(2, mark.width / 8)}px`,
                opacity: mark.opacity,
              }}
            />
          )}
          {mark.type === 'scratch' && (
            <svg
              className="absolute"
              style={{
                top: `${mark.top}%`,
                left: `${mark.left}%`,
                width: `${mark.width}px`,
                height: '3px',
                opacity: mark.opacity,
                transform: `rotate(${mark.rotation}deg)`,
              }}
            >
              <line
                x1="0"
                y1="1"
                x2={mark.width}
                y2="1"
                stroke="#0a0a0a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
          {mark.type === 'smudge' && (
            <div
              className="absolute rounded-full bg-foreground"
              style={{
                top: `${mark.top}%`,
                left: `${mark.left}%`,
                width: `${mark.width / 3}px`,
                height: `${mark.width / 5}px`,
                opacity: mark.opacity * 0.5,
                transform: `rotate(${mark.rotation}deg)`,
                filter: 'blur(2px)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const VIDEO_URL = 'https://res.cloudinary.com/dwkuqttoe/video/upload/vc_h264,ac_aac/v1773216047/phone2_aadiaf.mp4'
const STATE_POLL_MS = 1000

export default function ExhibitTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<'playing' | 'killed'>('playing')

  const pollState = useCallback(async () => {
    try {
      const res = await fetch('/api/exhibit/state')
      const data = (await res.json()) as { mode?: string }
      if (data.mode === 'killed' || data.mode === 'playing') {
        setMode(data.mode)
      }
    } catch {
      // keep previous mode
    }
  }, [])

  useEffect(() => {
    pollState()
    const interval = setInterval(pollState, STATE_POLL_MS)
    return () => clearInterval(interval)
  }, [pollState])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (mode === 'killed') {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }, [mode])

  return (
    <div style={{ background: 'black', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {mode === 'killed' && <div style={{ position: 'absolute', inset: 0, background: 'black', zIndex: 1 }} />}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        controls
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: mode === 'killed' ? 0 : 1,
          position: 'relative',
          zIndex: 0,
        }}
      />
    </div>
  )
}

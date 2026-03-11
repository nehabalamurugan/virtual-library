'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const VIDEO_URL = 'https://res.cloudinary.com/dwkuqttoe/video/upload/vc_h264,ac_aac/v1773216047/phone2_aadiaf.mp4'
const STATE_POLL_MS = 1000

export default function ExhibitTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<'playing' | 'killed'>('playing')
  const [debug, setDebug] = useState('starting')

  const pollState = useCallback(async () => {
    try {
      const res = await fetch('/api/exhibit/state')
      const data = (await res.json()) as { mode?: string }
      if (data.mode === 'killed' || data.mode === 'playing') {
        setMode(data.mode)
      }
    } catch {
      setDebug(prev => `${prev} | state fetch failed`)
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

    const tryPlay = async () => {
      try {
        if (mode === 'killed') {
          video.pause()
          setDebug('paused because killed')
        } else {
          await video.play()
          setDebug('play succeeded')
        }
      } catch (err) {
        console.error('video.play failed', err)
        setDebug(`play failed: ${String(err)}`)
      }
    }

    tryPlay()
  }, [mode])

  return (
    <div
      style={{
        background: 'black',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {mode === 'killed' && (
        <div style={{ position: 'absolute', inset: 0, background: 'black', zIndex: 2 }} />
      )}

      <video
        ref={videoRef}
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
          zIndex: 1,
          background: 'black',
        }}
        onLoadedMetadata={() => setDebug('loaded metadata')}
        onCanPlay={() => setDebug('can play')}
        onPlaying={() => setDebug('playing')}
        onError={() => {
          const video = videoRef.current
          console.error('video error', video?.error)
          setDebug(`video error code: ${video?.error?.code ?? 'unknown'}`)
        }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          color: 'white',
          zIndex: 3,
          fontSize: 14,
        }}
      >
        {debug}
      </div>
    </div>
  )
}

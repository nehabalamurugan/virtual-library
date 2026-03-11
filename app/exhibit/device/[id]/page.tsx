'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

const STATE_POLL_MS = 1000

const VIDEO_ENV_KEYS = [
  'NEXT_PUBLIC_EXHIBIT_VIDEO_1',
  'NEXT_PUBLIC_EXHIBIT_VIDEO_2',
  'NEXT_PUBLIC_EXHIBIT_VIDEO_3',
  'NEXT_PUBLIC_EXHIBIT_VIDEO_4',
] as const

const DEFAULT_VIDEO_URLS: Record<number, string> = {
  1: 'https://res.cloudinary.com/dwkuqttoe/video/upload/vc_h264,ac_aac/v1773216047/phone2_aadiaf.mp4',
  2: 'https://res.cloudinary.com/dwkuqttoe/video/upload/vc_h264,ac_aac/v1773216046/phone1_be2fnt.mp4',
  3: 'https://res.cloudinary.com/dwkuqttoe/video/upload/vc_h264,ac_aac/v1773216042/ipad1_p1tg0x.mp4',
  4: 'https://res.cloudinary.com/dwkuqttoe/video/upload/vc_h264,ac_aac/v1773216038/ipad2_ivicig.mp4',
}

function getVideoUrl(deviceId: number): string | undefined {
  const key = VIDEO_ENV_KEYS[deviceId - 1]
  const envUrl = key && typeof process.env[key] === 'string' ? (process.env[key] as string) : undefined
  return envUrl || DEFAULT_VIDEO_URLS[deviceId]
}

function ExhibitDeviceClient({ deviceId }: { deviceId: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<'playing' | 'killed'>('playing')
  const [userActivated, setUserActivated] = useState(false)

  const videoUrl = getVideoUrl(deviceId)

  // Poll both global and per-device kill switch
  const pollState = useCallback(async () => {
    try {
      const res = await fetch('/api/exhibit/state')
      const data = (await res.json()) as { mode?: string; devices?: Record<string, string> }
      const globalMode = data.mode
      const deviceMode = data.devices?.[String(deviceId)]
      const effective = globalMode === 'killed' || deviceMode === 'killed' ? 'killed' : 'playing'
      setMode(effective)
    } catch {
      // keep previous mode
    }
  }, [deviceId])

  useEffect(() => {
    pollState()
    const interval = setInterval(pollState, STATE_POLL_MS)
    return () => clearInterval(interval)
  }, [pollState])

  // Play or pause based on kill switch
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (mode === 'killed') {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }, [mode])

  const handleTapToStart = useCallback(() => {
    setUserActivated(true)
    const video = videoRef.current
    if (!video) return
    // Play muted first (always allowed on iOS), then unmute once playing
    video.muted = true
    video.play().then(() => {
      video.muted = false
    }).catch(() => {
      video.muted = true
    })
  }, [])

  if (!videoUrl) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black text-white">
        <p className="font-sans text-lg">No video configured for device {deviceId}</p>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
          mode === 'killed' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {mode === 'killed' && <div className="absolute inset-0 bg-black" />}

      {!userActivated && mode !== 'killed' && (
        <button
          type="button"
          onClick={handleTapToStart}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20 text-white"
        >
          <span className="rounded border border-white/60 bg-white/20 px-8 py-4 font-sans text-xl backdrop-blur-sm">
            Tap to start
          </span>
        </button>
      )}
    </div>
  )
}

export default function ExhibitDevicePage() {
  const params = useParams()
  const idParam = params.id
  const deviceId = typeof idParam === 'string' ? parseInt(idParam, 10) : 0

  if (!deviceId || deviceId < 1 || deviceId > 4) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black text-white">
        <p className="font-sans text-lg">Invalid device ID. Use /exhibit/device/1 through /exhibit/device/4</p>
      </div>
    )
  }

  return <ExhibitDeviceClient deviceId={deviceId} />
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

const DETECTION_INTERVAL = 4
const STATE_POLL_MS = 1000
const FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'

const VIDEO_ENV_KEYS = [
  'NEXT_PUBLIC_EXHIBIT_VIDEO_1',
  'NEXT_PUBLIC_EXHIBIT_VIDEO_2',
  'NEXT_PUBLIC_EXHIBIT_VIDEO_3',
  'NEXT_PUBLIC_EXHIBIT_VIDEO_4',
] as const

const DEFAULT_VIDEO_URLS: Record<number, string> = {
  1: 'https://res.cloudinary.com/dwkuqttoe/video/upload/v1773216047/phone2_aadiaf.mp4',
  2: 'https://res.cloudinary.com/dwkuqttoe/video/upload/v1773216046/phone1_be2fnt.mp4',
  3: 'https://res.cloudinary.com/dwkuqttoe/video/upload/v1773216042/ipad1_p1tg0x.mp4',
  4: 'https://res.cloudinary.com/dwkuqttoe/video/upload/v1773216038/ipad2_ivicig.mp4',
}

function getVideoUrl(deviceId: number): string | undefined {
  const key = VIDEO_ENV_KEYS[deviceId - 1]
  const envUrl = key && typeof process.env[key] === 'string' ? (process.env[key] as string) : undefined
  return envUrl || DEFAULT_VIDEO_URLS[deviceId]
}

function ExhibitDeviceClient({ deviceId }: { deviceId: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const faceDetectorRef = useRef<Awaited<ReturnType<typeof import('@mediapipe/tasks-vision').FaceDetector.createFromOptions>> | null>(null)
  const frameCountRef = useRef(0)
  const lastDetectTimestampRef = useRef<number>(Date.now())
  const warmupFramesRef = useRef(0)
  const rafRef = useRef<number>(0)

  const [mode, setMode] = useState<'playing' | 'killed'>('playing')
  const [faceDetected, setFaceDetected] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [detectorReady, setDetectorReady] = useState(false)
  const [userActivated, setUserActivated] = useState(false)

  const videoUrl = getVideoUrl(deviceId)
  const showBlack = mode === 'killed' || faceDetected

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
    if (!video || !videoUrl) return

    if (showBlack) {
      video.pause()
    } else {
      video.muted = !userActivated
      video.play().catch(() => {})
    }
  }, [showBlack, videoUrl, userActivated])

  useEffect(() => {
    let cancelled = false

    async function init() {
      // On mobile, delay face detection so the main video can start first (iOS limits concurrent video)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        await new Promise((r) => setTimeout(r, 2000))
      }
      if (cancelled) return

      try {
        const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL },
          runningMode: 'VIDEO',
        })
        if (cancelled) return
        faceDetectorRef.current = detector
        setDetectorReady(true)
      } catch (err) {
        if (!cancelled) {
          console.error('FaceDetector init failed:', err)
          setCameraError('Face detection unavailable')
        }
      }
    }

    init()
    return () => {
      cancelled = true
      faceDetectorRef.current = null
      setDetectorReady(false)
    }
  }, [])

  useEffect(() => {
    const camera = cameraRef.current
    if (!camera || !detectorReady) return

    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const cam = cameraRef.current
        if (!cam) return
        streamRef.current = stream
        cam.srcObject = stream
        await cam.play()
        setCameraError(null)
      } catch (err) {
        if (!cancelled) {
          setCameraError(err instanceof Error ? err.message : 'Camera unavailable')
        }
      }
    }

    startCamera()
    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      const cam = cameraRef.current
      if (cam?.srcObject) cam.srcObject = null
    }
  }, [detectorReady])

  useEffect(() => {
    const detector = faceDetectorRef.current
    if (!detector) return

    let cancelled = false
    const timeout = setTimeout(() => {
      if (cancelled) return
      detectLoop()
    }, 500)

    function detectLoop() {
      if (cancelled) return
      const cam = cameraRef.current
      const det = faceDetectorRef.current
      if (!cam || !det) {
        rafRef.current = requestAnimationFrame(detectLoop)
        return
      }
      // Wait for video to have valid frame data and dimensions
      if (cam.readyState < 2 || !cam.videoWidth || !cam.videoHeight || !cam.srcObject) {
        rafRef.current = requestAnimationFrame(detectLoop)
        return
      }

      // Warmup: skip first ~45 frames (~0.75s) to let the video stream stabilise (avoids initial errors)
      warmupFramesRef.current += 1
      if (warmupFramesRef.current < 45) {
        rafRef.current = requestAnimationFrame(detectLoop)
        return
      }

      frameCountRef.current += 1
      if (frameCountRef.current % DETECTION_INTERVAL === 0) {
        try {
          // MediaPipe requires strictly increasing integer timestamps (ms). Use simple increment.
          lastDetectTimestampRef.current += 34 // ~30fps
          const timestamp = lastDetectTimestampRef.current
          const result = det.detectForVideo(cam, timestamp)
          const hasFace = result.detections && result.detections.length > 0
          if (hasFace) {
            setFaceDetected(true) // Stays black until user resets
          }
        } catch (e) {
          // Keep timestamp increasing so next attempt succeeds
          lastDetectTimestampRef.current += 34
          console.warn('Face detection error:', e)
        }
      }

      rafRef.current = requestAnimationFrame(detectLoop)
    }
    return () => {
      cancelled = true
      clearTimeout(timeout)
      cancelAnimationFrame(rafRef.current)
    }
  }, [detectorReady])

  if (!videoUrl) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black text-white">
        <p className="font-sans text-lg">No video configured for device {deviceId}</p>
      </div>
    )
  }

  const handleVideoCanPlay = useCallback(() => {
    const video = videoRef.current
    if (video && !showBlack && video.paused) {
      video.play().catch(() => {})
    }
  }, [showBlack])

  const handleTapToStart = useCallback(() => {
    setUserActivated(true)
    const video = videoRef.current
    if (video && !showBlack) {
      video.muted = false
      // Must call play() synchronously in click handler for iOS to allow unmuted playback
      video.play().catch(() => {})
    }
  }, [showBlack])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <video
        ref={(el) => {
          // React's muted prop doesn't reliably set the DOM attribute on iOS/Android.
          // Set it directly on the element so autoplay is permitted without a user gesture.
          if (el) {
            el.muted = !userActivated
            videoRef.current = el
          }
        }}
        src={videoUrl}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
          showBlack ? 'opacity-0' : 'opacity-100'
        }`}
        muted={!userActivated}
        playsInline
        autoPlay
        loop
        preload="auto"
        onCanPlay={handleVideoCanPlay}
      />
      {showBlack && <div className="absolute inset-0 bg-black" />}
      {!userActivated && !showBlack && (
        <button
          type="button"
          onClick={handleTapToStart}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20 text-white transition-opacity hover:bg-black/10"
        >
          <span className="rounded border border-white/60 bg-white/20 px-8 py-4 font-sans text-xl backdrop-blur-sm">Tap to start</span>
        </button>
      )}
      <video
        ref={cameraRef}
        className="absolute left-0 top-0 h-[240px] w-[320px] opacity-0 pointer-events-none"
        muted
        playsInline
      />
      {cameraError && (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 text-center text-sm text-amber-400">
          {cameraError} — kill switch still works
        </div>
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

  return <ExhibitDeviceClient deviceId={deviceId} />;
}

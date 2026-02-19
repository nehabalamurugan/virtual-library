'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface AudioPlayerProps {
  src: string
  visitorName: string
}

export function AudioPlayer({ src, visitorName }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasError, setHasError] = useState(false)
  const rafRef = useRef<number>(0)

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      if (isPlaying) {
        rafRef.current = requestAnimationFrame(updateProgress)
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, updateProgress])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(() => setHasError(true))
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = progressRef.current
    const audio = audioRef.current
    if (!el || !audio || !duration) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const fraction = x / rect.width
    audio.currentTime = fraction * duration
    setCurrentTime(audio.currentTime)
  }, [duration])

  const formatTime = (t: number) => {
    if (!t || !isFinite(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (hasError) return null

  return (
    <div className="flex flex-col gap-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setHasError(true)}
      />

      {/* Label */}
      <div className="flex items-center gap-2">
        {/* Small waveform icon - hand drawn */}
        <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
          <line x1="2" y1="5" x2="2" y2="9" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="5.5" y1="3" x2="5.5" y2="11" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="1" x2="9" y2="13" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12.5" y1="4" x2="12.5" y2="10" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="5.5" x2="16" y2="8.5" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="font-sans text-sm text-muted-foreground">
          listen to {visitorName} tell their story
        </span>
      </div>

      {/* Player */}
      <div className="flex items-center gap-3">
        {/* Play / Pause button */}
        <button
          onClick={togglePlay}
          className="flex size-10 flex-shrink-0 items-center justify-center border-2 border-foreground bg-background transition-all hover:bg-foreground hover:text-primary-foreground"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? (
            /* Pause icon - two vertical lines */
            <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
              <line x1="4" y1="2" x2="4" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="10" y1="2" x2="10" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            /* Play icon - triangle */
            <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
              <path d="M2 1 L13 8 L2 15 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Progress bar */}
        <div className="flex flex-1 flex-col gap-1">
          <div
            ref={progressRef}
            className="relative h-2 w-full cursor-pointer"
            onClick={handleProgressClick}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Audio progress"
          >
            {/* Track */}
            <div className="absolute inset-0 top-1/2 h-[2px] -translate-y-1/2 bg-foreground/15" />
            {/* Filled */}
            <div
              className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-foreground transition-[width] duration-75"
              style={{ width: `${progress}%` }}
            />
            {/* Playhead dot */}
            <div
              className="absolute top-1/2 size-2.5 -translate-y-1/2 border border-foreground bg-foreground transition-[left] duration-75"
              style={{
                left: `calc(${progress}% - 5px)`,
                borderRadius: '1px',
              }}
            />
          </div>

          {/* Time labels */}
          <div className="flex justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AddRecommendationPayload } from '@/lib/books'

const QUESTION_ONE = 'Tell me about a time in your life when a book meant the most to you.'
const QUESTION_TWO = 'What is the name of the book?'

/** Pre-recorded audio files for exhibit. Place in public/audio/ */
const INTRO_AUDIO = '/audio/exhibit-into.mp3'
const QUESTION_1_AUDIO = '/audio/exhibit-question1.mp3'
const QUESTION_2_AUDIO = '/audio/exhibit-question2.mp3'
const OUTRO_AUDIO = '/audio/exhibit-outro.mp3'

const INTRO_WAIT_MS = 5_000
const Q1_RECORDING_MS = 60_000
const Q2_RECORDING_MS = 30_000
const BETWEEN_QUESTIONS_MS = 3_000
const PRE_RECORD_DELAY_MS = 1_500
const AUTO_THRESHOLD = 0.06
const AUTO_HOLD_MS = 1_000
const AUTO_COOLDOWN_MS = 12_000

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function playAudio(url: string): Promise<void> {
  if (typeof window === 'undefined') return
  const audio = new Audio(url)
  const ended = new Promise<void>((resolve) => {
    audio.addEventListener('ended', () => resolve())
    audio.addEventListener('error', () => resolve())
  })
  try {
    await audio.play()
    await ended
  } catch {
    /* File missing or play failed, continue */
  }
}

async function playQuestionAudio(url: string, fallbackText: string): Promise<void> {
  if (typeof window === 'undefined') return

  const audio = new Audio(url)
  const ended = new Promise<void>((resolve) => {
    audio.addEventListener('ended', () => resolve())
    audio.addEventListener('error', () => resolve())
  })
  try {
    await audio.play()
    await ended
    return
  } catch {
    /* File missing or play failed, fall through to TTS */
  }

  if ('speechSynthesis' in window) {
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(fallbackText)
      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.lang = 'en-US'
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    })
  }
}

function createAndStartRecorder(stream: MediaStream): MediaRecorder {
  const configs: Array<{ create: () => MediaRecorder; start: (r: MediaRecorder) => void }> = [
    { create: () => new MediaRecorder(stream), start: (r) => r.start() },
    { create: () => new MediaRecorder(stream), start: (r) => r.start(1000) },
    { create: () => new MediaRecorder(stream, { mimeType: 'audio/webm' }), start: (r) => r.start(1000) },
    { create: () => new MediaRecorder(stream, { mimeType: 'audio/mp4' }), start: (r) => r.start(1000) },
    { create: () => new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' }), start: (r) => r.start(1000) },
  ]

  for (const { create, start } of configs) {
    try {
      const recorder = create()
      start(recorder)
      return recorder
    } catch {
      continue
    }
  }

  throw new Error('This browser does not support audio recording. Try Chrome or Firefox.')
}

async function recordForDuration(stream: MediaStream, durationMs: number) {
  return new Promise<Blob>((resolve, reject) => {
    const chunks: BlobPart[] = []
    let recorder: MediaRecorder

    try {
      recorder = createAndStartRecorder(stream)
    } catch (e) {
      reject(e)
      return
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onerror = () => reject(new Error('Audio recorder failed.'))
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
    }

    window.setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop()
    }, durationMs)
  })
}

async function transcribeAudio(audioBlob: Blob, label: string) {
  const formData = new FormData()
  formData.append('audio', new File([audioBlob], `${label}.webm`, { type: audioBlob.type || 'audio/webm' }))
  formData.append('label', label)

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || 'Transcription failed')
  }

  const body = (await response.json()) as { transcript?: string }
  return (body.transcript || '').trim()
}

async function extractEntry(q1Transcript: string, q2Transcript: string) {
  const res = await fetch('/api/extract-entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q1Transcript, q2Transcript }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || 'Extraction failed')
  }
  const data = (await res.json()) as { title: string; author: string; story: string }
  return data
}

async function postRecommendation(payload: AddRecommendationPayload) {
  const response = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || 'Could not save interview')
  }
}

export function ExhibitAudioMode() {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState('Ready. Click start when participant sits down.')
  const [lastEntryPreview, setLastEntryPreview] = useState<{ title: string; story: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAutoArmed, setIsAutoArmed] = useState(false)
  const [level, setLevel] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const monitorStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const levelBufferRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const noiseStartRef = useRef<number | null>(null)
  const cooldownUntilRef = useRef<number>(0)

  const stopStream = useCallback(() => {
    if (!streamRef.current) return
    for (const track of streamRef.current.getTracks()) {
      track.stop()
    }
    streamRef.current = null
  }, [])

  const stopMonitoring = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    analyserRef.current = null
    levelBufferRef.current = null
    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (monitorStreamRef.current) {
      for (const track of monitorStreamRef.current.getTracks()) {
        track.stop()
      }
      monitorStreamRef.current = null
    }
    noiseStartRef.current = null
    setLevel(0)
  }, [])

  const runInterviewSession = useCallback(async (providedStream?: MediaStream) => {
    if (isRunning) return

    setIsRunning(true)
    setError(null)
    setStatus(providedStream ? 'Starting interview...' : 'Requesting microphone access...')
    const ownsStream = !providedStream

    try {
      const stream =
        providedStream ??
        (await navigator.mediaDevices.getUserMedia({ audio: true }))
      streamRef.current = stream

      setStatus('Playing intro...')
      await playAudio(INTRO_AUDIO)

      setStatus('Pausing 5 seconds...')
      await wait(INTRO_WAIT_MS)

      setStatus('Asking question 1...')
      await playQuestionAudio(QUESTION_1_AUDIO, QUESTION_ONE)
      await wait(PRE_RECORD_DELAY_MS)

      setStatus('Recording answer 1 (1 min)...')
      let recordStream = stream
      let answerOneAudio: Blob
      try {
        answerOneAudio = await recordForDuration(stream, Q1_RECORDING_MS)
      } catch (recordErr) {
        recordStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (ownsStream) for (const t of stream.getTracks()) t.stop()
        answerOneAudio = await recordForDuration(recordStream, Q1_RECORDING_MS)
      }

      await wait(BETWEEN_QUESTIONS_MS)
      setStatus('Asking question 2...')
      await playQuestionAudio(QUESTION_2_AUDIO, QUESTION_TWO)
      await wait(PRE_RECORD_DELAY_MS)

      setStatus('Recording answer 2 (30 sec)...')
      const answerTwoAudio = await recordForDuration(recordStream, Q2_RECORDING_MS)

      if (recordStream !== stream) for (const t of recordStream.getTracks()) t.stop()

      setStatus('Transcribing answer 1...')
      const answerOneTranscript = await transcribeAudio(answerOneAudio, 'question-one')
      console.log('[Living Library] Q1 transcript:', answerOneTranscript)

      setStatus('Transcribing answer 2...')
      const answerTwoTranscript = await transcribeAudio(answerTwoAudio, 'question-two')
      console.log('[Living Library] Q2 transcript:', answerTwoTranscript)

      setStatus('Extracting book details...')
      const extracted = await extractEntry(answerOneTranscript, answerTwoTranscript)

      const payload: AddRecommendationPayload = {
        title: extracted.title,
        author: extracted.author,
        visitorName: 'Anonymous',
        story: extracted.story,
        dateAdded: new Date().toISOString().slice(0, 10),
        source: 'exhibit_audio',
        q1Transcript: answerOneTranscript,
        q2Transcript: answerTwoTranscript,
      }

      setStatus('Saving to Living Library...')
      await postRecommendation(payload)

      setLastEntryPreview({ title: extracted.title, story: extracted.story })
      setStatus('Playing outro...')
      await playAudio(OUTRO_AUDIO)
      setStatus('Session complete. Ready for next participant.')
    } catch (sessionError) {
      console.error(sessionError)
      setError(sessionError instanceof Error ? sessionError.message : 'Interview session failed.')
      setStatus('Session failed. Check audio permissions and try again.')
    } finally {
      if (ownsStream) {
        stopStream()
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      cooldownUntilRef.current = Date.now() + AUTO_COOLDOWN_MS
      setIsRunning(false)
    }
  }, [isRunning, stopStream])

  const runAutoDetectionLoop = useCallback(() => {
    const analyser = analyserRef.current
    const buffer = levelBufferRef.current
    if (!analyser || !buffer) return

    analyser.getByteTimeDomainData(buffer as Uint8Array<ArrayBuffer>)

    let sumSquares = 0
    for (let i = 0; i < buffer.length; i++) {
      const normalized = (buffer[i] - 128) / 128
      sumSquares += normalized * normalized
    }
    const rms = Math.sqrt(sumSquares / buffer.length)
    setLevel(rms)

    const now = Date.now()
    if (!isRunning && now >= cooldownUntilRef.current) {
      if (rms >= AUTO_THRESHOLD) {
        if (noiseStartRef.current === null) {
          noiseStartRef.current = now
        } else if (now - noiseStartRef.current >= AUTO_HOLD_MS && monitorStreamRef.current) {
          noiseStartRef.current = null
          void runInterviewSession(monitorStreamRef.current)
        }
      } else {
        noiseStartRef.current = null
      }
    }

    animationFrameRef.current = window.requestAnimationFrame(runAutoDetectionLoop)
  }, [isRunning, runInterviewSession])

  const armAutoStart = useCallback(async () => {
    if (isAutoArmed) return
    setError(null)
    setStatus('Arming auto-start microphone monitor...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      monitorStreamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)

      analyserRef.current = analyser
      levelBufferRef.current = new Uint8Array(analyser.fftSize)
      cooldownUntilRef.current = Date.now() + 2_000
      setIsAutoArmed(true)
      setStatus('Auto-start armed. Speaking near the chair will trigger a session.')
      runAutoDetectionLoop()
    } catch (armingError) {
      console.error(armingError)
      setError(armingError instanceof Error ? armingError.message : 'Could not arm auto-start.')
      setStatus('Auto-start arm failed.')
      stopMonitoring()
    }
  }, [isAutoArmed, runAutoDetectionLoop, stopMonitoring])

  const disarmAutoStart = useCallback(() => {
    stopMonitoring()
    setIsAutoArmed(false)
    setStatus('Auto-start disarmed. Click start manually or arm again.')
  }, [stopMonitoring])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code === 'Space' && !isRunning) {
        event.preventDefault()
        void runInterviewSession()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      stopStream()
      stopMonitoring()
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [isRunning, runInterviewSession, stopMonitoring, stopStream])

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-8 py-10 text-neutral-200">
      <section className="w-full max-w-4xl border-2 border-neutral-600 bg-neutral-950/90 p-12">
        <h1 className="font-sans text-4xl font-semibold text-neutral-100 md:text-5xl">
          Living Library Exhibit Audio Mode
        </h1>
        <p className="mt-6 font-sans text-2xl text-neutral-300 md:text-3xl leading-relaxed">
          {status}
        </p>
        {error && (
          <p className="mt-4 font-sans text-xl text-red-400 md:text-2xl">
            {error}
          </p>
        )}
        <div className="mt-10 flex flex-wrap gap-6">
          <button
            onClick={() => void runInterviewSession()}
            disabled={isRunning}
            className="border-2 border-neutral-200 px-8 py-5 font-sans text-xl text-neutral-100 disabled:opacity-40 hover:bg-neutral-800 transition-colors md:text-2xl"
          >
            {isRunning ? 'running...' : 'start session'}
          </button>
          <button
            onClick={() => {
              if (isAutoArmed) {
                disarmAutoStart()
              } else {
                void armAutoStart()
              }
            }}
            disabled={isRunning}
            className="border-2 border-neutral-500 px-8 py-5 font-sans text-xl text-neutral-100 disabled:opacity-40 hover:bg-neutral-800 transition-colors md:text-2xl"
          >
            {isAutoArmed ? 'disarm auto-start' : 'arm auto-start'}
          </button>
        </div>

        <p className="mt-8 font-sans text-lg text-neutral-500 md:text-xl">
          Operator shortcut: press space to start.
        </p>
        {isAutoArmed && (
          <div className="mt-8">
            <p className="mb-3 font-sans text-lg text-neutral-500 md:text-xl">
              Auto level: {(level * 100).toFixed(1)}%
            </p>
            <div className="h-6 w-full bg-neutral-800 rounded">
              <div
                className="h-6 bg-neutral-300 rounded transition-all"
                style={{ width: `${Math.min(100, Math.max(0, level * 300))}%` }}
              />
            </div>
          </div>
        )}

        {lastEntryPreview && (
          <div className="mt-10 border-2 border-neutral-700 p-6 rounded">
            <p className="font-sans text-lg uppercase tracking-wider text-neutral-500 md:text-xl">
              Last saved entry
            </p>
            <p className="mt-4 font-sans text-xl text-neutral-200 md:text-2xl">
              {lastEntryPreview.title}
            </p>
            <p className="mt-3 line-clamp-4 font-sans text-lg text-neutral-400 md:text-xl leading-relaxed">
              {lastEntryPreview.story}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

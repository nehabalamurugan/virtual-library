'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AddRecommendationPayload } from '@/lib/books'

/** Pre-recorded audio files for exhibit. Place in public/audio/ */
const AUDIO_VERSION = 'v2' // Bump this whenever you replace audio files
/** Intro + first question combined */
const INTRO_AND_QUESTION_AUDIO = `/audio/library_question.mp3?v=${AUDIO_VERSION}`
const OUTRO_AUDIO = `/audio/exhibit-outro.mp3?v=${AUDIO_VERSION}`

const PRE_RECORD_DELAY_MS = 1_500

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

async function extractEntry(transcript: string) {
  const res = await fetch('/api/extract-entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
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

type ExhibitAudioModeProps = {
  /** When true, renders as a section for embedding in the combined control page */
  embedded?: boolean
}

export function ExhibitAudioMode({ embedded }: ExhibitAudioModeProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState('Ready. Click start when participant sits down.')
  const [lastEntryPreview, setLastEntryPreview] = useState<{ title: string; story: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const stopStream = useCallback(() => {
    if (!streamRef.current) return
    for (const track of streamRef.current.getTracks()) {
      track.stop()
    }
    streamRef.current = null
  }, [])

  const finishRecording = useCallback(async (audioBlob: Blob) => {
    setIsRecording(false)
    recorderRef.current = null
    stopStream()

    try {
      setStatus('Playing outro...')
      await playAudio(OUTRO_AUDIO)

      setStatus('Transcribing...')
      const transcript = await transcribeAudio(audioBlob, 'question-one')
      console.log('[Living Library] transcript:', transcript)

      setStatus('Extracting book details...')
      const extracted = await extractEntry(transcript)

      const payload: AddRecommendationPayload = {
        title: extracted.title,
        author: extracted.author,
        visitorName: 'Anonymous',
        story: extracted.story,
        dateAdded: new Date().toISOString().slice(0, 10),
        source: 'exhibit_audio',
        q1Transcript: transcript,
        q2Transcript: '',
      }

      setStatus('Saving to Living Library...')
      await postRecommendation(payload)

      setLastEntryPreview({ title: extracted.title, story: extracted.story })
      setStatus('Recording saved.')
    } catch (sessionError) {
      console.error(sessionError)
      setError(sessionError instanceof Error ? sessionError.message : 'Interview session failed.')
      setStatus('Session failed. Check audio permissions and try again.')
    } finally {
      setIsRunning(false)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [stopStream])

  const finishRecordingRef = useRef(finishRecording)
  finishRecordingRef.current = finishRecording

  const runInterviewSession = useCallback(async () => {
    if (isRunning || isRecording) return

    setIsRunning(true)
    setError(null)
    setStatus('Requesting microphone access...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      setStatus('Playing intro and question...')
      await playAudio(INTRO_AND_QUESTION_AUDIO)
      await wait(PRE_RECORD_DELAY_MS)

      setStatus('Recording... Press play outro when done.')
      chunksRef.current = []
      const recorder = createAndStartRecorder(stream)
      recorderRef.current = recorder
      setIsRecording(true)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        setError('Audio recorder failed.')
        setIsRecording(false)
        recorderRef.current = null
        stopStream()
        setIsRunning(false)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        void finishRecordingRef.current(blob)
      }
    } catch (sessionError) {
      console.error(sessionError)
      setError(sessionError instanceof Error ? sessionError.message : 'Interview session failed.')
      setStatus('Session failed. Check audio permissions and try again.')
      setIsRunning(false)
      stopStream()
    }
  }, [isRunning, isRecording, stopStream])

  const handleOutro = useCallback(async () => {
    const recorder = recorderRef.current
    if (isRecording && recorder && recorder.state !== 'inactive') {
      recorder.stop()
      return
    }
    if (!isRecording) {
      await playAudio(OUTRO_AUDIO)
    }
  }, [isRecording])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code === 'Space' && !isRunning && !isRecording) {
        event.preventDefault()
        void runInterviewSession()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      stopStream()
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [isRunning, isRecording, runInterviewSession, stopStream])

  const content = (
    <section className={`font-control w-full border-2 border-neutral-600 bg-neutral-950/90 p-12 ${embedded ? '' : 'max-w-4xl'}`}>
      <h1 className="text-4xl font-semibold text-neutral-100 md:text-5xl">
        Audio Interview
      </h1>
      <p className="mt-4 text-lg text-neutral-500 md:text-xl">
        <strong>Play intro</strong> plays the intro + question, then starts recording. <strong>Play outro</strong> stops recording, plays the thank-you clip, transcribes, and saves to the library. <strong>Play all</strong> plays intro → outro in full (no recording).
      </p>
      <p className="mt-6 text-2xl text-neutral-300 md:text-3xl leading-relaxed">
        {status}
      </p>
      {error && (
        <p className="mt-4 text-xl text-red-400 md:text-2xl">
          {error}
        </p>
      )}
      <div className="mt-10 flex flex-wrap gap-6">
        <button
          onClick={() => void runInterviewSession()}
          disabled={isRunning || isRecording}
          className="border-2 border-neutral-200 px-8 py-5 text-xl text-neutral-100 disabled:opacity-40 hover:bg-neutral-800 transition-colors md:text-2xl"
        >
          {isRecording ? 'recording...' : isRunning ? 'running...' : 'play intro'}
        </button>
        <button
          onClick={() => void handleOutro()}
          disabled={isRunning && !isRecording}
          className="border-2 border-neutral-500 px-8 py-5 text-xl text-neutral-100 hover:bg-neutral-800 transition-colors md:text-2xl disabled:opacity-40"
        >
          play outro
        </button>
        <button
          onClick={async () => {
            await playAudio(INTRO_AND_QUESTION_AUDIO)
            await playAudio(OUTRO_AUDIO)
          }}
          disabled={isRunning || isRecording}
          className="border-2 border-neutral-500 px-8 py-5 text-xl text-neutral-100 disabled:opacity-40 hover:bg-neutral-800 transition-colors md:text-2xl"
        >
          play all
        </button>
      </div>

      <p className="mt-8 text-lg text-neutral-500 md:text-xl">
        Operator shortcut: press space to start (intro + record).
      </p>

      {lastEntryPreview && (
        <div className="mt-10 border-2 border-neutral-700 p-6 rounded">
          <p className="text-lg uppercase tracking-wider text-neutral-500 md:text-xl">
            Last saved entry
          </p>
          <p className="mt-4 text-xl text-neutral-200 md:text-2xl">
            {lastEntryPreview.title}
          </p>
          <p className="mt-3 line-clamp-4 text-lg text-neutral-400 md:text-xl leading-relaxed">
            {lastEntryPreview.story}
          </p>
        </div>
      )}
      </section>
  )

  if (embedded) {
    return content
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-8 py-10 text-neutral-200">
      {content}
    </main>
  )
}

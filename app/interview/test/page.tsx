'use client'

import { useCallback, useRef, useState } from 'react'

function createAndStartRecorder(stream: MediaStream): MediaRecorder {
  const configs: Array<{ create: () => MediaRecorder; start: (r: MediaRecorder) => void }> = [
    { create: () => new MediaRecorder(stream), start: (r) => r.start() },
    { create: () => new MediaRecorder(stream), start: (r) => r.start(1000) },
    { create: () => new MediaRecorder(stream, { mimeType: 'audio/webm' }), start: (r) => r.start(1000) },
    { create: () => new MediaRecorder(stream, { mimeType: 'audio/mp4' }), start: (r) => r.start(1000) },
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

export default function AudioTestPage() {
  const [status, setStatus] = useState('Click Record to capture 10 seconds of audio.')
  const [transcript, setTranscript] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [hasAudio, setHasAudio] = useState(false)
  const audioBlobRef = useRef<Blob | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  const record = useCallback(async () => {
    setError(null)
    setTranscript(null)
    setHasAudio(false)
    setStatus('Requesting microphone...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = createAndStartRecorder(stream)
      recorderRef.current = recorder

      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      await new Promise<void>((resolve, reject) => {
        recorder.onstop = () => resolve()
        recorder.onerror = () => reject(new Error('Recording failed'))
        setTimeout(() => {
          if (recorder.state !== 'inactive') recorder.stop()
        }, 10_000)
      })

      audioBlobRef.current = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
      setStatus(`Recorded ${(audioBlobRef.current.size / 1024).toFixed(1)} KB. Click Transcribe.`)
      setHasAudio(true)
      setIsRecording(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recording failed')
      setStatus('Recording failed.')
      setIsRecording(false)
    } finally {
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop()
        streamRef.current = null
      }
      recorderRef.current = null
    }
  }, [])

  const startRecording = useCallback(() => {
    setIsRecording(true)
    void record()
  }, [record])

  const transcribe = useCallback(async () => {
    const blob = audioBlobRef.current
    if (!blob) {
      setError('Record first.')
      return
    }

    setError(null)
    setIsTranscribing(true)
    setStatus('Transcribing...')

    try {
      const formData = new FormData()
      formData.append('audio', new File([blob], 'test.webm', { type: blob.type || 'audio/webm' }))
      formData.append('label', 'test')

      const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const data = (await res.json()) as { transcript?: string; error?: string }

      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed')
      }

      setTranscript(data.transcript || '')
      setStatus('Done.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transcription failed')
      setStatus('Transcription failed.')
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-8 text-neutral-200">
      <h1 className="font-sans text-2xl font-semibold">Audio Recording + Transcription Test</h1>
      <p className="font-sans text-neutral-400">{status}</p>
      {error && <p className="font-sans text-red-400">{error}</p>}
      {transcript && (
        <div className="w-full max-w-lg rounded border border-neutral-700 bg-neutral-900 p-4">
          <p className="font-sans text-sm text-neutral-500">Transcript:</p>
          <p className="mt-2 font-sans text-lg">{transcript}</p>
        </div>
      )}
      <div className="flex gap-4">
        <button
          onClick={startRecording}
          disabled={isRecording || isTranscribing}
          className="rounded border border-neutral-500 bg-neutral-800 px-6 py-3 font-sans text-lg disabled:opacity-50"
        >
          {isRecording ? 'Recording 10s...' : 'Record'}
        </button>
        <button
          onClick={() => void transcribe()}
          disabled={isTranscribing || !hasAudio}
          className="rounded border border-neutral-500 bg-neutral-800 px-6 py-3 font-sans text-lg disabled:opacity-50"
        >
          {isTranscribing ? 'Transcribing...' : 'Transcribe'}
        </button>
      </div>
      <a href="/interview" className="font-sans text-sm text-neutral-500 hover:underline">
        Back to exhibit
      </a>
    </main>
  )
}

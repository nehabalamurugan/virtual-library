import { NextResponse } from 'next/server'
import { appendToExhibitLog } from '@/lib/exhibit-log'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured.' },
      { status: 500 }
    )
  }

  const incoming = await request.formData()
  const audio = incoming.get('audio')
  const label = (incoming.get('label') as string) || 'unknown'
  if (!(audio instanceof File)) {
    return NextResponse.json(
      { error: 'Expected an audio file in form field "audio".' },
      { status: 400 }
    )
  }

  const body = new FormData()
  body.append('model', 'whisper-1')
  body.append('file', audio, audio.name || 'answer.webm')

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Whisper transcription failed:', errorText)
      return NextResponse.json({ error: 'Transcription failed' }, { status: 502 })
    }

    const data = (await response.json()) as { text?: string }
    const transcript = (data.text ?? '').trim()
    console.log('[Living Library] Whisper transcript:', transcript)
    appendToExhibitLog({ type: 'transcription', label, transcript })
    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript returned from transcription service.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error('Transcription request failed:', error)
    return NextResponse.json({ error: 'Transcription request failed' }, { status: 500 })
  }
}

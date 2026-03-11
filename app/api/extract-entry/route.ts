import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are extracting structured data from an interview about books.

The interviewee answered a single question combining intro and: "Tell me about a time in your life when a book meant the most to you." Their response typically includes their story/narrative and often mentions the book title and author.

Extract and return JSON with exactly these fields:
- title: the book title (string). Use "Unknown" only if impossible to determine.
- author: the author's name if mentioned (string). Use "Unknown" if not mentioned.
- story: the narrative, cleaned up for readability (string). Preserve their voice and meaning.`

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured.' },
      { status: 500 }
    )
  }

  let body: { transcript?: string; q1Transcript?: string; q2Transcript?: string }
  try {
    body = (await request.json()) as { transcript?: string; q1Transcript?: string; q2Transcript?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const transcript = (body.transcript ?? body.q1Transcript ?? '').trim()
  const q2 = (body.q2Transcript ?? '').trim()

  if (!transcript && !q2) {
    return NextResponse.json(
      { error: 'transcript (or q1Transcript) is required.' },
      { status: 400 }
    )
  }

  const userContent = transcript
    ? q2
      ? `Transcript (story): ${transcript}\n\nBook name (if separate): ${q2}`
      : `Transcript: ${transcript}`
    : `Book name: ${q2}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI extract-entry failed:', errText)
      return NextResponse.json({ error: 'Extraction failed' }, { status: 502 })
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No extraction result' }, { status: 502 })
    }

    const parsed = JSON.parse(content) as { title?: string; author?: string; story?: string }
    const result = {
      title: String(parsed.title ?? 'Unknown').trim() || 'Unknown',
      author: String(parsed.author ?? 'Unknown').trim() || 'Unknown',
      story: String(parsed.story ?? '').trim() || transcript || 'No story captured.',
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Extract-entry request failed:', error)
    return NextResponse.json({ error: 'Extraction request failed' }, { status: 500 })
  }
}

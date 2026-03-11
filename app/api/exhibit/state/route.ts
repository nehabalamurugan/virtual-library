import { NextResponse } from 'next/server'
import { getExhibitMode, setExhibitMode } from '@/lib/exhibit-state'

export async function GET() {
  const mode = await getExhibitMode()
  return NextResponse.json({ mode })
}

export async function POST(request: Request) {
  let body: { mode?: string }
  try {
    body = (await request.json()) as { mode?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const mode = body.mode
  if (mode !== 'playing' && mode !== 'killed') {
    return NextResponse.json({ error: 'mode must be "playing" or "killed"' }, { status: 400 })
  }
  await setExhibitMode(mode)
  return NextResponse.json({ mode })
}

import { NextResponse } from 'next/server'
import { getExhibitMode, setExhibitMode, getDeviceMode, setDeviceMode } from '@/lib/exhibit-state'

const DEVICE_IDS = [1, 2, 3, 4]

export async function GET() {
  const [mode, ...deviceModeValues] = await Promise.all([
    getExhibitMode(),
    ...DEVICE_IDS.map((id) => getDeviceMode(id)),
  ])
  const devices = Object.fromEntries(DEVICE_IDS.map((id, i) => [id, deviceModeValues[i]]))
  return NextResponse.json({ mode, devices })
}

export async function POST(request: Request) {
  let body: { mode?: string; device?: number }
  try {
    body = (await request.json()) as { mode?: string; device?: number }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const mode = body.mode
  if (mode !== 'playing' && mode !== 'killed') {
    return NextResponse.json({ error: 'mode must be "playing" or "killed"' }, { status: 400 })
  }

  if (body.device !== undefined) {
    const deviceId = body.device
    if (!Number.isInteger(deviceId) || deviceId < 1 || deviceId > 4) {
      return NextResponse.json({ error: 'device must be 1–4' }, { status: 400 })
    }
    await setDeviceMode(deviceId, mode)
    return NextResponse.json({ mode, device: deviceId })
  }

  await setExhibitMode(mode)
  return NextResponse.json({ mode })
}

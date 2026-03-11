import { sql } from '@vercel/postgres'
import { databaseConfigured } from '@/lib/db'

let fallbackMode: 'playing' | 'killed' = 'playing'
const fallbackDeviceModes: Record<number, 'playing' | 'killed'> = {}

export type ExhibitMode = 'playing' | 'killed'

export async function getExhibitMode(): Promise<ExhibitMode> {
  if (!databaseConfigured()) {
    return fallbackMode
  }
  try {
    const result = await sql<{ value: string }>`
      SELECT value FROM exhibit_state WHERE key = 'mode' LIMIT 1
    `
    const value = result.rows[0]?.value
    if (value === 'killed' || value === 'playing') return value
    return 'playing'
  } catch {
    return fallbackMode
  }
}

export async function setExhibitMode(mode: ExhibitMode): Promise<void> {
  fallbackMode = mode
  if (!databaseConfigured()) return
  try {
    await sql`
      INSERT INTO exhibit_state (key, value) VALUES ('mode', ${mode})
      ON CONFLICT (key) DO UPDATE SET value = ${mode}
    `
  } catch (err) {
    console.error('Failed to set exhibit mode:', err)
  }
}

export async function getDeviceMode(deviceId: number): Promise<ExhibitMode> {
  if (!databaseConfigured()) {
    return fallbackDeviceModes[deviceId] ?? 'playing'
  }
  try {
    const key = `device_${deviceId}`
    const result = await sql<{ value: string }>`
      SELECT value FROM exhibit_state WHERE key = ${key} LIMIT 1
    `
    const value = result.rows[0]?.value
    if (value === 'killed' || value === 'playing') return value
    return 'playing'
  } catch {
    return fallbackDeviceModes[deviceId] ?? 'playing'
  }
}

export async function setDeviceMode(deviceId: number, mode: ExhibitMode): Promise<void> {
  fallbackDeviceModes[deviceId] = mode
  if (!databaseConfigured()) return
  try {
    const key = `device_${deviceId}`
    await sql`
      INSERT INTO exhibit_state (key, value) VALUES (${key}, ${mode})
      ON CONFLICT (key) DO UPDATE SET value = ${mode}
    `
  } catch (err) {
    console.error('Failed to set device mode:', err)
  }
}

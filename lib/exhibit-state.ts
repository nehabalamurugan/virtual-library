import { sql } from '@vercel/postgres'
import { databaseConfigured } from '@/lib/db'

let fallbackMode: 'playing' | 'killed' = 'playing'

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

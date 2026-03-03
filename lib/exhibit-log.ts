import { appendFileSync } from 'fs'
import { join } from 'path'

const LOG_FILE = join(process.cwd(), 'exhibit-local.log')

export function appendToExhibitLog(entry: Record<string, unknown>) {
  try {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry,
    }) + '\n'
    appendFileSync(LOG_FILE, line)
  } catch (err) {
    console.error('[Living Library] Failed to write exhibit log:', err)
  }
}

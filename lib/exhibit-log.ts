import { appendFileSync } from 'fs'
import { join } from 'path'

const LOG_FILE = join(process.cwd(), 'exhibit-local.log')

export function appendToExhibitLog(entry: Record<string, unknown>) {
  if (process.env.VERCEL) return
  try {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry,
    }) + '\n'
    appendFileSync(LOG_FILE, line)
  } catch {
    /* Ignore on read-only filesystem */
  }
}

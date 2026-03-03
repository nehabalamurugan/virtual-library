import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { AddRecommendationPayload, Book, BookSize } from '@/lib/books'

const FILE = join(process.cwd(), 'local-entries.json')

const BOOK_SIZES: BookSize[] = ['small', 'medium', 'large', 'tall', 'wide']
const ROTATIONS = [-1.8, -1.2, -0.9, -0.5, -0.3, 0.3, 0.4, 0.6, 0.7, 0.8, 1.1, 1.3, 1.5]

function hashString(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function payloadToBook(payload: AddRecommendationPayload, id: string): Book {
  const hash = hashString(`${payload.title}|${payload.author}`)
  return {
    id,
    title: payload.title.trim(),
    author: payload.author.trim() || 'Unknown',
    rotation: ROTATIONS[hash % ROTATIONS.length],
    size: BOOK_SIZES[hash % BOOK_SIZES.length],
    thickness: (hash % 5) + 1,
    recommendations: [
      {
        id: `${id}-1`,
        visitorName: payload.visitorName.trim() || 'Anonymous',
        story: payload.story.trim(),
        dateAdded: payload.dateAdded,
        source: payload.source,
        q1Transcript: payload.q1Transcript,
        q2Transcript: payload.q2Transcript,
      },
    ],
  }
}

export function getLocalEntries(): AddRecommendationPayload[] {
  if (!existsSync(FILE)) return []
  try {
    const raw = readFileSync(FILE, 'utf-8')
    const parsed = JSON.parse(raw) as AddRecommendationPayload[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addLocalEntry(payload: AddRecommendationPayload): void {
  const entries = getLocalEntries()
  entries.push(payload)
  writeFileSync(FILE, JSON.stringify(entries, null, 2))
}

export function localEntriesToBooks(): Book[] {
  const entries = getLocalEntries()
  const books: Book[] = []
  const byKey = new Map<string, Book>()

  function key(title: string, author: string) {
    return `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`
  }

  for (let i = 0; i < entries.length; i++) {
    const p = entries[i]
    const k = key(p.title, p.author || '')
    const existing = byKey.get(k)

    const rec = {
      id: `local-${i}-${existing ? existing.recommendations.length + 1 : 1}`,
      visitorName: p.visitorName.trim() || 'Anonymous',
      story: p.story.trim(),
      dateAdded: p.dateAdded,
      source: p.source,
      q1Transcript: p.q1Transcript,
      q2Transcript: p.q2Transcript,
    }

    if (existing) {
      existing.recommendations.push(rec)
    } else {
      const book = payloadToBook(p, `local-${i}`)
      book.recommendations = [rec]
      byKey.set(k, book)
      books.push(book)
    }
  }

  return books
}

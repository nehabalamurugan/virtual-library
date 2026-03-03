import { sql } from '@vercel/postgres'
import type { AddRecommendationPayload, Book, BookSize, Recommendation } from '@/lib/books'

const BOOK_SIZES: BookSize[] = ['small', 'medium', 'large', 'tall', 'wide']
const ROTATIONS = [-1.8, -1.2, -0.9, -0.5, -0.3, 0.3, 0.4, 0.6, 0.7, 0.8, 1.1, 1.3, 1.5]

interface BookRecommendationRow {
  book_id: string | number
  title: string
  author: string
  rotation: number
  size: BookSize
  thickness: number
  rec_id: string | number | null
  visitor_name: string | null
  story: string | null
  date_added: string | Date | null
  source: 'manual_form' | 'exhibit_audio' | null
  q1_transcript: string | null
  q2_transcript: string | null
  audio_file: string | null
}

function hashString(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function pickBookStyle(seed: string): { rotation: number; size: BookSize; thickness: number } {
  const hash = hashString(seed)
  return {
    rotation: ROTATIONS[hash % ROTATIONS.length],
    size: BOOK_SIZES[hash % BOOK_SIZES.length],
    thickness: (hash % 5) + 1,
  }
}

function normalizeDate(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 10)
  const maybeDate = new Date(value)
  if (Number.isNaN(maybeDate.getTime())) return new Date().toISOString().slice(0, 10)
  return maybeDate.toISOString().slice(0, 10)
}

export function databaseConfigured() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_PRISMA_URL
  )
}

export async function getBooksFromDatabase(): Promise<Book[]> {
  const result = await sql<BookRecommendationRow>`
    SELECT
      b.id AS book_id,
      b.title,
      b.author,
      b.rotation,
      b.size,
      b.thickness,
      r.id AS rec_id,
      r.visitor_name,
      r.story,
      r.date_added,
      r.source,
      r.q1_transcript,
      r.q2_transcript,
      r.audio_file
    FROM books b
    LEFT JOIN recommendations r ON r.book_id = b.id
    ORDER BY b.created_at ASC, r.created_at ASC
  `

  const booksById = new Map<string, Book>()
  for (const row of result.rows) {
    const bookId = String(row.book_id)
    const book = booksById.get(bookId)
    if (!book) {
      booksById.set(bookId, {
        id: bookId,
        title: row.title,
        author: row.author,
        rotation: Number(row.rotation),
        size: row.size,
        thickness: Number(row.thickness),
        recommendations: [],
      })
    }

    if (row.rec_id && row.visitor_name && row.story && row.date_added) {
      const recommendation: Recommendation = {
        id: String(row.rec_id),
        visitorName: row.visitor_name,
        story: row.story,
        dateAdded: new Date(row.date_added).toISOString().slice(0, 10),
        source: row.source ?? 'manual_form',
        q1Transcript: row.q1_transcript ?? undefined,
        q2Transcript: row.q2_transcript ?? undefined,
        audioFile: row.audio_file ?? undefined,
      }
      booksById.get(bookId)!.recommendations.push(recommendation)
    }
  }

  return Array.from(booksById.values())
}

export async function addRecommendationToDatabase(payload: AddRecommendationPayload): Promise<void> {
  const title = payload.title.trim()
  const author = payload.author.trim() || 'Unknown'
  const visitorName = payload.visitorName.trim() || 'Anonymous'
  const story = payload.story.trim()
  const source = payload.source ?? 'manual_form'
  const dateAdded = normalizeDate(payload.dateAdded)

  if (!title || !story) {
    throw new Error('Missing required fields: title and story')
  }

  const existingBook = await sql<{ id: string | number }>`
    SELECT id FROM books
    WHERE lower(title) = lower(${title}) AND lower(author) = lower(${author})
    LIMIT 1
  `

  let bookId: string | number
  if (existingBook.rows.length > 0) {
    bookId = existingBook.rows[0].id
  } else {
    const style = pickBookStyle(`${title}|${author}`)
    const insertedBook = await sql<{ id: string | number }>`
      INSERT INTO books (title, author, rotation, size, thickness)
      VALUES (${title}, ${author}, ${style.rotation}, ${style.size}, ${style.thickness})
      RETURNING id
    `
    bookId = insertedBook.rows[0].id
  }

  await sql`
    INSERT INTO recommendations (
      book_id,
      visitor_name,
      story,
      date_added,
      source,
      q1_transcript,
      q2_transcript
    )
    VALUES (
      ${bookId},
      ${visitorName},
      ${story},
      ${dateAdded},
      ${source},
      ${payload.q1Transcript ?? null},
      ${payload.q2Transcript ?? null}
    )
  `
}

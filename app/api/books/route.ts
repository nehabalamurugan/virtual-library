import { NextResponse } from 'next/server'
import { initialBooks } from '@/lib/books'
import { appendToExhibitLog } from '@/lib/exhibit-log'
import { addLocalEntry, localEntriesToBooks } from '@/lib/local-entries'
import type { AddRecommendationPayload, Book } from '@/lib/books'
import {
  addRecommendationToDatabase,
  databaseConfigured,
  getBooksFromDatabase,
} from '@/lib/db'

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function mergeWithSeedBooks(databaseBooks: Book[]) {
  const merged = initialBooks.map((book) => ({
    ...book,
    recommendations: [...book.recommendations],
  }))

  for (const databaseBook of databaseBooks) {
    const existing = merged.find(
      (book) =>
        normalize(book.title) === normalize(databaseBook.title) &&
        normalize(book.author) === normalize(databaseBook.author)
    )

    if (!existing) {
      merged.push(databaseBook)
      continue
    }

    for (const recommendation of databaseBook.recommendations) {
      const existsBySignature = existing.recommendations.some(
        (seedRec) =>
          seedRec.story === recommendation.story &&
          seedRec.visitorName === recommendation.visitorName &&
          seedRec.dateAdded === recommendation.dateAdded
      )
      if (!existsBySignature) {
        existing.recommendations.push(recommendation)
      }
    }
  }

  return merged
}

/**
 * GET /api/books
 * Returns the seed list of books. Use this as the backend for the library.
 * For persistent storage (e.g. user-submitted books), add Vercel KV or Vercel Postgres.
 */
export async function GET() {
  if (!databaseConfigured()) {
    const localBooks = localEntriesToBooks()
    return NextResponse.json(mergeWithSeedBooks(localBooks))
  }

  try {
    const books = await getBooksFromDatabase()
    return NextResponse.json(mergeWithSeedBooks(books))
  } catch (error) {
    console.error('Failed to fetch books from database:', error)
    return NextResponse.json(initialBooks)
  }
}

export async function POST(request: Request) {
  let payload: AddRecommendationPayload

  try {
    payload = (await request.json()) as AddRecommendationPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!payload?.title?.trim() || !payload?.story?.trim()) {
    return NextResponse.json(
      { error: 'Missing required fields: title and story' },
      { status: 400 }
    )
  }

  if (!databaseConfigured()) {
    console.log('[Living Library] No DB configured – saving to local-entries.json:', payload)
    appendToExhibitLog({ type: 'entry', payload })
    addLocalEntry(payload)
    const localBooks = localEntriesToBooks()
    return NextResponse.json({ ok: true, books: mergeWithSeedBooks(localBooks) }, { status: 201 })
  }

  try {
    await addRecommendationToDatabase(payload)
    const books = await getBooksFromDatabase()
    return NextResponse.json({ ok: true, books: mergeWithSeedBooks(books) }, { status: 201 })
  } catch (error) {
    console.error('Failed to save recommendation:', error)
    return NextResponse.json({ error: 'Failed to save recommendation' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { initialBooks } from '@/lib/books'

/**
 * GET /api/books
 * Returns the seed list of books. Use this as the backend for the library.
 * For persistent storage (e.g. user-submitted books), add Vercel KV or Vercel Postgres.
 */
export async function GET() {
  return NextResponse.json(initialBooks)
}

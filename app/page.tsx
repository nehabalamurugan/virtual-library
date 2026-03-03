'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { initialBooks } from '@/lib/books'
import type { Book, AddRecommendationPayload } from '@/lib/books'
import { BookCard } from '@/components/book-spine'
import { BookDetail } from '@/components/book-detail'
import { InkMarks } from '@/components/dust-particles'
import { AddBookDialog } from '@/components/add-book-dialog'

const CANVAS_SIZE = 6000

function seededPosition(id: string, index: number, total: number) {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  h = Math.abs(h)

  // distribute books in a loose organic grid—wider than tall for endless scroll both ways
  const cols = Math.max(4, Math.ceil(Math.sqrt(total * 2)))
  const row = Math.floor(index / cols)
  const col = index % cols

  const spacingX = 260
  const spacingY = 320
  const gridWidth = cols * spacingX
  const gridHeight = Math.ceil(total / cols) * spacingY

  const baseX = CANVAS_SIZE / 2 - gridWidth / 2 + col * spacingX
  const baseY = CANVAS_SIZE / 2 - gridHeight / 2 + row * spacingY + 200

  // add subtle randomness so it doesn't look like a perfect grid
  const offsetX = ((h % 40) - 20)
  const offsetY = (((h >> 4) % 30) - 15)

  return { x: baseX + offsetX, y: baseY + offsetY }
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)
  const [booksError, setBooksError] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })

  // center the viewport on mount
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollLeft = CANVAS_SIZE / 2 - el.clientWidth / 2
    el.scrollTop = CANVAS_SIZE / 2 - el.clientHeight / 2 - 60
  }, [])

  const fetchBooks = useCallback(async () => {
    try {
      const response = await fetch('/api/books', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch books')
      const data = (await response.json()) as Book[]
      if (Array.isArray(data)) {
        setBooks(data)
      }
      setBooksError(null)
    } catch (error) {
      console.error(error)
      setBooksError('Unable to sync with the archive. Showing local entries.')
    } finally {
      setIsLoadingBooks(false)
    }
  }, [])

  useEffect(() => {
    void fetchBooks()
  }, [fetchBooks])

  const handleAddRecommendation = useCallback(async (payload: AddRecommendationPayload) => {
    const response = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(body.error || 'Failed to save story')
    }

    const body = (await response.json()) as { books?: Book[] }
    if (Array.isArray(body.books)) {
      setBooks(body.books)
      setBooksError(null)
      return
    }

    await fetchBooks()
  }, [fetchBooks])

  const handleSelectBook = useCallback((book: Book) => {
    if (!isDragging) setSelectedBook(book)
  }, [isDragging])

  const handleCloseDetail = useCallback(() => {
    setSelectedBook(null)
  }, [])

  // drag to pan
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // don't start drag if clicking on a book or dialog
    if ((e.target as HTMLElement).closest('button, [role="dialog"], [data-radix-popper-content-wrapper]')) return
    const el = containerRef.current
    if (!el) return
    setIsDragging(false)
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    }
    el.setPointerCapture(e.pointerId)
    el.style.cursor = 'grabbing'
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const el = containerRef.current
    if (!el || !el.hasPointerCapture(e.pointerId)) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setIsDragging(true)
    el.scrollLeft = dragStart.current.scrollLeft - dx
    el.scrollTop = dragStart.current.scrollTop - dy
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const el = containerRef.current
    if (!el) return
    if (el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }
    el.style.cursor = 'grab'
    // reset drag flag after a tick so click handlers can check it
    setTimeout(() => setIsDragging(false), 10)
  }, [])

  return (
    <div className="paper-texture relative h-screen w-screen overflow-hidden">
      <InkMarks />

      {/* Fixed header overlay */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex flex-col items-center gap-4 px-6 pt-10 pb-6 text-center">
        <div
          className="pointer-events-auto flex max-w-lg flex-col items-center gap-4 bg-background/80 px-6 py-5 backdrop-blur-sm"
          style={{ border: '2px solid #0a0a0a' }}
        >
          <h1 className="font-serif text-xl leading-snug tracking-wide text-foreground md:text-2xl lg:text-3xl text-balance italic">
            Tell me about a time in your life when a book you read meant a lot to you.
          </h1>
          <div className="sharpie-line w-12" />
          <div className="flex items-center gap-4">
            <p className="font-sans text-base text-muted-foreground">
              {books.reduce((n, b) => n + b.recommendations.length, 0)} {books.reduce((n, b) => n + b.recommendations.length, 0) === 1 ? 'story' : 'stories'}
              {' · '}
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </p>
            <AddBookDialog onAdd={handleAddRecommendation} />
          </div>
          {booksError && (
            <p className="font-sans text-xs text-red-700">
              {booksError}
            </p>
          )}
          {isLoadingBooks && (
            <p className="font-sans text-xs text-muted-foreground">
              loading archive...
            </p>
          )}
        </div>
        <p className="pointer-events-none font-sans text-sm text-muted-foreground/60">
          drag to explore
        </p>
      </header>

      {/* Infinite canvas */}
      <div
        ref={containerRef}
        className="size-full overflow-auto"
        style={{ cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="relative"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
        >
          {/* Subtle grid dots across the canvas */}
          <svg
            className="absolute inset-0 size-full"
            aria-hidden="true"
          >
            <defs>
              <pattern id="grid-dots" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="0.7" fill="#0a0a0a" opacity="0.06" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dots)" />
          </svg>

          {/* Center crosshair mark */}
          <svg
            className="absolute"
            style={{
              left: CANVAS_SIZE / 2 - 20,
              top: CANVAS_SIZE / 2 - 20,
            }}
            width="40"
            height="40"
            viewBox="0 0 40 40"
            aria-hidden="true"
          >
            <line x1="20" y1="8" x2="20" y2="32" stroke="#0a0a0a" strokeWidth="1" opacity="0.08" />
            <line x1="8" y1="20" x2="32" y2="20" stroke="#0a0a0a" strokeWidth="1" opacity="0.08" />
          </svg>

          {/* Books placed across the canvas */}
          {books.map((book, i) => {
            const pos = seededPosition(book.id, i, books.length)
            return (
              <div
                key={book.id}
                className="absolute"
                style={{ left: pos.x, top: pos.y }}
              >
                <BookCard
                  book={book}
                  index={i}
                  onSelect={handleSelectBook}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Story overlay */}
      <BookDetail book={selectedBook} onClose={handleCloseDetail} />
    </div>
  )
}

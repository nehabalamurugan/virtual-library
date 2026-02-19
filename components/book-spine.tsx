'use client'

import { useMemo } from 'react'
import type { Book, BookSize } from '@/lib/books'
import { bookHasAudio } from '@/lib/books'

interface BookCardProps {
  book: Book
  index: number
  onSelect: (book: Book) => void
}

function getBookDimensions(size: BookSize): { width: number; height: number } {
  switch (size) {
    case 'small':
      return { width: 140, height: 190 }
    case 'medium':
      return { width: 155, height: 220 }
    case 'large':
      return { width: 170, height: 250 }
    case 'tall':
      return { width: 140, height: 270 }
    case 'wide':
      return { width: 190, height: 200 }
  }
}

export function BookCard({ book, index, onSelect }: BookCardProps) {
  const dims = getBookDimensions(book.size)
  const pageEdgeCount = book.thickness + 1

  // Deterministic seed for variation
  const seed = useMemo(() => {
    let h = 0
    for (let i = 0; i < book.id.length; i++) {
      h = (Math.imul(31, h) + book.id.charCodeAt(i)) | 0
    }
    return Math.abs(h)
  }, [book.id])

  const spineX = 14
  const pageEdgeWidth = pageEdgeCount * 2.5

  return (
    <button
      className="group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
      style={{
        width: dims.width,
        height: dims.height,
        animation: `scribble-in 0.4s ease-out ${index * 0.03}s both`,
      }}
      onClick={() => onSelect(book)}
      aria-label={book.recommendations.length === 1
        ? `${book.title} by ${book.author} — story from ${book.recommendations[0].visitorName}`
        : `${book.title} by ${book.author} — ${book.recommendations.length} people recommended`}
    >
      <div
        className="relative size-full transition-all duration-300 ease-out group-hover:-translate-y-1"
        style={{ transform: `rotate(${book.rotation}deg)` }}
      >
        {/* Book shape SVG */}
        <svg
          width={dims.width}
          height={dims.height}
          viewBox={`0 0 ${dims.width} ${dims.height}`}
          className="absolute inset-0"
          aria-hidden="true"
        >
          {/* Page edges - subtle lines peeking out on the right */}
          {Array.from({ length: pageEdgeCount }).map((_, i) => {
            const x = dims.width - 4 - i * 2.5
            return (
              <line
                key={`page-${i}`}
                x1={x}
                y1={8}
                x2={x}
                y2={dims.height - 8}
                stroke="#0a0a0a"
                strokeWidth="0.5"
                opacity={0.06 + i * 0.03}
              />
            )
          })}

          {/* Book body - rectangle with a slightly rounded left (spine) edge */}
          <rect
            x={2}
            y={2}
            width={dims.width - 4 - pageEdgeWidth}
            height={dims.height - 4}
            rx={4}
            ry={1}
            fill="#faf9f7"
            stroke="#0a0a0a"
            strokeWidth="2"
          />

          {/* Spine line */}
          <line
            x1={spineX}
            y1={6}
            x2={spineX}
            y2={dims.height - 6}
            stroke="#0a0a0a"
            strokeWidth="1.2"
            opacity="0.25"
          />

          {/* Audio indicator - small waveform marks in the corner */}
          {bookHasAudio(book) && (
            <g opacity="0.35">
              <line x1={dims.width - 16 - pageEdgeWidth} y1={dims.height - 22} x2={dims.width - 16 - pageEdgeWidth} y2={dims.height - 16} stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
              <line x1={dims.width - 12 - pageEdgeWidth} y1={dims.height - 26} x2={dims.width - 12 - pageEdgeWidth} y2={dims.height - 16} stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
              <line x1={dims.width - 8 - pageEdgeWidth} y1={dims.height - 20} x2={dims.width - 8 - pageEdgeWidth} y2={dims.height - 16} stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          )}

          {/* Subtle horizontal lines at top and bottom of cover, like a hardcover edge */}
          <line
            x1={spineX + 4}
            y1={18 + (seed % 4)}
            x2={dims.width - 14 - pageEdgeWidth}
            y2={18 + (seed % 4)}
            stroke="#0a0a0a"
            strokeWidth="0.7"
            opacity="0.1"
          />
          <line
            x1={spineX + 4}
            y1={dims.height - 18 - (seed % 4)}
            x2={dims.width - 14 - pageEdgeWidth}
            y2={dims.height - 18 - (seed % 4)}
            stroke="#0a0a0a"
            strokeWidth="0.7"
            opacity="0.1"
          />
        </svg>

        {/* Text on the cover */}
        <div
          className="relative flex h-full flex-col justify-between"
          style={{
            padding: `22px ${16 + pageEdgeWidth}px 18px ${spineX + 10}px`,
          }}
        >
          <div className="flex flex-col gap-1.5">
            <h3
              className="font-serif leading-snug tracking-wide text-foreground text-balance"
              style={{ fontSize: dims.height >= 250 ? '14px' : dims.height >= 220 ? '13px' : '12px' }}
            >
              {book.title}
            </h3>
            <p className="font-serif text-[10px] italic text-foreground/40">
              {book.author}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="sharpie-line-thin w-8 opacity-30" />
            <p
              className="font-sans text-foreground/35"
              style={{ fontSize: dims.width >= 170 ? '16px' : '14px' }}
            >
              {book.recommendations.length === 1
                ? book.recommendations[0].visitorName
                : `${book.recommendations.length} people`}
            </p>
          </div>
        </div>

        {/* Hover overlay - peek of the story */}
        <div
          className="pointer-events-none absolute inset-0 flex items-end opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            padding: `22px ${16 + pageEdgeWidth}px 18px ${spineX + 10}px`,
            background:
              'linear-gradient(to top, rgba(250,249,247,0.95) 30%, rgba(250,249,247,0.7) 55%, transparent 80%)',
          }}
        >
          <p className="font-sans text-sm leading-snug text-foreground/50 italic line-clamp-3">
            {'"'}{book.recommendations[0].story.slice(0, 100)}{'..."'}
          </p>
        </div>
      </div>
    </button>
  )
}

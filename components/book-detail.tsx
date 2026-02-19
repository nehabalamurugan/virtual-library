'use client'

import { useEffect, useRef } from 'react'
import type { Book } from '@/lib/books'
import { AudioPlayer } from '@/components/audio-player'

interface BookDetailProps {
  book: Book | null
  onClose: () => void
}

export function BookDetail({ book, onClose }: BookDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (book) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [book, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-500"
        style={{
          backgroundColor: 'rgba(250, 249, 247, 0.92)',
          opacity: book ? 1 : 0,
          pointerEvents: book ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Story Panel */}
      <div
        ref={panelRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        style={{
          opacity: book ? 1 : 0,
          pointerEvents: book ? 'auto' : 'none',
          transition: 'opacity 0.4s ease',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={book ? `Story about ${book.title}` : undefined}
      >
        {book && (
          <div
            className="relative flex w-full max-w-2xl flex-col border-2 border-foreground bg-background p-8 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X - hand drawn style */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex items-center justify-center p-2 text-foreground transition-opacity hover:opacity-60"
              aria-label="Close story"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 4 L20 20" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M20 4 L4 20" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Corner marks */}
            <svg className="absolute -top-1.5 -left-1.5 size-4" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M0 16 L0 0 L16 0" fill="none" stroke="#0a0a0a" strokeWidth="2.5" />
            </svg>
            <svg className="absolute -bottom-1.5 -right-1.5 size-4" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M16 0 L16 16 L0 16" fill="none" stroke="#0a0a0a" strokeWidth="2.5" />
            </svg>

            {/* Book title & author */}
            <div className="mb-6 flex flex-col gap-1">
              <h2 className="font-serif text-2xl tracking-wide text-foreground md:text-3xl text-balance">
                {book.title}
              </h2>
              <p className="font-serif text-sm italic text-muted-foreground">
                {book.author}
              </p>
            </div>

            {/* Hand-drawn divider */}
            <svg width="100%" height="6" className="mb-8" aria-hidden="true">
              <line x1="0" y1="3" x2="100%" y2="3" stroke="#0a0a0a" strokeWidth="2.5" strokeDasharray="none" />
            </svg>

            {/* The story - the heart of it */}
            <div className="mb-8 flex flex-col gap-4">
              <p className="font-sans text-xl leading-relaxed text-foreground md:text-2xl md:leading-relaxed">
                {'"'}{book.story}{'"'}
              </p>
            </div>

            {/* Audio player - if recording exists */}
            {book.audioUrl && (
              <div className="mb-8 border-2 border-foreground/10 p-4">
                <AudioPlayer src={book.audioUrl} visitorName={book.visitorName} />
              </div>
            )}

            {/* Attribution line */}
            <div className="flex items-end justify-between border-t-2 border-foreground pt-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-lg text-foreground">
                  -- {book.visitorName}
                </span>
              </div>
              <span className="font-serif text-xs italic text-muted-foreground">
                {new Date(book.dateAdded).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

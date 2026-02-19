'use client'

import type { Book } from '@/lib/books'
import { BookCard } from './book-spine'

interface BookWallProps {
  books: Book[]
  onSelectBook: (book: Book) => void
}

export function BookWall({ books, onSelectBook }: BookWallProps) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-6 md:gap-8">
      {books.map((book, i) => (
        <BookCard
          key={book.id}
          book={book}
          index={i}
          onSelect={onSelectBook}
        />
      ))}
    </div>
  )
}

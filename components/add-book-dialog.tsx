'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { AddRecommendationPayload } from '@/lib/books'

interface AddBookDialogProps {
  onAdd: (payload: AddRecommendationPayload) => Promise<void> | void
}

export function AddBookDialog({ onAdd }: AddBookDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [story, setStory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function reset() {
    setStep(0)
    setTitle('')
    setAuthor('')
    setVisitorName('')
    setStory('')
    setSubmitError(null)
    setIsSubmitting(false)
  }

  async function handleSubmit() {
    if (!title.trim() || !story.trim() || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onAdd({
        title: title.trim(),
        author: author.trim() || 'Unknown',
        visitorName: visitorName.trim() || 'Anonymous',
        story: story.trim(),
        dateAdded: new Date().toISOString().split('T')[0],
        source: 'manual_form',
      })
      reset()
      setOpen(false)
    } catch {
      setSubmitError('Could not save your story. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <button
          className="group relative border-2 border-foreground bg-background px-6 py-3 font-sans text-xl text-foreground transition-all duration-300 hover:bg-foreground hover:text-background"
          aria-label="Share your story"
        >
          <span>share yours</span>
        </button>
      </DialogTrigger>
      <DialogContent className="border-2 border-foreground bg-background p-0 sm:max-w-lg [&>button]:hidden">
        <div className="flex flex-col p-8 md:p-10">
          {/* Close */}
          <button
            onClick={() => { setOpen(false); reset() }}
            className="absolute top-4 right-4 p-2 text-foreground transition-opacity hover:opacity-60"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 3 L17 17" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
              <path d="M17 3 L3 17" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {step === 0 && (
            <div className="flex flex-col gap-6">
              <p className="font-serif text-xl leading-snug text-foreground md:text-2xl text-balance italic">
                Tell me about a time in your life when a book you read meant a lot to you.
              </p>
              <div className="sharpie-line w-12" />
              <p className="font-sans text-base text-muted-foreground">
                First, what was the book?
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="book-title" className="font-serif text-xs uppercase tracking-widest text-muted-foreground">
                    Title
                  </label>
                  <input
                    id="book-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="the name of the book"
                    className="border-b-2 border-foreground bg-transparent py-2 font-sans text-lg text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="book-author" className="font-serif text-xs uppercase tracking-widest text-muted-foreground">
                    Author
                  </label>
                  <input
                    id="book-author"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="who wrote it"
                    className="border-b-2 border-foreground bg-transparent py-2 font-sans text-lg text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => title.trim() && setStep(1)}
                disabled={!title.trim()}
                className="mt-2 self-start border-2 border-foreground bg-foreground px-6 py-2 font-sans text-lg text-background transition-all duration-300 hover:bg-background hover:text-foreground disabled:opacity-30"
              >
                next
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <p className="font-serif text-xl leading-snug text-foreground md:text-2xl text-balance italic">
                Now tell me the story.
              </p>
              <p className="font-sans text-base text-muted-foreground">
                Why did this book matter? What was happening in your life?
              </p>
              <div className="flex flex-col gap-4">
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="take your time..."
                  className="min-h-[160px] border-2 border-foreground bg-transparent p-4 font-sans text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  autoFocus
                />
                <div className="flex flex-col gap-1">
                  <label htmlFor="visitor-name" className="font-serif text-xs uppercase tracking-widest text-muted-foreground">
                    Your name (or leave blank)
                  </label>
                  <input
                    id="visitor-name"
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="anonymous"
                    className="border-b-2 border-foreground bg-transparent py-2 font-sans text-lg text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="border-2 border-foreground bg-transparent px-4 py-2 font-sans text-lg text-foreground transition-all duration-300 hover:bg-foreground hover:text-background"
                >
                  back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!story.trim() || isSubmitting}
                  className="border-2 border-foreground bg-foreground px-6 py-2 font-sans text-lg text-background transition-all duration-300 hover:bg-background hover:text-foreground disabled:opacity-30"
                >
                  {isSubmitting ? 'saving...' : 'place on the wall'}
                </button>
              </div>
              {submitError && (
                <p className="font-sans text-sm text-red-700">
                  {submitError}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

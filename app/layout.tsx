import type { Metadata, Viewport } from 'next'
import { Caveat, DM_Sans, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'The Library',
  description: 'Tell me about a time in your life when a book you read meant a lot to you.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#faf9f7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${caveat.variable} ${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

import { Metadata, Viewport } from 'next';
import './globals.css'

export const metadata: Metadata = {
  title: 'AcaPadel',
  description: 'Book padel slots instantly',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

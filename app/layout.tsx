import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Protoforge — AI Hardware Project Generator',
  description: 'Generate complete DIY hardware project guides from a single prompt. Free and open-source.',
  keywords: ['hardware', 'DIY', 'maker', 'Arduino', 'PCB', '3D printing', 'AI'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

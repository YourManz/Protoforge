import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Protoforge — AI Hardware Project Generator',
  description: 'Generate complete DIY hardware project guides from a single prompt. Free and open-source.',
  keywords: ['hardware', 'DIY', 'maker', 'Arduino', 'PCB', '3D printing', 'AI'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} font-mono`}>
        {children}
      </body>
    </html>
  )
}

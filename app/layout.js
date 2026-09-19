import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import PageLoader from '@/components/PageLoader'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata = {
  title: 'SKAARVI - B2B Reseller Marketplace',
  description: 'Connect manufacturers with resellers across India. Wide product range, competitive pricing, and seamless ordering.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} font-sans`}>
        <Providers>
          <PageLoader />
          {children}
        </Providers>
      </body>
    </html>
  )
}

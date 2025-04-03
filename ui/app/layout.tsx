import '@/globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'VaValM - Valorant Manager',
  description: 'Just a small PoC for a valorant e-sports manager game which some set of rules.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactNode {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

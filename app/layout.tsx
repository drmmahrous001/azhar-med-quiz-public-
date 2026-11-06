import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { AiStudyAssistant } from '@/components/ai-study-assistant'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import { PageTransition } from '@/components/page-transition'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: {
    default: 'منصة أسئلة طب الأزهر',
    template: '%s · بنك أسئلة جراحة الأزهر',
  },
  description:
    'منصة أسئلة كلية الطب، منظمة حسب السنوات الدراسية والترمات، مع متابعة تقدمك.',
  manifest: '/manifest.json',
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
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fbfb' },
    { media: '(prefers-color-scheme: dark)', color: '#141b20' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh antialiased">
        <ServiceWorkerRegister />
        <SiteHeader />
        <PageTransition>{children}</PageTransition>
        <AiStudyAssistant />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

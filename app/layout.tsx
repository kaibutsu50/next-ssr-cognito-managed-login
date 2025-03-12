import './globals.css'
// eslint-disable-next-line camelcase
import { Noto_Sans_JP } from 'next/font/google'
import clsx from 'clsx'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp'
})

export default function RootLayout ({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={clsx('flex min-h-screen w-full flex-col bg-gray-100', notoSansJP.variable, 'font-sans')}>{children}</body>
    </html>
  )
}

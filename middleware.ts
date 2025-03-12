import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// 常に公開するパス（認証不要でアクセス可能）
const publicPaths = [
  '/api/',
  '/_next/',
  '/img/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/signin',
  '/auth/callback'
]

export async function middleware (request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // 公開パスの場合は認証処理をスキップ
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next()
  }

  try {
    const session = await auth()    
    // 認証セッションがない場合はサインインページにリダイレクト
    if (!session) {
      const signInUrl = new URL('/signin', request.url)
      return NextResponse.redirect(signInUrl)
    }
    return NextResponse.next()
  } catch (error) {
    const signInUrl = new URL('/signin', request.url)
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  // publicPaths に含まれるパスは middleware 関数内でスキップ処理される
  matcher: [
    '/(.*)'
  ]
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getTokens, saveTokens } from '@/lib/token'

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
    // カスタムトークンの取得とチェック
    const tokens = await getTokens()
    if (tokens?.accessToken && tokens?.expiresAt &&
        typeof tokens.expiresAt === 'number' &&
        Date.now() > tokens.expiresAt - 1 * 60 * 1000) {
      try {
        // OpenID Configuration の取得
        const response = await fetch(
          `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/openid-configuration`
        ).then(res => res.json())
        
        // 新しいトークンを要求
        const authHeader = Buffer.from(
          `${process.env.COGNITO_APP_CLIENT_ID}:${process.env.COGNITO_APP_CLIENT_SECRET}`
        ).toString('base64')
        const newTokens = await fetch(response.token_endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authHeader}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: process.env.COGNITO_APP_CLIENT_ID!,
            refresh_token: tokens.refreshToken as string
          })
        }).then(res => res.json())

        if (newTokens.error) {
          throw new Error(newTokens.error)
        }

        // 新しいトークンで更新
        const newExpiresAt = Date.now() + newTokens.expires_in * 1000
        await saveTokens({
          idToken: newTokens.id_token,
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || tokens.refreshToken, // 新しいリフレッシュトークンがない場合は既存のものを保持
          expiresAt: newExpiresAt
        })
      } catch (error) {
        // リフレッシュに失敗した場合はサインインページにリダイレクト
        const signInUrl = new URL('/signin', request.url)
        return NextResponse.redirect(signInUrl)
      }
    }

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

import NextAuth from 'next-auth'
import Cognito from 'next-auth/providers/cognito'
import { saveTokens, getTokens } from '@/lib/token'

/**
 * このファイルには、AuthJSのバグを回避するための一時的な work around が含まれています
 * 問題：トークンリフレッシュ時に新しいトークンがセッションに正しく保存されない
 * https://github.com/nextauthjs/next-auth/issues/7558
 *
 * このプログラムでは、トークンの独自管理を行うことで、この問題を回避しています
 */

// セッションおよびユーザーの拡張型を定義
declare module 'next-auth' {
  interface Session {
    idToken?: string
    accessToken?: string
    expiresAt?: number
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      sub?: string
    }
  }

  interface User {
    sub?: string
    id?: string
  }

  interface JWT {
    idToken?: string
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Cognito({
      clientId: process.env.COGNITO_APP_CLIENT_ID!,
      clientSecret: process.env.COGNITO_APP_CLIENT_SECRET!,
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      authorization: {
        url: process.env.COGNITO_MANAGED_LOGIN_URL ?? '',
        params: {
          scope: 'email openid phone',
          response_type: 'code'
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30日間
  },
  callbacks: {
    // トークン取得時の処理
    async jwt({ token, account }) {      
      // 初回ログイン時にトークンを保存
      if (account) {
/*
        token.idToken = account.id_token
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        // expires_atは秒単位のUNIX時間で提供されるため、ミリ秒に変換
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : undefined
 */
        // 独自Cookieにも保存（AuthJSのバグへの対応）
        await saveTokens({
          idToken: account.id_token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ? account.expires_at * 1000 : undefined
        })
      }

      // カスタムCookieからトークンデータを取得（こちらが最新状態）
      const customTokens = await getTokens()
      
      return token
    },
    // セッション作成時の処理
    async session({ session, token }) {
      // 独自のCookieからトークンデータを取得（優先）
      const customTokens = await getTokens()
      
      // セッションにトークンを追加（独自Cookie優先）
      return {
        ...session,
        idToken: customTokens?.idToken || token.idToken,
        accessToken: customTokens?.accessToken || token.accessToken,
        expiresAt: customTokens?.expiresAt || token.expiresAt,
        user: {
          ...session.user,
          sub: token.sub
        }
      }
    }
  }
})

// サーバーコンポーネントからセッションを取得する関数
export async function getSession() {
  // Auth.jsのセッションを取得
  const session = await auth()
  
  // 独自のCookieからトークンデータを取得（優先）
  const customTokens = await getTokens()
  
  if (!session && !customTokens) {
    return null
  }
  
  return {
    // 独自Cookie優先、ない場合はAuth.jsのセッションを使用
    accessToken: customTokens?.accessToken || session?.accessToken,
    idToken: customTokens?.idToken || session?.idToken,
    profile: session?.user
  }
}

export const signoutUrl = '/api/auth/signout'

import NextAuth from 'next-auth'
import Cognito from 'next-auth/providers/cognito'

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

export const { handlers, auth: getAuthSession, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Cognito({
      clientId: process.env.COGNITO_APP_CLIENT_ID!,
      clientSecret: process.env.COGNITO_APP_CLIENT_SECRET!,
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      
      // シンプルな認可設定
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
    async jwt ({ token, account }) {      
      // 初回ログイン時にトークンを保存
      if (account) {
        token.idToken = account.id_token
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        // expires_atは秒単位のUNIX時間で提供されるため、ミリ秒に変換
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : undefined
      }

      // アクセストークンとリフレッシュトークンが存在し、有効期限が設定されている場合のみリフレッシュを試みる
      if (token.accessToken && token.refreshToken && token.expiresAt &&
          typeof token.expiresAt === 'number' &&
          Date.now() > token.expiresAt - 1 * 60 * 1000) {
        try {
          const response = await fetch(
            `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/openid-configuration`
          ).then(res => res.json())

          const tokens = await fetch(response.token_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: process.env.COGNITO_APP_CLIENT_ID!,
              refresh_token: token.refreshToken as string
            })
          }).then(res => res.json())

          // 新しいトークンで更新
          token.idToken = tokens.id_token
          token.accessToken = tokens.access_token
          // refreshTokenは新しく発行されない場合があるので、既存のものを保持
          if (tokens.refresh_token) {
            token.refreshToken = tokens.refresh_token
          }
          token.expiresAt = Date.now() + tokens.expires_in * 1000
        } catch (error) {
          // エラー時はトークンをクリアしてログアウトを強制
          return {}
        }
      }

      return token
    },
    // セッション作成時の処理
    async session ({ session, token }) {
      // セッションにトークンを追加
      return {
        ...session,
        idToken: token.idToken,
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        user: {
          ...session.user,
          sub: token.sub
        }
      }
    }
  },
  pages: {
    signIn: '/signin', // カスタムサインインページ
    signOut: '/', // サインアウト後のリダイレクト先
    error: '/signin', // エラー時のページ
    newUser: '/' // 新規ユーザー登録時のリダイレクト先
  }
})

// サーバーコンポーネントからセッションを取得する関数
export async function getSession () {
  
  const session = await getAuthSession()
  if (!session) {
    return null
  }

  return {
    accessToken: session.accessToken,
    idToken: session.idToken,
    profile: session.user
  }
}

// 現在のユーザー情報を取得する関数（既存のシステムとの互換性維持のため元の名前に戻す）
export async function auth () {
  try {
    const session = await getAuthSession()

    if (!session) {
      return null
    }

    const result = {
      user: {
        emailVerifiedCognito: true,
        displayName: session.user?.name,
        email: session.user?.email,
        sub: session.user?.sub,
        name: session.user?.name,
        idToken: session.idToken,
        accessToken: session.accessToken,
        expiresAt: session.expiresAt
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

export const signoutUrl = '/api/auth/signout'

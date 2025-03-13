'use server'

import { cookies } from 'next/headers'
import { encrypt, decrypt } from '@/lib/utils/encryption'

// Cookie名の定義
const AUTH_TOKENS_COOKIE_NAME = 'auth-tokens'
const REFRESH_TOKEN_COOKIE_NAME = 'refresh-token'

// トークン関連の型定義
export interface TokenData {
  idToken?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

/**
 * トークンデータをCookieに保存する
 * AuthJSのトークンリフレッシュバグの回避策として使用
 */
export async function saveTokens(tokenData: TokenData) {
  const { refreshToken, ...mainTokens } = tokenData
  
  // メインのトークンデータを保存
  const mainTokenString = JSON.stringify(mainTokens)

  const encryptedMainData = await encrypt(mainTokenString, process.env.AUTH_SECRET!)
  
  // リフレッシュトークンを別のCookieに保存（存在する場合のみ）
  let encryptedRefreshToken: string | undefined
  if (refreshToken) {
    encryptedRefreshToken = await encrypt(refreshToken, process.env.AUTH_SECRET!)
  }
  
  // Next.js 15では cookies() が Promise を返すように変更
  const cookieStore = await cookies()
  
  // メインのトークンをCookieに保存
  cookieStore.set({
    name: AUTH_TOKENS_COOKIE_NAME,
    value: encryptedMainData,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60, // 30日間
    path: '/',
    sameSite: 'lax',
  })

  // リフレッシュトークンを別のCookieに保存（存在する場合のみ）
  if (encryptedRefreshToken) {
    cookieStore.set({
      name: REFRESH_TOKEN_COOKIE_NAME,
      value: encryptedRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30日間
      path: '/',
      sameSite: 'lax',
    })
  }
}

/**
 * Cookieからトークンデータを取得する
 * AuthJSのトークンリフレッシュバグの回避策として使用
 */
export async function getTokens(): Promise<TokenData | null> {
  try {
    // Next.js 15では cookies() が Promise を返すように変更
    const cookieStore = await cookies()
    const mainTokenCookie = cookieStore.get(AUTH_TOKENS_COOKIE_NAME)
    const refreshTokenCookie = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)
    
    if (!mainTokenCookie) return null
    
    // メイントークンデータを復号化
    const decryptedMainData = await decrypt(mainTokenCookie.value, process.env.AUTH_SECRET!)
    const mainTokens = JSON.parse(decryptedMainData)
    
    // リフレッシュトークンがある場合は復号化して結合
    if (refreshTokenCookie) {
      const decryptedRefreshToken = await decrypt(refreshTokenCookie.value, process.env.AUTH_SECRET!)
      return {
        ...mainTokens,
        refreshToken: decryptedRefreshToken
      }
    }
    
    return mainTokens
  } catch (error) {
    return null
  }
}
'use server'

import { cookies } from 'next/headers'
import { encrypt, decrypt } from '@/lib/utils/encryption'

// Cookie名の定義
const TOKEN_COOKIE_NAME = 'auth-tokens'

// トークン関連の型定義
export interface TokenData {
  idToken?: string
  accessToken?: string
  expiresAt?: number
}

/**
 * トークンデータをCookieに保存する
 * AuthJSのトークンリフレッシュバグの回避策として使用
 */
export async function saveTokens(tokenData: TokenData) {
  // トークンデータを暗号化
  const encryptedData = await encrypt(JSON.stringify(tokenData), process.env.AUTH_SECRET!)
  
  // Next.js 15では cookies() が Promise を返すように変更
  const cookieStore = await cookies()
  
  // Cookieに保存
  cookieStore.set({
    name: TOKEN_COOKIE_NAME,
    value: encryptedData,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60, // 30日間
    path: '/',
    sameSite: 'lax',
  })
}

/**
 * Cookieからトークンデータを取得する
 * AuthJSのトークンリフレッシュバグの回避策として使用
 */
export async function getTokens(): Promise<TokenData | null> {
  try {
    // Next.js 15では cookies() が Promise を返すように変更
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME)
    
    if (!tokenCookie) return null
    
    // トークンデータを復号化
    const decryptedData = await decrypt(tokenCookie.value, process.env.AUTH_SECRET!)
    return JSON.parse(decryptedData) as TokenData
  } catch (error) {
    console.error('トークンcookieの読み込み中にエラーが発生しました:', error)
    return null
  }
}
/**
 * 暗号化ユーティリティ関数
 * next-auth/jwtの実装を使用
 */

import { encode, decode } from "next-auth/jwt"

// 固定のソルト値
const SALT = "auth-cookie-encryption"

/**
 * 文字列データを暗号化する
 * @param data 暗号化する文字列
 * @param secret 暗号化キー
 * @returns 暗号化された文字列
 */
export async function encrypt(data: string, secret: string): Promise<string> {
  try {
    return await encode({
      token: { data },
      secret,
      salt: SALT,
    })
  } catch (error) {
    throw error
  }
}

/**
 * 暗号化された文字列を復号化する
 * @param encryptedData 暗号化された文字列
 * @param secret 暗号化キー
 * @returns 復号化された文字列
 */
export async function decrypt(encryptedData: string, secret: string): Promise<string> {
  try {
    const decoded = await decode({
      token: encryptedData,
      secret,
      salt: SALT,
    })
    if (!decoded?.data) throw new Error('復号化されたデータが不正です')
    return decoded.data as string
  } catch (error) {
    throw error
  }
}
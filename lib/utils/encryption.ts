/**
 * 暗号化ユーティリティ関数
 * AuthJSバグ回避のための独自Cookie実装に使用
 */

import crypto from 'crypto'

// 暗号化アルゴリズム
const ALGORITHM = 'aes-256-gcm'
// 初期化ベクトルのサイズ（バイト）
const IV_LENGTH = 16
// 認証タグのサイズ（バイト）
const AUTH_TAG_LENGTH = 16

/**
 * 文字列データを暗号化する
 * @param data 暗号化する文字列
 * @param secret 暗号化キー
 * @returns 暗号化された文字列（base64エンコード）
 */
export function encrypt(data: string, secret: string): string {
  // 鍵を生成（秘密鍵からSHA-256ハッシュを作成）
  const key = crypto.createHash('sha256').update(secret).digest()
  
  // 初期化ベクトルをランダムに生成
  const iv = crypto.randomBytes(IV_LENGTH)
  
  // 暗号化器を作成
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  // データを暗号化
  let encrypted = cipher.update(data, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  // 認証タグを取得
  const authTag = cipher.getAuthTag()
  
  // iv + authTag + 暗号化データを連結してBase64エンコード
  const result = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]).toString('base64')
  
  return result
}

/**
 * 暗号化された文字列を復号化する
 * @param encryptedData 暗号化された文字列（base64エンコード）
 * @param secret 暗号化キー
 * @returns 復号化された文字列
 */
export function decrypt(encryptedData: string, secret: string): string {
  // 鍵を生成（秘密鍵からSHA-256ハッシュを作成）
  const key = crypto.createHash('sha256').update(secret).digest()
  
  // Base64デコード
  const buffer = Buffer.from(encryptedData, 'base64')
  
  // バッファから各部分を抽出
  const iv = buffer.subarray(0, IV_LENGTH)
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH).toString('base64')
  
  // 復号化器を作成
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  // データを復号化
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
'use server'

import { signIn } from '@/lib/auth'

export async function handleSignIn () {  
  try {
    // 明示的にコールバックURLを設定
    await signIn('cognito', {
      redirect: true,
    })
  } catch (error) {
    throw error
  }
}

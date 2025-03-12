'use server'

import { signIn } from '@/lib/auth'

export async function handleSignIn () {  
  try {
    await signIn('cognito', {
      redirectTo: '/'
    })
  } catch (error) {
    throw error
  }
}

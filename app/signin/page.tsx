'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { handleSignIn } from './actions'

export default function SignInPage () {
  // サインイン処理を実行する関数
  const onSignIn = async () => {
    try {
      await handleSignIn()
    } catch (error) {
      console.error('サインインエラー:', error)
      // todo: 500エラー画面にリダイレクト
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">認証テスト</CardTitle>
          <CardDescription>サインインしてサービスを利用する</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Amazonアカウントを使用してサインインします
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={onSignIn}
            className="w-full"
            size="lg"
          >
            サインイン
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

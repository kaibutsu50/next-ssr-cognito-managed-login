import { auth, getSession } from '@/lib/auth'

export default async function AuthTestPage () {
  // Server Componentから認証情報にアクセス
  const authData = await auth()
  const sessionData = await getSession()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">認証情報テスト</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">auth() 関数の結果:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-w-full">
          {JSON.stringify(authData, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">getSession() 関数の結果:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-w-full">
          {JSON.stringify(sessionData, null, 2)}
        </pre>
      </div>
    </div>
  )
}

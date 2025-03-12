import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { auth } from "@/lib/auth"

export default async function Home() {
  const authData = await auth()
  
  if (!authData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">ログインが必要です</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const tokenInfo = [
    { label: "アクセストークン", value: authData.user.accessToken },
    { label: "IDトークン", value: authData.user.idToken },
    { label: "有効期限", value: authData.user.expiresAt ? formatDate(authData.user.expiresAt) : "不明" }
  ]

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">ログイン成功</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">項目</TableHead>
                <TableHead>内容</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokenInfo.map((info, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{info.label}</TableCell>
                  <TableCell className="font-mono break-all">{info.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
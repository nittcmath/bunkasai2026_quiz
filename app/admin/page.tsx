import { cookies } from 'next/headers';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/auth';
import { AdminConsole } from '@/components/admin-console';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value ?? '';
  const loggedIn = verifyAdminToken(token);

  if (!loggedIn) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <Badge className="w-fit bg-destructive text-destructive-foreground">管理者ページ</Badge>
          <CardTitle className="text-3xl">管理者認証が必要です</CardTitle>
          <CardDescription>管理者パスワードでログインしてください。</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminConsole />
        </CardContent>
      </Card>
    );
  }

  return <AdminConsole />;
}

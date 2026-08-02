import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>ページが見つかりません</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">ホームへ戻る</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

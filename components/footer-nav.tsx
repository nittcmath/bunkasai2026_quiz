import Link from 'next/link';
import type { Route } from "next";

const items = [
  { href: '/', label: 'ホーム' },
  { href: '/ranking', label: 'ランキング' },
  { href: '/me', label: '履歴' },
  { href: '/scan', label: 'QRスキャン' },
];

export function FooterNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 py-2 backdrop-blur sm:hidden">
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
        {items.map((item) => (
          <Link key={item.href} href={item.href as Route} className="rounded-2xl px-2 py-3 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

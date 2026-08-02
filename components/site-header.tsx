import Link from 'next/link';
import type { Route } from "next";

const links = [
  { href: '/', label: 'ホーム' },
  { href: '/ranking', label: 'ランキング' },
  { href: '/me', label: 'マイページ' },
  { href: '/admin', label: '管理' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-soft">
            祭
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Bunkasai 2026</p>
            <p className="text-xs text-muted-foreground">ポイントラリー & クイズ</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href as Route}
              className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:-translate-y-0.5 hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

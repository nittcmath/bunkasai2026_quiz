import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import 'katex/dist/katex.min.css';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';
import { FooterNav } from '@/components/footer-nav';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Bunkasai 2026 Point Rally',
  description: '文化祭向けのポイントラリー & クイズシステム',
  applicationName: 'Bunkasai 2026 Point Rally',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value === 'dark' ? 'dark' : 'light';

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={theme === 'dark' ? 'dark' : ''}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SiteHeader />
          <main className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <FooterNav />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}

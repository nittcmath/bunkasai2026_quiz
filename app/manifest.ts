import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bunkasai 2026 Point Rally',
    short_name: 'Bunkasai2026',
    description: '文化祭向けポイントラリー & クイズシステム',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff8ef',
    theme_color: '#f97316',
    icons: [],
  };
}

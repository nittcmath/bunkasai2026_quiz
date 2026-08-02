'use client';

import { useRouter } from 'next/navigation';
import { ScanClient } from '@/components/scan-client';
import type { Route } from "next";

export default function ScanPage() {
  const router = useRouter();
  return <ScanClient onDetected={(url) => router.push(url)} />;
}

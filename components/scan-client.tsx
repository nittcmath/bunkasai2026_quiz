'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { Route } from "next";

type Props = {
  onDetected: (url: Route) => void;
};

export function ScanClient({ onDetected }: Props) {
  const [manualUrl, setManualUrl] = useState('');
  const [status, setStatus] = useState('カメラ読み取りを準備中');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stopped = false;
    async function start() {
      const detectorCtor = (window as Window & { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
      if (!videoRef.current || !detectorCtor) {
        setStatus('この端末ではブラウザ標準スキャンが使えません。URL を手入力してください。');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new detectorCtor({ formats: ['qr_code'] });
        const loop = async () => {
          if (stopped || !videoRef.current) return;
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes[0]?.rawValue) {
            onDetected(barcodes[0].rawValue as Route);
            return;
          }
          requestAnimationFrame(loop);
        };
        loop();
        setStatus('QR コードをカメラにかざしてください');
      } catch {
        setStatus('カメラにアクセスできませんでした。URL を手入力してください。');
      }
    }
    start();
    return () => {
      stopped = true;
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onDetected]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR スキャン</CardTitle>
        <CardDescription>{status}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <video ref={videoRef} className="h-72 w-full rounded-3xl bg-black object-cover" muted playsInline />
        <div className="space-y-3">
          <Input value={manualUrl} onChange={(event) => setManualUrl(event.target.value)} placeholder="読み取った URL を貼り付け" />
          <Button className="w-full" onClick={() => manualUrl && onDetected(manualUrl as Route)}>
            開く
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

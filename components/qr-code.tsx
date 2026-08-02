import { QRCodeCanvas } from 'qrcode.react';

type Props = {
  value: string;
  size?: number;
};

export function QRCodeBlock({ value, size = 196 }: Props) {
  return (
    <div className="inline-flex rounded-3xl bg-white p-4 shadow-soft">
      <QRCodeCanvas value={value} size={size} includeMargin level="H" />
    </div>
  );
}

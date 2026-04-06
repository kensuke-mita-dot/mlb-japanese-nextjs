import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MLB 日本人選手 デイリー',
  description: 'MLB に所属する日本人選手の当日成績と通算成績',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

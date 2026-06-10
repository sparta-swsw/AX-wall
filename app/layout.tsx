import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AX 담벼락',
  description: '파트 내 AX 링크 공유 게시판',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}

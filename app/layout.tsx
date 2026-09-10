import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI 漫剧智能体',
  description: '6个AI Agent协作，一键生成漫剧剧本、分镜、图片、视频',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

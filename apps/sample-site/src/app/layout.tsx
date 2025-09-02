import type { Metadata } from 'next';
import './globals.css';
import { InjectorScript } from '@/components/InjectorScript';

export const metadata: Metadata = {
  title: 'Sample Site - WebExp Platform',
  description: 'Sample site for testing web experiments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <InjectorScript />
        {children}
      </body>
    </html>
  );
}

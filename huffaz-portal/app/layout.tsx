import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/app/lib/session'; // Keep this import path

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Huffaz Job Portal',
  description: 'Job portal for Huffaz graduates from GIATMARA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap the entire application with SessionProvider */}
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

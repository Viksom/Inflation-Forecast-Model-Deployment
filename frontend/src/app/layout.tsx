import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'InflaçãoPT | Plataforma de Previsão Macroeconómica',
  description: 'Dashboard institucional para análise de inflação portuguesa e cenários macroeconómicos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={inter.className} suppressHydrationWarning>
      <body>
        <div className="min-h-screen bg-surface text-slate-900 dark:text-slate-100">
          <Navbar />
          <main className="pt-24 sm:pt-28 lg:pt-24">{children}</main>
        </div>
      </body>
    </html>
  );
}

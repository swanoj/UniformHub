import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import { BottomNav } from '@/components/BottomNav';
import { NotificationService } from '@/components/NotificationService';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'UniformHub | Secondhand Uniforms',
  description: 'The second-hand uniforms/clothes platform. Feed-first, pickup only.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UniformHub',
    startupImage: '/splash.png',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900 pb-16 md:pb-0" suppressHydrationWarning>
        <FirebaseProvider>
          <NotificationService />
          {children}
          <BottomNav />
        </FirebaseProvider>
      </body>
    </html>
  );
}

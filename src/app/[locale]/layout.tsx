import type { Metadata } from 'next';
// Import Geist fonts from the 'geist' package
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '../globals.css';
import AppLayout from '@/components/app-layout';
import { Toaster } from '@/components/ui/toaster';

// The Geist font objects automatically handle variable names and CSS setup
// No need for separate configuration objects like with next/font/google

export const metadata: Metadata = {
  title: 'OvenView',
  description: 'Real-time oven monitoring and control',
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function RootLayout({
  children,
  params: { locale },
}: Readonly<RootLayoutProps>) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable}`}> {/* Apply font variables to html tag */}
      <body className={'antialiased'}> {/* Remove font variables from body, applied on html */}
        <NextIntlClientProvider messages={messages}> {/* Wrap with provider */}
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

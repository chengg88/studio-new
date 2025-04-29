
import type { Metadata } from 'next';
// Import Geist fonts from the 'geist' package
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '../globals.css';
import AppLayout from '@/components/app-layout';
import { Toaster } from '@/components/ui/toaster';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';

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
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={'antialiased'}> {/* Remove font variables from body, applied on html */}
        <NextIntlClientProvider messages={messages}> {/* Wrap with provider */}
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

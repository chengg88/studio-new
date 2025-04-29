import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import {NextIntlClientProvider} from 'next-intl'; // Import NextIntlClientProvider
import {getMessages} from 'next-intl/server'; // Import getMessages
import '../globals.css';
import AppLayout from '@/components/app-layout';
import {Toaster} from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OvenView',
  description: 'Real-time oven monitoring and control',
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: {locale: string};
}

export default async function RootLayout({
  children,
  params: {locale} // Destructure locale from params
}: Readonly<RootLayoutProps>) {

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}> {/* Set lang attribute */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}> {/* Wrap with provider */}
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

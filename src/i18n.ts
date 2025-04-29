
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define the locales supported by the application
export const locales = ['en', 'zh-TW', 'zh-CN', 'th'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    locale, // Explicitly return locale
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

// Type helper for translation keys (optional but recommended)
type Messages = typeof import('../messages/en.json');
declare interface IntlMessages extends Messages {}

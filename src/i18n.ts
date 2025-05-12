
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
// Using config file for locales, ensuring defaultLocale is also picked up
import {locales as appLocales, defaultLocale as appDefaultLocale, type Locale} from '@/config';

// Define the locales supported by the application
export const locales = appLocales;
export const defaultLocale = appDefaultLocale; // Ensure this is exported

export default getRequestConfig(async (params) => {
  const locale = params.locale as Locale;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    console.error(`Unsupported locale: ${locale}. Available locales: ${locales.join(', ')}`);
    notFound();
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale // Ensure locale is explicitly passed
  };
});

// Type helper for translation keys (optional but recommended)
type Messages = typeof import('../messages/en.json');
// eslint-disable-next-line @typescript-eslint/no-empty-interface
declare interface IntlMessages extends Messages {}


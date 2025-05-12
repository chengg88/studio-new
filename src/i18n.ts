
import {getRequestConfig} from 'next-intl/server';
import {getLocale} from 'next-intl/server'; // For fetching the active locale
import {notFound} from 'next/navigation';
import {locales as appLocales, defaultLocale as appDefaultLocale } from './config'; // Using config file for locales

// Define the locales supported by the application
export const locales = appLocales;
export const defaultLocale = appDefaultLocale;

export default getRequestConfig(async () => {
  // Obtain the current locale
  // The `getLocale` function is used here as per the deprecation message's implied direction
  // and common practice for fetching locale in server-side `next-intl` contexts.
  const locale = await getLocale();

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale: locale // Ensure locale is explicitly passed
    // The `locale` is implicitly part of the configuration returned by `getRequestConfig`
    // when `getLocale()` is used, and `NextIntlClientProvider` will use it.
  };
});

// Type helper for translation keys (optional but recommended)
type Messages = typeof import('../messages/en.json');
// eslint-disable-next-line @typescript-eslint/no-empty-interface
declare interface IntlMessages extends Messages {}

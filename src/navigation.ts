
import {createLocalizedPathnamesNavigation} from 'next-intl/navigation';
import {locales} from './i18n';

export const localePrefix = 'as-needed'; // Or 'always' or 'never'

// The `pathnames` object holds pairs of internal
// and external paths, separated by locale.
export const pathnames = {
  // If all locales use the same pathnames, a single
  // external path can be used for all locales.
  '/': '/',
  '/settings': '/settings',

  // If locales use different paths, you can
  // specify each external path per locale.
  // '/about': {
  //   en: '/about',
  //   de: '/ueber-uns'
  // }
};

export const {Link, redirect, usePathname, useRouter} =
  createLocalizedPathnamesNavigation({locales, localePrefix, pathnames});

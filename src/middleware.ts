import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: defaultLocale
});

export const config = {
  // Match only internationalized pathnames
  // Skip internal paths like /_next, /api, images, etc.
  // Use the recommended pattern from next-intl docs
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    `/(en|zh-TW|zh-CN|th)/:path*`,

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    // Skip specific paths: _next, _vercel, api, images, and files with extensions (like .ico, .png)
    '/((?!_next|_vercel|api|images|.*\\..*).*)'
  ]
};

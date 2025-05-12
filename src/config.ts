// src/config.ts
export const locales = ['en', 'zh-TW', 'zh-CN', 'th'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

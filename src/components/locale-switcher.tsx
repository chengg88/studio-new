
'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next-intl/client'; // Correct import for App Router
import { locales } from '@/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react'; // Import Globe icon

export default function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const onSelectChange = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="flex items-center">
      <Select
        onValueChange={onSelectChange}
        defaultValue={locale}
        disabled={isPending}
      >
        <SelectTrigger className="w-auto border-none shadow-none focus:ring-0 gap-1 pr-2">
           <Globe className="h-4 w-4" /> {/* Add Globe icon */}
          <SelectValue placeholder={t('changeLanguage')} />
        </SelectTrigger>
        <SelectContent align="end">
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {t(loc as keyof IntlMessages['LocaleSwitcher'])} {/* Translate locale name */}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

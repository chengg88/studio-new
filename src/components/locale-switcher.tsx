
'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation'; // Import from next/navigation
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
  const currentLocale = useLocale();
  const router = useRouter(); // Use next/navigation router
  const currentPathname = usePathname(); // Use next/navigation pathname
  const [isPending, startTransition] = React.useTransition();

  const onSelectChange = (nextLocale: string) => {
    startTransition(() => {
      // Manually replace the locale segment in the pathname
      // This assumes the locale is always the first segment
      const newPathname = currentPathname.startsWith(`/${currentLocale}`)
        ? currentPathname.replace(`/${currentLocale}`, `/${nextLocale}`)
         // Handle root path case or paths without locale prefix (though middleware should handle this)
        : `/${nextLocale}${currentPathname === '/' ? '' : currentPathname}`;


      router.replace(newPathname); // Use standard router replace
    });
  };

  return (
    <div className="flex items-center">
      <Select
        onValueChange={onSelectChange}
        defaultValue={currentLocale}
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

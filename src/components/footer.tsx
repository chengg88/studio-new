
'use client'; // Keep client-side for dynamic year and translations

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl'; // Import useTranslations

export default function Footer() {
  const t = useTranslations('Footer'); // Initialize translations
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex justify-center border-t bg-background py-4 text-xs text-muted-foreground">
      <div className="flex flex-col items-center gap-1">
         <Image
            src="/liteon_logo.png"
            alt="LiteOn Technology Logo"
            width={150}
            height={50}
            priority
          />
        <p>
          {/* Use translation with placeholder */}
          {t('copyright', { year: currentYear })}
        </p>
      </div>
    </footer>
  );
}

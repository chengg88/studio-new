
'use client';

import type {PropsWithChildren} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LayoutDashboard, Settings as SettingsIcon, Thermometer} from 'lucide-react';
import Image from 'next/image';
import {useTranslations} from 'next-intl'; // Import useTranslations

import {cn} from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import Footer from './footer';
import LocaleSwitcher from './locale-switcher'; // Import LocaleSwitcher

export default function AppLayout({children}: PropsWithChildren) {
  const pathname = usePathname();
  const t = useTranslations('AppLayout'); // Initialize translations

  // Function to check if a path is active, ignoring the locale part
  const isActive = (path: string) => {
     // Remove the locale part (e.g., /en, /zh-TW) if present
     const currentPathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
     // If the root path is just '/', handle it specifically
     const adjustedPath = currentPathWithoutLocale === '' ? '/' : currentPathWithoutLocale;
     return adjustedPath === path;
  };


  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1">
          <Sidebar collapsible="icon">
            <SidebarHeader className="p-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                <Thermometer className="w-6 h-6" />
                <span className="group-data-[state=expanded]:opacity-100 group-data-[state=collapsed]:opacity-0 transition-opacity duration-200">
                  {t('title')}
                </span>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/')}
                    tooltip={t('dashboard')}
                  >
                    <Link href="/">
                      <LayoutDashboard />
                      <span>{t('dashboard')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/settings')}
                    tooltip={t('settings')}
                  >
                    <Link href="/settings">
                      <SettingsIcon />
                      <span>{t('settings')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="flex flex-1 flex-col">
             <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
               <div className="flex items-center gap-2">
                   <SidebarTrigger className="md:hidden"/>
                    {/* Dynamically display header based on active path */}
                    <h1 className="text-xl font-semibold hidden sm:block">
                      {isActive('/') ? t('dashboard') : isActive('/settings') ? t('settings') : t('title')}
                    </h1>
               </div>
               {/* Locale switcher added to the right side of the header */}
               <LocaleSwitcher />
             </header>
            <main className="flex-grow flex flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
            <Footer />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

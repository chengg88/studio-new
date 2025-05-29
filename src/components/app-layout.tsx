
'use client';

import type {PropsWithChildren} from 'react';
// Import navigation utilities from the centralized navigation module
import { Link, usePathname, useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {LayoutDashboard, Settings as SettingsIcon, Thermometer, Menu} from 'lucide-react';

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
import LocaleSwitcher from './locale-switcher';
import { SheetTitle } from '@/components/ui/sheet'; // Correct import for SheetTitle


// This is the main layout component that wraps the application content
export default function AppLayout({children}: PropsWithChildren) {
  return (
    // Use SidebarProvider to manage sidebar state, default collapsed on desktop
    <SidebarProvider defaultCollapsed={false}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}

// Separated content to allow useSidebar hook within SidebarProvider context
// This is necessary because useSidebar() needs to be called within SidebarProvider
function AppLayoutContent({children}: PropsWithChildren) {
    const fullPathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('AppLayout');
    const { isMobile } = useSidebar(); // Get isMobile state from sidebar context

    // Function to check if a path is active, ignoring the locale part
    const isActive = (path: string) => {
       const pathWithoutLocale = fullPathname.startsWith(`/${locale}`)
        ? fullPathname.substring(`/${locale}`.length)
        : fullPathname;
       const adjustedPathWithoutLocale = pathWithoutLocale === '' ? '/' : pathWithoutLocale;
       return adjustedPathWithoutLocale === path;
    };


  return (
      <div className="flex min-h-screen flex-col bg-background w-full">
        <div className="flex flex-1">
           <Sidebar collapsible="icon" side="left" className="w-60">
            <SidebarHeader className="p-4">
                {/* Conditionally render SheetTitle only when in mobile (sheet) view */}
                {isMobile && <SheetTitle className="sr-only">{t('title')}</SheetTitle>}
              <Link href="/" className="flex items-center gap-2 font-bold text-lg text-sidebar-primary">
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
           <SidebarInset className="flex flex-1 flex-col w-full overflow-x-auto max-w-full">
             <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
               <div className="flex items-center gap-2">
                   <SidebarTrigger className="md:hidden"/>
                    <h1 className="text-xl font-semibold hidden sm:block">
                      {isActive('/') ? t('dashboard') : isActive('/settings') ? t('settings') : t('title')}
                    </h1>
               </div>
               <LocaleSwitcher />
             </header>
            <main className="flex-grow flex flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 w-full">
               <div className="w-full mx-auto">{children}</div>
            </main>
             <Footer />
          </SidebarInset>
        </div>
      </div>
  );
}


'use client';

import type {PropsWithChildren} from 'react';
// Import navigation utilities from the centralized navigation module
import { Link, usePathname, useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {LayoutDashboard, Settings as SettingsIcon, Thermometer, Menu} from 'lucide-react'; // Added Menu for mobile trigger

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


// This is the main layout component that wraps the application content
export default function AppLayout({children}: PropsWithChildren) {
  return (
    // Use SidebarProvider to manage sidebar state, default collapsed on desktop
    <SidebarProvider defaultCollapsed={true}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}

// Separated content to allow useSidebar hook within SidebarProvider context
// This is necessary because useSidebar() needs to be called within SidebarProvider
function AppLayoutContent({children}: PropsWithChildren) {
    const fullPathname = usePathname(); // Use next-intl/navigation usePathname hook via @/navigation
    const router = useRouter(); // Use next-intl/navigation router hook via @/navigation
    const locale = useLocale(); // Get current locale
    const t = useTranslations('AppLayout');

    // Function to check if a path is active, ignoring the locale part
    const isActive = (path: string) => {
       // Remove the locale part (e.g., /en, /zh-TW) if present
       // Use the current locale from useLocale()
       const pathWithoutLocale = fullPathname.startsWith(`/${locale}`)
        ? fullPathname.substring(`/${locale}`.length)
        : fullPathname;

       // Handle root path ('') or paths starting with '/'
       const adjustedPathWithoutLocale = pathWithoutLocale === '' ? '/' : pathWithoutLocale;

        // Check if the adjusted path matches the target path
       return adjustedPathWithoutLocale === path;
    };


  return (
      <div className="flex min-h-screen flex-col bg-background" style={{ width: '150%' }}> {/* Ensure background color */}
        <div className="flex flex-1">
           {/* Use defaultCollapsed prop directly on SidebarProvider */}
           <Sidebar collapsible="icon" side="left">
            <SidebarHeader className="p-4">
               {/* Use Link from @/navigation */}
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
                     {/* Use Link from @/navigation */}
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
                      {/* Use Link from @/navigation */}
                    <Link href="/settings">
                      <SettingsIcon />
                      <span>{t('settings')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          {/* SidebarInset handles the main content area positioning relative to the sidebar */}
           <SidebarInset className="flex flex-1 flex-col w-full overflow-x-hidden"> {/* Adjusted width handling */}
             <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
               <div className="flex items-center gap-2">
                    {/* Use SidebarTrigger for mobile toggle */}
                   <SidebarTrigger className="md:hidden"/>
                    {/* Dynamically display header based on active path */}
                    <h1 className="text-xl font-semibold hidden sm:block">
                      {isActive('/') ? t('dashboard') : isActive('/settings') ? t('settings') : t('title')}
                    </h1>
               </div>
               {/* Locale switcher added to the right side of the header */}
               <LocaleSwitcher />
             </header>
            {/* Main content area */}
            <main className="flex-grow flex flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8"> {/* Ensure content grows */}
               <div className="w-full mx-auto">{children}</div> {/* Centering container, removed max-w constraints if they limit width */}
            </main>
            {/* Footer remains at the bottom */}
             <Footer />
          </SidebarInset>
        </div>
      </div>
  );
}


// Wrapper component to ensure SidebarProvider is used correctly
function AppLayoutWrapper({ children }: PropsWithChildren) {
  return (
    <SidebarProvider defaultCollapsed={true}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}

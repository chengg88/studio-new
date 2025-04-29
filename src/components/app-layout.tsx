
'use client';

import type {PropsWithChildren} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LayoutDashboard, Settings as SettingsIcon, Thermometer} from 'lucide-react';
import Image from 'next/image'; // Import Image

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
import Footer from './footer'; // Import the Footer component

export default function AppLayout({children}: PropsWithChildren) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col"> {/* Keep as flex-col */}
        <div className="flex flex-1"> {/* Flex container for sidebar and main content + footer area */}
          <Sidebar collapsible="icon">
            <SidebarHeader className="p-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <Thermometer className="w-6 h-6 text-primary" />
                <span className="group-data-[state=expanded]:opacity-100 group-data-[state=collapsed]:opacity-0 transition-opacity duration-200">
                  OvenView
                </span>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/')}
                    tooltip="Dashboard"
                  >
                    <Link href="/">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/settings')}
                    tooltip="Settings"
                  >
                    <Link href="/settings">
                      <SettingsIcon />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          {/* SidebarInset now wraps header, main content, AND footer */}
          <SidebarInset className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
              <div className="flex items-center gap-2">
                  <SidebarTrigger className="md:hidden"/> {/* Mobile trigger */}
                  <h1 className="text-xl font-semibold hidden sm:block">
                    {pathname === '/' ? 'Dashboard' : 'Settings'}
                  </h1>
              </div>
              {/* Placeholder for potential header actions */}
              <div></div>
            </header>
            {/* Main content area */}
            <main className="flex-grow flex flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8"> {/* Changed flex-1 to flex-grow */}
              {children}
            </main>
            {/* Footer moved inside SidebarInset */}
            <Footer />
          </SidebarInset>
        </div>
        {/* Footer removed from here */}
      </div>
    </SidebarProvider>
  );
}

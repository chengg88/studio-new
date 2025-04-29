
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
} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import Footer from './footer'; // Import the Footer component

export default function AppLayout({children}: PropsWithChildren) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col"> {/* Changed to flex-col */}
        <div className="flex flex-1"> {/* New flex container for sidebar and main content */}
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
          <SidebarInset className="flex-1 flex flex-col"> {/* Added flex-1 and flex-col */}
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
              {/* Header content can go here if needed, e.g., user profile, notifications */}
              <div className="flex items-center gap-2">
                  <SidebarTrigger className="md:hidden"/> {/* Mobile trigger */}
                  <h1 className="text-xl font-semibold hidden sm:block">
                    {pathname === '/' ? 'Dashboard' : 'Settings'}
                  </h1>
              </div>
              {/* Placeholder for potential header actions */}
              <div></div>
            </header>
            <main className="flex-1 flex flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8"> {/* Added flex-1 */}
              {children}
            </main>
             {/* Removed Footer from here */}
          </SidebarInset>
        </div>
        <Footer /> {/* Moved Footer outside the inner flex container */}
      </div>
    </SidebarProvider>
  );
}

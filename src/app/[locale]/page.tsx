
import Dashboard from '@/components/dashboard';
import { useTranslations } from 'next-intl'; // Import useTranslations

export default function Home() {
  // Although Dashboard is a client component, this page is a server component.
  // We can still use useTranslations here if needed for page-level elements,
  // or pass translations down if Dashboard itself needed server-side translations.
  // const t = useTranslations('Dashboard');

  return <Dashboard />;
}

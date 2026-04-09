import * as React from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useNavigate, useHref, NavLink } from 'react-router';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { I18nProvider } from '@react-aria/i18n';
import { Icon } from '@iconify/react';

import type { Route } from './+types/root';
import './app.css';

import GenericErrorBoundary from '~/components/error-boundary';

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;700;900&family=Inter:wght@300;400;500;600;700&display=swap',
  },
];

const navItems = [
  { to: '/', label: 'Accueil', icon: 'lucide:home' },
  { to: '/planning', label: 'Planning', icon: 'lucide:map' },
  { to: '/checklist', label: 'Checklist', icon: 'lucide:check-square' },
  { to: '/calendrier', label: 'Calendrier', icon: 'lucide:calendar-heart' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Monkey Japan 2026</title>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/90 backdrop-blur-md border-b border-kraft shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-2xl">&#127481;&#127477;</span>
          <span className="hidden sm:inline font-handwritten text-2xl font-bold text-ink">Monkey Japan</span>
          <span className="stamp text-[10px] !p-[2px_8px]">2026</span>
        </NavLink>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-washi/60 text-ink border border-kraft'
                    : 'text-ink/50 hover:text-ink hover:bg-washi/30'
                }`
              }
            >
              <Icon icon={item.icon} className="text-lg" />
              <span className="hidden md:inline">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const navigate = useNavigate();

  return (
    <HeroUIProvider
      navigate={(path) => navigate(path, { viewTransition: true })}
      useHref={useHref}
      className="min-h-screen"
    >
      <I18nProvider locale="fr-FR">
        <ToastProvider placement="bottom-right" maxVisibleToasts={3} />
        <Navbar />
        <main className="pt-16">
          <Outlet />
        </main>
      </I18nProvider>
    </HeroUIProvider>
  );
}

export const ErrorBoundary = GenericErrorBoundary;

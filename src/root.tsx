import * as React from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useNavigate, useHref, NavLink } from 'react-router';
import { HeroUIProvider } from '@heroui/react';
import { I18nProvider } from '@react-aria/i18n';
import { Icon } from '@iconify/react';

import type { Route } from './+types/root';
import './app.css';

import GenericErrorBoundary from '~/components/error-boundary';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=Inter:wght@300;400;500;600;700&display=swap',
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-sakura/30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <span className="text-2xl">&#127481;&#127477;</span>
          <span className="hidden sm:inline">Monkey Japan</span>
          <span className="text-xs font-normal text-sakura-dark bg-sakura-light px-2 py-0.5 rounded-full">2026</span>
        </NavLink>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sakura-light text-sakura-dark'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
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
    <HeroUIProvider navigate={(path) => navigate(path, { viewTransition: true })} useHref={useHref}>
      <I18nProvider locale="fr-FR">
        <Navbar />
        <main className="pt-16">
          <Outlet />
        </main>
      </I18nProvider>
    </HeroUIProvider>
  );
}

export const ErrorBoundary = GenericErrorBoundary;

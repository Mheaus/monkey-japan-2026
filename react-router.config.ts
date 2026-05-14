import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  appDirectory: 'src',
  prerender: ['/', '/vol', '/planning', '/checklist', '/calendrier'],
  routeDiscovery: { mode: 'initial' },
} satisfies Config;

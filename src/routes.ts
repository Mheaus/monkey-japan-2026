import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('vol', 'routes/vol.tsx'),
  route('planning', 'routes/planning.tsx'),
  route('checklist', 'routes/checklist.tsx'),
  route('calendrier', 'routes/calendrier.tsx'),
  route('api/flight/:ident', 'routes/api.flight.tsx'),
] satisfies RouteConfig;

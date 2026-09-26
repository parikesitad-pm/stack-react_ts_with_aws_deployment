import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/landing.tsx'),
  route('docs', 'routes/docs.tsx'),
  route('help', 'routes/help.tsx'),
  route('changelog', 'routes/changelog.tsx'),
  route('app', 'routes/app.tsx'),
  route('app/note/:id', 'routes/app.note.tsx'),
  route('app/search', 'routes/app.search.tsx'),
  route('app/settings', 'routes/app.settings.tsx'),
] satisfies RouteConfig;

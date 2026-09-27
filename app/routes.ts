import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/landing.tsx'),
  route('docs', 'routes/docs.tsx'),
  route('help', 'routes/help.tsx'),
  route('changelog', 'routes/changelog.tsx'),
  route('modula-project', 'routes/modula-project.tsx'),
  route('auth/login', 'routes/auth.login.tsx'),
  route('auth/callback', 'routes/auth.callback.tsx'),
  route('auth/logout', 'routes/auth.logout.tsx'),
  route('auth/register', 'routes/auth.register.tsx'),
  route('auth/verify', 'routes/auth.verify.tsx'),
  route('auth/forgot-password', 'routes/auth.forgot-password.tsx'),
  route('app', 'routes/app.tsx'),
  route('app/note/:id', 'routes/app.note.tsx'),
  route('app/search', 'routes/app.search.tsx'),
  route('app/settings', 'routes/app.settings.tsx'),
  route('profile', 'routes/profile.tsx'),
  route('demo', 'routes/demo.tsx'),
] satisfies RouteConfig;

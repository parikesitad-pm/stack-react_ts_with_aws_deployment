import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  async prerender() {
    return ['/', '/docs', '/help', '/changelog', '/modula-project'];
  },
} satisfies Config;

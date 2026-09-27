import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  async prerender() {
    return ['/', '/docs', '/help', '/how-to-use', '/changelog', '/modula-project', '/demo'];
  },
} satisfies Config;

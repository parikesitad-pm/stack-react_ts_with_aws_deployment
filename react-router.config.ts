import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  async prerender() {
    return [
      "/",
      "/docs",
      "/help",
      "/changelog",
      "/auth/login",
      "/auth/register",
      "/auth/verify",
      "/auth/forgot-password",
    ];
  },
} satisfies Config;

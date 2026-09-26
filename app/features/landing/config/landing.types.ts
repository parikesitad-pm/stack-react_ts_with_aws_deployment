export interface LandingContent {
  badge: string;
  headline: string;
  subheadline: string;
  description: string;
}

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  badge: 'STACK v0.1.0 · A Modula Project',
  headline: 'MARKDOWN-FIRST.',
  subheadline: 'ZERO LATENCY ON THE WIRE.',
  description:
    'An industrial-grade, local-first note application engineered for Windows and Linux desktop environments, installable as a high-performance PWA. Plain UTF-8 Markdown is the canonical truth.',
};

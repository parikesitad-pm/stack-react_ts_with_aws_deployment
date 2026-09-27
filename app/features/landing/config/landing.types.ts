export interface LandingContent {
  badge: string;
  headline: string;
  subheadline: string;
  description: string;
}

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  badge: 'STACK v0.9.0 · A Modula Project',
  headline: 'MARKDOWN-FIRST.',
  subheadline: 'LOCAL-FIRST BY DESIGN.',
  description:
    'An industrial-grade, local-first note application engineered for Windows, Linux, and macOS. Plain UTF-8 Markdown is the canonical truth.',
};

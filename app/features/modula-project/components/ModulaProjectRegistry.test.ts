import { describe, it, expect } from 'vitest';
import {
  MODULA_PROJECTS,
  type ModulaProject,
} from './ModulaProjectRegistry';

describe('ModulaProjectRegistry Data & Sorting', () => {
  it('correctly derives total, live, and under-reconstruction counts', () => {
    const totalCount = MODULA_PROJECTS.length;
    const liveCount = MODULA_PROJECTS.filter((p) => p.status === 'live').length;
    const reconstructionCount = MODULA_PROJECTS.filter(
      (p) => p.status === 'under-reconstruction'
    ).length;

    expect(totalCount).toBe(5);
    expect(liveCount).toBe(3);
    expect(reconstructionCount).toBe(2);
    expect(liveCount + reconstructionCount).toBe(totalCount);
  });

  it('sorts live projects first and under-reconstruction projects last while preserving group order', () => {
    const testList: ModulaProject[] = [
      { name: 'Alpha', repoUrl: 'https://...', status: 'under-reconstruction' },
      { name: 'Beta', repoUrl: 'https://...', status: 'live' },
      { name: 'Gamma', repoUrl: 'https://...', status: 'under-reconstruction' },
      { name: 'Delta', repoUrl: 'https://...', status: 'live' },
    ];

    const sorted = [...testList].sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'live' ? -1 : 1;
    });

    expect(sorted.map((p) => p.name)).toEqual([
      'Beta',
      'Delta',
      'Alpha',
      'Gamma',
    ]);
  });

  it('guarantees only live projects have liveUrl deployments in MODULA_PROJECTS', () => {
    MODULA_PROJECTS.forEach((project) => {
      if (project.status === 'under-reconstruction') {
        expect(project.liveUrl).toBeUndefined();
      } else {
        expect(project.liveUrl).toBeDefined();
        expect(project.liveUrl).toMatch(/^https:\/\//);
      }
      expect(project.repoUrl).toMatch(/^https:\/\/github\.com\//);
    });
  });

  it('identifies STACK as current system', () => {
    const stack = MODULA_PROJECTS.find((p) => p.name === 'STACK');
    expect(stack).toBeDefined();
    expect(stack?.isCurrentSystem).toBe(true);
    expect(stack?.status).toBe('live');
  });
});

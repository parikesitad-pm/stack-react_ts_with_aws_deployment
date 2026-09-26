import JSZip from 'jszip';
import type { Note } from '~/features/notes/types/note.types';
import { parseFrontmatter } from '~/lib/frontmatter';

export interface ImportCandidate {
  title: string;
  content: string;
  tags: string[];
}

export const importEngineService = {
  async parseSingleFile(file: File): Promise<ImportCandidate> {
    const rawText = await file.text();
    const { frontmatter, body } = parseFrontmatter(rawText);

    let title = file.name.replace(/\.(md|txt)$/i, '');
    if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
      title = frontmatter.title.trim();
    } else {
      // Check first H1
      const h1Match = body.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1]) {
        title = h1Match[1].trim();
      }
    }

    const tags = Array.isArray(frontmatter.tags)
      ? (frontmatter.tags as string[])
      : ['imported'];

    return {
      title,
      content: rawText,
      tags,
    };
  },

  async parseWorkspaceZip(zipFile: File): Promise<ImportCandidate[]> {
    const zip = await JSZip.loadAsync(zipFile);
    const candidates: ImportCandidate[] = [];

    const fileEntries = Object.keys(zip.files);
    for (const filename of fileEntries) {
      if (filename.endsWith('.md') && !filename.startsWith('__MACOSX/')) {
        const fileData = zip.file(filename);
        if (fileData) {
          const rawText = await fileData.async('text');
          const cleanName = filename.split('/').pop()?.replace(/\.md$/i, '') || 'Imported Note';
          const { frontmatter } = parseFrontmatter(rawText);

          let title = cleanName;
          if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
            title = frontmatter.title.trim();
          }

          candidates.push({
            title,
            content: rawText,
            tags: ['migrated'],
          });
        }
      }
    }

    return candidates;
  },

  detectCollisions(
    candidates: ImportCandidate[],
    existingNotes: Note[]
  ): { safe: ImportCandidate[]; collisions: { candidate: ImportCandidate; existing: Note }[] } {
    const safe: ImportCandidate[] = [];
    const collisions: { candidate: ImportCandidate; existing: Note }[] = [];

    const existingMap = new Map<string, Note>();
    for (const n of existingNotes) {
      existingMap.set(n.title.toLowerCase().trim(), n);
    }

    for (const cand of candidates) {
      const match = existingMap.get(cand.title.toLowerCase().trim());
      if (match) {
        collisions.push({ candidate: cand, existing: match });
      } else {
        safe.push(cand);
      }
    }

    return { safe, collisions };
  },
};

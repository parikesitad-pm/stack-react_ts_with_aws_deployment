import type { Note } from '../../notes/types/note.types';
import { noteOrganizationService } from '../../notes/services/noteOrganization.service';

export interface TagSummary {
  tag: string;
  count: number;
}

export const tagService = {
  normalizeTag(raw: string): string {
    return raw
      .replace(/^#+/, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
  },

  validateTag(raw: string): { valid: boolean; normalized: string; error?: string } {
    const normalized = this.normalizeTag(raw);
    if (normalized.length === 0) {
      return { valid: false, normalized: '', error: 'Tag cannot be empty.' };
    }
    if (normalized.length > 40) {
      return { valid: false, normalized, error: 'Tag cannot exceed 40 characters.' };
    }
    // Disallow control characters and special URI punctuation
    if (/[\u0000-\u001F\u007F-\u009F<>:"/\\|?*]/.test(normalized)) {
      return { valid: false, normalized, error: 'Tag contains invalid characters.' };
    }
    return { valid: true, normalized };
  },

  /**
   * Extracts tags and their occurrence counts from ACTIVE notes only.
   * Notes in archive or trash are strictly excluded from tag counts.
   */
  extractActiveTags(notes: Note[]): TagSummary[] {
    const activeNotes = noteOrganizationService.getActiveNotes(notes);
    const countMap = new Map<string, number>();

    for (const note of activeNotes) {
      if (!Array.isArray(note.tags)) continue;
      const seenForNote = new Set<string>();
      for (const raw of note.tags) {
        const tag = this.normalizeTag(raw);
        if (tag.length > 0 && !seenForNote.has(tag)) {
          seenForNote.add(tag);
          countMap.set(tag, (countMap.get(tag) ?? 0) + 1);
        }
      }
    }

    return Array.from(countMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => a.tag.localeCompare(b.tag));
  },

  addTagToNote(note: Note, rawTag: string): Note {
    const validation = this.validateTag(rawTag);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid tag.');
    }

    const currentTags = Array.isArray(note.tags) ? note.tags : [];
    const normalized = validation.normalized;

    if (currentTags.some((t) => this.normalizeTag(t) === normalized)) {
      return note; // Already exists
    }

    return {
      ...note,
      tags: [...currentTags, normalized],
      updatedAt: new Date().toISOString(),
    };
  },

  removeTagFromNote(note: Note, rawTag: string): Note {
    const normalized = this.normalizeTag(rawTag);
    const currentTags = Array.isArray(note.tags) ? note.tags : [];
    const filtered = currentTags.filter((t) => this.normalizeTag(t) !== normalized);

    if (filtered.length === currentTags.length) {
      return note;
    }

    return {
      ...note,
      tags: filtered,
      updatedAt: new Date().toISOString(),
    };
  },
};

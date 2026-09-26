import JSZip from 'jszip';
import type { Note } from '~/features/notes/types/note.types';
import type { Attachment } from '~/features/attachments/types/attachment.types';
import type { StackManifest } from '../types/migration.types';

function sanitizeFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'untitled'
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportEngineService = {
  exportSingleMarkdown(note: Note): void {
    const filename = `${sanitizeFilename(note.title)}.md`;
    const blob = new Blob([note.content], {
      type: 'text/markdown;charset=utf-8',
    });
    triggerDownload(blob, filename);
  },

  async exportSingleNoteZip(
    note: Note,
    attachments: Attachment[]
  ): Promise<void> {
    const zip = new JSZip();
    const slug = sanitizeFilename(note.title);

    // Add markdown file
    zip.file(`${slug}.md`, note.content);

    // Add note's assets if any
    const noteAttachments = attachments.filter((a) => a.noteId === note.id);
    if (noteAttachments.length > 0) {
      const assetsFolder = zip.folder('assets');
      for (const att of noteAttachments) {
        if (att.dataUrl) {
          const base64Data = att.dataUrl.split(',')[1];
          if (base64Data) {
            assetsFolder?.file(att.name, base64Data, { base64: true });
          }
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    triggerDownload(content, `${slug}.zip`);
  },

  copyRawMarkdown(note: Note): Promise<void> {
    return navigator.clipboard.writeText(note.content);
  },

  async exportWorkspaceZip(
    notes: Note[],
    attachments: Attachment[]
  ): Promise<void> {
    const zip = new JSZip();
    const dateStr = new Date().toISOString().split('T')[0];

    const notesFolder = zip.folder('notes');
    const assetsFolder = zip.folder('assets');
    const attachmentsFolder = zip.folder('attachments');

    // Add all notes
    const seenNames = new Set<string>();
    for (const note of notes) {
      let slug = sanitizeFilename(note.title);
      if (seenNames.has(slug)) {
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
      }
      seenNames.add(slug);
      notesFolder?.file(`${slug}.md`, note.content);
    }

    // Add all assets & attachments
    for (const att of attachments) {
      if (att.dataUrl) {
        const base64Data = att.dataUrl.split(',')[1];
        if (base64Data) {
          if (att.mimeType.startsWith('image/')) {
            assetsFolder?.file(att.name, base64Data, { base64: true });
          } else {
            attachmentsFolder?.file(att.name, base64Data, { base64: true });
          }
        }
      }
    }

    // Manifest metadata
    const manifest: StackManifest = {
      version: 1,
      exportedAt: new Date().toISOString(),
      notes: notes.length,
      attachments: attachments.length,
      engine: 'STACK · A Modula Project',
    };
    zip.file('stack-manifest.json', JSON.stringify(manifest, null, 2));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, `stack-export-${dateStr}.zip`);
  },
};

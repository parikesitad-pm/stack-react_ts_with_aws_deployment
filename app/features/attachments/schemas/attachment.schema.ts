import { z } from 'zod';

export const attachmentKindSchema = z.enum([
  'image',
  'document',
  'spreadsheet',
  'presentation',
  'archive',
  'text',
  'other',
]);

export type AttachmentKind = z.infer<typeof attachmentKindSchema>;

export const attachmentLocalStateSchema = z.enum([
  'available',
  'missing',
  'processing',
  'error',
]);

export type AttachmentLocalState = z.infer<typeof attachmentLocalStateSchema>;

export const attachmentCloudStateSchema = z.enum([
  'local-only',
  'queued',
  'uploading',
  'uploaded',
  'failed',
]);

export type AttachmentCloudState = z.infer<typeof attachmentCloudStateSchema>;

export const attachmentSchema = z.object({
  id: z.string().min(1),
  noteId: z.string().min(1),
  logicalPath: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  byteSize: z.number().int().nonnegative(),
  kind: attachmentKindSchema,
  localState: attachmentLocalStateSchema,
  cloudState: attachmentCloudStateSchema,
  storageKey: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Attachment = z.infer<typeof attachmentSchema>;

/**
 * Helper to classify file MIME type / extension into AttachmentKind
 */
export function classifyAttachmentKind(
  mimeType: string,
  fileName: string = ''
): AttachmentKind {
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerName = (fileName || '').toLowerCase();

  if (lowerMime.startsWith('image/')) return 'image';
  if (lowerMime === 'application/pdf' || lowerName.endsWith('.pdf'))
    return 'document';
  if (
    lowerMime.includes('word') ||
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.docx')
  ) {
    return 'document';
  }
  if (
    lowerMime.includes('excel') ||
    lowerMime.includes('spreadsheet') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.csv')
  ) {
    return 'spreadsheet';
  }
  if (
    lowerMime.includes('presentation') ||
    lowerMime.includes('powerpoint') ||
    lowerName.endsWith('.ppt') ||
    lowerName.endsWith('.pptx')
  ) {
    return 'presentation';
  }
  if (
    lowerMime.includes('zip') ||
    lowerMime.includes('tar') ||
    lowerMime.includes('gzip') ||
    lowerName.endsWith('.zip') ||
    lowerName.endsWith('.tar.gz')
  ) {
    return 'archive';
  }
  if (
    lowerMime.startsWith('text/') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.json') ||
    lowerName.endsWith('.md')
  ) {
    return 'text';
  }

  return 'other';
}

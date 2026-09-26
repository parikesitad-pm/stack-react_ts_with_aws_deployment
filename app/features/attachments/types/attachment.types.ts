export interface Attachment {
  id: string;
  ownerSub: string;
  noteId: string;
  name: string;
  mimeType: string;
  size: number;
  localPath: string; // e.g. ./assets/screenshot-20260927-010212.webp or ./attachments/proposal.pdf
  cloudKey?: string;
  createdAt: string;
  syncStatus: 'local' | 'pending' | 'synced' | 'failed';
  dataUrl?: string; // local preview
}

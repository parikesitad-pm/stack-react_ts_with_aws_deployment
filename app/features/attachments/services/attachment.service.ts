import type { Attachment } from '../types/attachment.types';

export const attachmentService = {
  formatTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  },

  async processFile(
    file: File,
    noteId: string,
    ownerSub: string
  ): Promise<{ attachment: Attachment; markdownSyntax: string }> {
    const isImage = file.type.startsWith('image/');
    const id = `att-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = this.formatTimestamp();

    if (isImage) {
      const { dataUrl, size } = await this.optimizeImage(file);
      const filename = `screenshot-${timestamp}.webp`;
      const localPath = `./assets/${filename}`;

      const attachment: Attachment = {
        id,
        ownerSub,
        noteId,
        name: filename,
        mimeType: 'image/webp',
        size,
        localPath,
        createdAt: new Date().toISOString(),
        syncStatus: 'local',
        dataUrl,
      };

      const markdownSyntax = `![Screenshot](${localPath})`;
      return { attachment, markdownSyntax };
    } else {
      // Document attachment (PDF, DOCX, ZIP, etc.)
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const localPath = `./attachments/${cleanName}`;

      const attachment: Attachment = {
        id,
        ownerSub,
        noteId,
        name: cleanName,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        localPath,
        createdAt: new Date().toISOString(),
        syncStatus: 'local',
      };

      const markdownSyntax = `[${file.name}](${localPath})`;
      return { attachment, markdownSyntax };
    }
  },

  async optimizeImage(
    file: File
  ): Promise<{ dataUrl: string; size: number }> {
    return new Promise((resolve) => {
      // If smaller than 150 KB, don't recompress aggressively
      if (file.size < 150 * 1024 && file.type === 'image/webp') {
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve({
            dataUrl: e.target?.result as string,
            size: file.size,
          });
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 2560;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: e.target?.result as string, size: file.size });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const webpDataUrl = canvas.toDataURL('image/webp', 0.82);
          // Estimate byte size from base64
          const estimatedSize = Math.round((webpDataUrl.length * 3) / 4);
          resolve({ dataUrl: webpDataUrl, size: estimatedSize });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  },
};

/**
 * Image Processing Service
 * Handles client-side optimization, resizing, format selection, EXIF stripping,
 * and memory management for images.
 */

export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_LONG_EDGE_PX = 2560;
export const WEBP_QUALITY = 0.82;
export const SMALL_IMAGE_THRESHOLD_BYTES = 150 * 1024; // 150 KB

export interface ProcessedImageResult {
  blob: Blob;
  mimeType: string;
  fileName: string;
  byteSize: number;
  width?: number;
  height?: number;
  wasOptimized: boolean;
}

export class ImageProcessingService {
  /**
   * Process and optimize an image file according to Sprint 5 rules:
   * 1. Max long edge: 2560px
   * 2. Quality ≈ 0.82 WebP
   * 3. Preserve small images (<= 150KB) already in WebP or JPEG
   * 4. Preserve GIF animations (never flatten)
   * 5. Preserve SVG safely without rasterizing
   */
  async process(
    file: File | Blob,
    originalFileName?: string
  ): Promise<ProcessedImageResult> {
    return this.processImage(file, originalFileName);
  }

  async processImage(
    file: File | Blob,
    originalFileName?: string
  ): Promise<ProcessedImageResult> {
    const fileName =
      originalFileName ||
      ('name' in file && typeof file.name === 'string' ? file.name : 'attachment');

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error('This file is too large for STACK (exceeds the 25MB limit).');
    }

    const mime = file.type.toLowerCase();
    const lowerName = fileName.toLowerCase();

    // 1. SVG: preserve as-is without rasterizing
    if (mime === 'image/svg+xml' || lowerName.endsWith('.svg')) {
      return {
        blob: file,
        mimeType: 'image/svg+xml',
        fileName: fileName.endsWith('.svg')
          ? fileName
          : `${fileName}.svg`,
        byteSize: file.size,
        wasOptimized: false,
      };
    }

    // 2. GIF: preserve original animation, do not flatten
    if (mime === 'image/gif' || lowerName.endsWith('.gif')) {
      return {
        blob: file,
        mimeType: 'image/gif',
        fileName: fileName.endsWith('.gif')
          ? fileName
          : `${fileName}.gif`,
        byteSize: file.size,
        wasOptimized: false,
      };
    }

    // 3. Small already-efficient images (<= 150KB and webp or jpeg): preserve as-is
    if (
      file.size <= SMALL_IMAGE_THRESHOLD_BYTES &&
      (mime === 'image/webp' || mime === 'image/jpeg')
    ) {
      return {
        blob: file,
        mimeType: mime,
        fileName,
        byteSize: file.size,
        wasOptimized: false,
      };
    }

    // 4. Raster images (PNG, JPEG, uncompressed WebP, AVIF, etc.): optimize via canvas
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Non-browser / headless environment fallback
      return {
        blob: file,
        mimeType: mime || 'image/webp',
        fileName,
        byteSize: file.size,
        wasOptimized: false,
      };
    }

    return await this.resizeAndEncodeWebP(file, fileName);
  }

  private async resizeAndEncodeWebP(
    file: File | Blob,
    fileName: string
  ): Promise<ProcessedImageResult> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      const cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      };

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width === 0 || height === 0) {
          cleanup();
          resolve({
            blob: file,
            mimeType: file.type || 'image/webp',
            fileName,
            byteSize: file.size,
            wasOptimized: false,
          });
          return;
        }

        // Calculate aspect-preserving dimensions if long edge exceeds 2560px
        const longEdge = Math.max(width, height);
        if (longEdge > MAX_LONG_EDGE_PX) {
          const ratio = MAX_LONG_EDGE_PX / longEdge;
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          cleanup();
          resolve({
            blob: file,
            mimeType: file.type || 'image/webp',
            fileName,
            byteSize: file.size,
            wasOptimized: false,
          });
          return;
        }

        // Draw image onto canvas (naturally discards camera EXIF / GPS metadata)
        ctx.drawImage(img, 0, 0, width, height);
        cleanup();

        canvas.toBlob(
          (blob) => {
            // Check if WebP encoding succeeded and is smaller than original
            if (blob && (blob.size < file.size || file.type !== 'image/webp')) {
              const baseName = fileName.replace(/\.[^/.]+$/, '');
              resolve({
                blob,
                mimeType: 'image/webp',
                fileName: `${baseName}.webp`,
                byteSize: blob.size,
                width,
                height,
                wasOptimized: true,
              });
            } else {
              // Fallback to original if conversion didn't improve size
              resolve({
                blob: file,
                mimeType: file.type || 'image/webp',
                fileName,
                byteSize: file.size,
                width,
                height,
                wasOptimized: false,
              });
            }
          },
          'image/webp',
          WEBP_QUALITY
        );
      };

      img.onerror = () => {
        cleanup();
        reject(new Error("STACK couldn't process this image."));
      };

      img.src = objectUrl;
    });
  }
}

export const imageProcessingService = new ImageProcessingService();

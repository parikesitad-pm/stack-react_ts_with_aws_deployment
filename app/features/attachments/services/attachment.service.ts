/**
 * Attachment Service
 * Central coordinator for attachment ingestion, processing, local persistence,
 * and Markdown syntax generation.
 */

import type { Attachment } from '../types/attachment.types';
import { classifyAttachmentKind } from '../schemas/attachment.schema';
import {
  imageProcessingService,
  MAX_ATTACHMENT_SIZE_BYTES,
} from './imageProcessing.service';
import { generateLogicalPath, extractAltText } from './attachmentPath.service';
import { attachmentRepository } from './attachment.repository';
import { attachmentUploadService } from './attachmentUpload.service';

export const attachmentService = {
  /**
   * Process a single file (image or generic document), persist binary locally in IndexedDB,
   * create an attachment record, and generate stable Markdown syntax.
   */
  async processFile(
    file: File,
    noteId: string,
    ownerSub: string,
    existingPaths: Set<string> = new Set()
  ): Promise<{ attachment: Attachment; markdownSyntax: string }> {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error('This file is too large for STACK.');
    }

    const isImage = file.type.startsWith('image/');
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (isImage) {
      // 1. Process image through client-side optimization pipeline
      const processed = await imageProcessingService.processImage(
        file,
        file.name
      );

      // 2. Generate collision-safe logical path
      const { logicalPath, fileName } = generateLogicalPath(
        processed.fileName,
        existingPaths
      );
      existingPaths.add(logicalPath);

      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      const attachment: Attachment = {
        id,
        noteId,
        logicalPath,
        fileName,
        mimeType: processed.mimeType,
        byteSize: processed.byteSize,
        kind: 'image',
        localState: 'available',
        cloudState: isOffline ? 'queued' : 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Persist binary Blob strictly scoped to user sub in IndexedDB
      await attachmentRepository.putAttachment(
        ownerSub,
        attachment,
        processed.blob
      );

      // 4. Enqueue cloud upload if online or queue for reconnect
      attachmentUploadService.enqueue(ownerSub, attachment, processed.blob);

      const altText = extractAltText(fileName);
      const markdownSyntax = `![${altText}](${logicalPath})`;

      return { attachment, markdownSyntax };
    } else {
      // Generic non-image attachment (PDF, DOCX, ZIP, etc.)
      const { logicalPath, fileName } = generateLogicalPath(
        file.name,
        existingPaths
      );
      existingPaths.add(logicalPath);

      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      const attachment: Attachment = {
        id,
        noteId,
        logicalPath,
        fileName,
        mimeType: file.type || 'application/octet-stream',
        byteSize: file.size,
        kind: classifyAttachmentKind(file.type, file.name),
        localState: 'available',
        cloudState: isOffline ? 'queued' : 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persist binary Blob to IndexedDB
      await attachmentRepository.putAttachment(ownerSub, attachment, file);

      // Enqueue cloud upload
      attachmentUploadService.enqueue(ownerSub, attachment, file);

      const markdownSyntax = `[${fileName}](${logicalPath})`;
      return { attachment, markdownSyntax };
    }
  },

  /**
   * Process multiple dropped or selected files deterministically
   */
  async processMultipleFiles(
    files: File[],
    noteId: string,
    ownerSub: string,
    existingPaths: Set<string> = new Set()
  ): Promise<{
    attachments: Attachment[];
    markdownSyntax: string;
    errors: { file: File; error: string }[];
  }> {
    const attachments: Attachment[] = [];
    const markdownSnippets: string[] = [];
    const errors: { file: File; error: string }[] = [];

    for (const file of files) {
      try {
        const result = await this.processFile(
          file,
          noteId,
          ownerSub,
          existingPaths
        );
        attachments.push(result.attachment);
        markdownSnippets.push(result.markdownSyntax);
      } catch (err) {
        errors.push({
          file,
          error: (err as Error).message || 'Failed to process file',
        });
      }
    }

    return {
      attachments,
      markdownSyntax: markdownSnippets.join('\n\n'),
      errors,
    };
  },
};

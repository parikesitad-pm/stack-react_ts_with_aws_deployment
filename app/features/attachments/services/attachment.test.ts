import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { attachmentPathService } from './attachmentPath.service';
import { imageProcessingService } from './imageProcessing.service';
import { attachmentRepository } from './attachment.repository';
import { objectUrlCache } from './objectUrlCache.service';
import { attachmentResolver } from './attachmentResolver.service';
import { attachmentUploadService } from './attachmentUpload.service';
import { classifyAttachmentKind } from '../schemas/attachment.schema';
import { userWorkspaceStorage } from '~/features/workspace/services/userWorkspaceStorage';
import type { Attachment } from '../types/attachment.types';

describe('Sprint 5: Images, Attachments & Offline Resilience Contracts', () => {
  const SUB_ALICE = 'auth0|operator_alice_s5';
  const SUB_BOB = 'auth0|operator_bob_s5';
  const NOTE_1 = 'note_s5_001';
  const NOTE_2 = 'note_s5_002';

  beforeEach(async () => {
    // Clean up memory partitions and active sub
    attachmentRepository.setActiveSub(null);
    objectUrlCache.clearAll();
    attachmentUploadService.clearUser(SUB_ALICE);
    attachmentUploadService.clearUser(SUB_BOB);
    await userWorkspaceStorage.clearUserData(SUB_ALICE);
    await userWorkspaceStorage.clearUserData(SUB_BOB);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Logical Paths, Sanitization & Collision Resolution', () => {
    it('sanitizes unsafe filenames for predictable filesystem and URL behavior', () => {
      expect(
        attachmentPathService.sanitizeFileName('My Photo (1) - Final!.PNG')
      ).toBe('my-photo-1-final.png');
      expect(
        attachmentPathService.sanitizeFileName('../../etc/passwd.txt')
      ).toBe('etc-passwd.txt');
      expect(attachmentPathService.sanitizeFileName('   ')).toBe('attachment');
      expect(
        attachmentPathService.sanitizeFileName(
          'complex name [with] symbols & spaces.pdf'
        )
      ).toBe('complex-name-with-symbols-spaces.pdf');
    });

    it('extracts human-readable alt text from filenames', () => {
      expect(
        attachmentPathService.extractAltText('server-architecture-diagram.webp')
      ).toBe('server architecture diagram');
      expect(
        attachmentPathService.extractAltText('annual_financial_report_2026.pdf')
      ).toBe('annual financial report 2026');
      expect(attachmentPathService.extractAltText('.png')).toBe('image');
    });

    it('generates logical path and avoids collisions with numeric suffixes', () => {
      const existing = new Set([
        './assets/blueprint.webp',
        './assets/blueprint-2.webp',
      ]);
      const path1 = attachmentPathService.generateLogicalPath(
        'blueprint.webp',
        new Set()
      );
      expect(path1.logicalPath).toBe('./assets/blueprint.webp');

      const path2 = attachmentPathService.generateLogicalPath(
        'blueprint.webp',
        existing
      );
      expect(path2.logicalPath).toBe('./assets/blueprint-3.webp');
    });
  });

  describe('2. Client-Side Image Processing & Optimization Invariants', () => {
    it('rejects files larger than 25MB immediately with truthful error', async () => {
      const largeFile = new File(
        [new Uint8Array(26 * 1024 * 1024)],
        'giant.png',
        {
          type: 'image/png',
        }
      );
      await expect(imageProcessingService.process(largeFile)).rejects.toThrow(
        /exceeds the 25MB limit/i
      );
    });

    it('preserves SVG files without rasterization or alteration', async () => {
      const svgContent =
        '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';
      const svgFile = new File([svgContent], 'vector.svg', {
        type: 'image/svg+xml',
      });

      const result = await imageProcessingService.process(svgFile);
      expect(result.mimeType).toBe('image/svg+xml');
      expect(result.fileName).toBe('vector.svg');
      expect(result.wasOptimized).toBe(false);
      expect(await result.blob.text()).toBe(svgContent);
    });

    it('preserves animated GIF files to prevent flattening frames', async () => {
      const gifBytes = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
      ]);
      const gifFile = new File([gifBytes], 'anim.gif', { type: 'image/gif' });

      const result = await imageProcessingService.process(gifFile);
      expect(result.mimeType).toBe('image/gif');
      expect(result.fileName).toBe('anim.gif');
      expect(result.wasOptimized).toBe(false);
    });

    it('preserves already small WebP and JPEG images (<= 150KB) only if long edge <= 2560px', async () => {
      const smallBytes = new Uint8Array(50 * 1024); // 50KB
      const smallWebpFile = new File([smallBytes], 'thumbnail.webp', {
        type: 'image/webp',
      });
      (smallWebpFile as any)._dimensions = { width: 800, height: 600 };

      const result = await imageProcessingService.process(smallWebpFile);
      expect(result.mimeType).toBe('image/webp');
      expect(result.wasOptimized).toBe(false);
    });

    it('optimizes small WebP and JPEG images (<= 150KB) if long edge exceeds 2560px', async () => {
      const smallBytes = new Uint8Array(50 * 1024); // 50KB
      const wideBannerFile = new File([smallBytes], 'banner.webp', {
        type: 'image/webp',
      });
      (wideBannerFile as any)._dimensions = { width: 3200, height: 100 };

      const result = await imageProcessingService.process(wideBannerFile);
      expect(result.wasOptimized).toBe(true);
    });

    it('passes non-image documents through directly', async () => {
      const pdfBytes = new Uint8Array(2048);
      const pdfFile = new File([pdfBytes], 'contract.pdf', {
        type: 'application/pdf',
      });

      const result = await imageProcessingService.process(pdfFile);
      expect(result.mimeType).toBe('application/pdf');
      expect(result.fileName).toBe('contract.pdf');
      expect(result.wasOptimized).toBe(false);
    });
  });

  describe('3. Per-User IndexedDB Binary Storage & Multi-User Isolation', () => {
    it('persists attachment binary blob scoped strictly to user Auth0 sub', async () => {
      const blob = new Blob(['attachment data'], { type: 'application/pdf' });
      const attachment: Attachment = {
        id: 'att_01',
        noteId: NOTE_1,
        logicalPath: './assets/contract.pdf',
        fileName: 'contract.pdf',
        mimeType: 'application/pdf',
        byteSize: blob.size,
        kind: 'document',
        localState: 'available',
        cloudState: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await attachmentRepository.putAttachment(SUB_ALICE, attachment, blob);

      // Alice can read her attachment
      const stored = await attachmentRepository.getAttachment(
        './assets/contract.pdf',
        SUB_ALICE
      );
      expect(stored).not.toBeNull();
      expect(stored?.mimeType).toBe('application/pdf');
      expect(stored?.attachment?.id).toBe('att_01');

      // Bob CANNOT access Alice\'s attachment
      const bobsResult = await attachmentRepository.getAttachment(
        './assets/contract.pdf',
        SUB_BOB
      );
      expect(bobsResult).toBeNull();
    });

    it('survives logout and refresh: Alice logs out, Bob logs in, Alice logs back in', async () => {
      const blob = new Blob(['secret photo'], { type: 'image/webp' });
      const attachment: Attachment = {
        id: 'att_02',
        noteId: NOTE_1,
        logicalPath: './assets/secret.webp',
        fileName: 'secret.webp',
        mimeType: 'image/webp',
        byteSize: blob.size,
        kind: 'image',
        localState: 'available',
        cloudState: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Alice saves photo
      await attachmentRepository.putAttachment(SUB_ALICE, attachment, blob);

      // 2. Alice logs out (simulated by clearing active sub and connection)
      attachmentRepository.setActiveSub(null);
      userWorkspaceStorage.closeConnection(SUB_ALICE);

      // 3. Bob logs in
      attachmentRepository.setActiveSub(SUB_BOB);
      const bobAttempt = await attachmentRepository.getAttachment(
        './assets/secret.webp'
      );
      expect(bobAttempt).toBeNull();

      // 4. Bob logs out, Alice logs back in
      attachmentRepository.setActiveSub(SUB_ALICE);
      const aliceRetrieved = await attachmentRepository.getAttachment(
        './assets/secret.webp'
      );
      expect(aliceRetrieved).not.toBeNull();
      expect(aliceRetrieved?.attachment?.id).toBe('att_02');
    });

    it('cleans up note attachments upon permanent delete, preserves on archive/trash', async () => {
      const blob = new Blob(['diagram'], { type: 'image/webp' });
      const att1: Attachment = {
        id: 'att_note1',
        noteId: NOTE_1,
        logicalPath: './assets/diag1.webp',
        fileName: 'diag1.webp',
        mimeType: 'image/webp',
        byteSize: blob.size,
        kind: 'image',
        localState: 'available',
        cloudState: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const att2: Attachment = {
        id: 'att_note2',
        noteId: NOTE_2,
        logicalPath: './assets/diag2.webp',
        fileName: 'diag2.webp',
        mimeType: 'image/webp',
        byteSize: blob.size,
        kind: 'image',
        localState: 'available',
        cloudState: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await attachmentRepository.putAttachment(SUB_ALICE, att1, blob);
      await attachmentRepository.putAttachment(SUB_ALICE, att2, blob);

      expect(
        await attachmentRepository.findByNoteId(NOTE_1, SUB_ALICE)
      ).toHaveLength(1);
      expect(
        await attachmentRepository.findByNoteId(NOTE_2, SUB_ALICE)
      ).toHaveLength(1);

      // Permanent delete of NOTE_1 cleans only its attachments
      await attachmentRepository.deleteAttachmentsByNoteId(NOTE_1, SUB_ALICE);
      expect(
        await attachmentRepository.findByNoteId(NOTE_1, SUB_ALICE)
      ).toHaveLength(0);
      expect(
        await attachmentRepository.findByNoteId(NOTE_2, SUB_ALICE)
      ).toHaveLength(1);
    });

    it('supports identical logicalPath across different notes without cross-contamination', async () => {
      const blobA = new Blob(['Image for Note A'], { type: 'image/webp' });
      const attA: Attachment = {
        id: 'att_note_a',
        noteId: NOTE_1,
        logicalPath: './assets/screenshot.webp',
        fileName: 'screenshot.webp',
        mimeType: 'image/webp',
        byteSize: blobA.size,
        kind: 'image',
        localState: 'available',
        cloudState: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const blobB = new Blob(['Image for Note B (Different)'], {
        type: 'image/webp',
      });
      const attB: Attachment = {
        id: 'att_note_b',
        noteId: NOTE_2,
        logicalPath: './assets/screenshot.webp', // SAME relative path!
        fileName: 'screenshot.webp',
        mimeType: 'image/webp',
        byteSize: blobB.size,
        kind: 'image',
        localState: 'available',
        cloudState: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await attachmentRepository.putAttachment(SUB_ALICE, attA, blobA);
      await attachmentRepository.putAttachment(SUB_ALICE, attB, blobB);

      // Note 1 retrieval returns attA
      const resA = await attachmentRepository.getAttachmentByPath(
        SUB_ALICE,
        NOTE_1,
        './assets/screenshot.webp'
      );
      expect(resA).not.toBeNull();
      expect(resA?.attachment?.id).toBe('att_note_a');
      expect(await resA?.blob.text()).toBe('Image for Note A');

      // Note 2 retrieval returns attB
      const resB = await attachmentRepository.getAttachmentByPath(
        SUB_ALICE,
        NOTE_2,
        './assets/screenshot.webp'
      );
      expect(resB).not.toBeNull();
      expect(resB?.attachment?.id).toBe('att_note_b');
      expect(await resB?.blob.text()).toBe('Image for Note B (Different)');

      // getAttachmentBlob(sub, noteId, logicalPath) returns respective blobs
      const blobFromA = await attachmentRepository.getAttachmentBlob(
        SUB_ALICE,
        NOTE_1,
        './assets/screenshot.webp'
      );
      const blobFromB = await attachmentRepository.getAttachmentBlob(
        SUB_ALICE,
        NOTE_2,
        './assets/screenshot.webp'
      );
      expect(await blobFromA?.text()).toBe('Image for Note A');
      expect(await blobFromB?.text()).toBe('Image for Note B (Different)');
    });
  });

  describe('4. Reference-Counted Object URL Cache', () => {
    it('shares the exact same object URL across multiple consumers and revokes only when count reaches 0', () => {
      let createdUrlCount = 0;
      let revokedUrlCount = 0;

      const mockCreate = () => {
        createdUrlCount++;
        return `blob:http://localhost/mock-${createdUrlCount}`;
      };

      // Mock URL.revokeObjectURL
      const originalRevoke = URL.revokeObjectURL;
      URL.revokeObjectURL = vi.fn(() => {
        revokedUrlCount++;
      });

      try {
        const key = 'user1:./assets/photo.webp';

        // Consumer 1 acquires (e.g. Split editor preview)
        const url1 = objectUrlCache.acquire(key, 'user1', mockCreate);
        expect(createdUrlCount).toBe(1);
        expect(objectUrlCache.getRefCount(key)).toBe(1);

        // Consumer 2 acquires (e.g. Read view or duplicate reference)
        const url2 = objectUrlCache.acquire(key, 'user1', mockCreate);
        expect(createdUrlCount).toBe(1); // Reused! No extra createObjectURL
        expect(url2).toBe(url1);
        expect(objectUrlCache.getRefCount(key)).toBe(2);

        // Consumer 1 unmounts
        objectUrlCache.release(key);
        expect(objectUrlCache.getRefCount(key)).toBe(1);
        expect(revokedUrlCount).toBe(0); // Still active for Consumer 2!

        // Consumer 2 unmounts
        objectUrlCache.release(key);
        expect(objectUrlCache.getRefCount(key)).toBe(0);
        expect(revokedUrlCount).toBe(1); // Revoked now!
      } finally {
        URL.revokeObjectURL = originalRevoke;
      }
    });

    it('clearUser revokes all object URLs for a specific user without affecting other users', () => {
      const revoked: string[] = [];
      const originalRevoke = URL.revokeObjectURL;
      URL.revokeObjectURL = vi.fn((url) => revoked.push(url));

      try {
        objectUrlCache.acquire('userA:img1', 'userA', () => 'blob:userA-1');
        objectUrlCache.acquire('userA:img2', 'userA', () => 'blob:userA-2');
        objectUrlCache.acquire('userB:img1', 'userB', () => 'blob:userB-1');

        objectUrlCache.clearUser('userA');

        expect(revoked).toEqual(['blob:userA-1', 'blob:userA-2']);
        expect(objectUrlCache.getUrl('userA:img1')).toBeNull();
        expect(objectUrlCache.getUrl('userB:img1')).toBe('blob:userB-1');
      } finally {
        URL.revokeObjectURL = originalRevoke;
      }
    });
  });

  describe('5. Shared Attachment Resolver Service', () => {
    it('passes external HTTP/HTTPS URLs straight through without wrapping', async () => {
      const httpsUrl = 'https://images.unsplash.com/photo-12345';
      const resolved = await attachmentResolver.acquire(httpsUrl);
      expect(resolved).toBe(httpsUrl);
    });

    it('resolves internal logical path to managed object URL and fails gracefully if missing', async () => {
      attachmentRepository.setActiveSub(SUB_ALICE);
      const blob = new Blob(['hello world'], { type: 'text/plain' });
      const att: Attachment = {
        id: 'att_text',
        noteId: NOTE_1,
        logicalPath: './assets/notes.txt',
        fileName: 'notes.txt',
        mimeType: 'text/plain',
        byteSize: blob.size,
        kind: 'text',
        localState: 'available',
        cloudState: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await attachmentRepository.putAttachment(SUB_ALICE, att, blob);

      const resolvedUrl =
        await attachmentResolver.acquire('./assets/notes.txt');
      expect(resolvedUrl).toBeTruthy();

      // Trying to resolve a missing path throws explicit error
      await expect(
        attachmentResolver.acquire('./assets/nonexistent.png')
      ).rejects.toThrow(/This attachment isn't available on this device/i);

      // Release cleans up
      attachmentResolver.release('./assets/notes.txt');
    });

    it('Undo/Redo safety: removing markdown reference does not delete binary, redo restores preview', async () => {
      attachmentRepository.setActiveSub(SUB_ALICE);
      const blob = new Blob(['diagram binary content'], { type: 'image/webp' });
      const att: Attachment = {
        id: 'att_undo_test',
        noteId: NOTE_1,
        logicalPath: './assets/diagram.webp',
        fileName: 'diagram.webp',
        mimeType: 'image/webp',
        byteSize: blob.size,
        kind: 'image',
        localState: 'available',
        cloudState: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Initial paste / attachment insertion
      await attachmentRepository.putAttachment(SUB_ALICE, att, blob);
      const url1 = await attachmentResolver.acquire(
        './assets/diagram.webp',
        NOTE_1
      );
      expect(url1).toBeTruthy();

      // 2. User presses Ctrl+Z (Markdown text is undone / removed)
      // Component unmounts preview reference
      attachmentResolver.release('./assets/diagram.webp', NOTE_1);

      // Binary MUST still exist in repository!
      const stillThere = await attachmentRepository.getAttachmentByPath(
        SUB_ALICE,
        NOTE_1,
        './assets/diagram.webp'
      );
      expect(stillThere).not.toBeNull();
      expect(await stillThere?.blob.text()).toBe('diagram binary content');

      // 3. User presses Ctrl+Shift+Z (Redo restores markdown text)
      // Component mounts and resolves again: MUST succeed without broken image!
      const url2 = await attachmentResolver.acquire(
        './assets/diagram.webp',
        NOTE_1
      );
      expect(url2).toBeTruthy();
      attachmentResolver.release('./assets/diagram.webp', NOTE_1);
    });
  });

  describe('6. Offline Resilience & Cloud Truthfulness', () => {
    it('truthfully keeps attachments as local-only when no cloud backend is configured', async () => {
      const blob = new Blob(['offline data'], { type: 'application/pdf' });
      const att: Attachment = {
        id: 'att_offline',
        noteId: NOTE_1,
        logicalPath: './assets/offline.pdf',
        fileName: 'offline.pdf',
        mimeType: 'application/pdf',
        byteSize: blob.size,
        kind: 'document',
        localState: 'available',
        cloudState: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save locally first
      await attachmentRepository.putAttachment(SUB_ALICE, att, blob);

      // Enqueue upload
      attachmentUploadService.enqueue(SUB_ALICE, att, blob);

      const status = attachmentUploadService.getStatus();
      expect(status.cloudAvailable).toBe(false);
      expect(status.queuedCount).toBe(0); // Not claimed to be uploading
      expect(status.isOnline).toBe(true);

      // Inspect attachment state remains local-only
      const stored = await attachmentRepository.getAttachment(
        './assets/offline.pdf',
        SUB_ALICE
      );
      expect(stored?.attachment?.cloudState).toBe('local-only');
    });

    it('resumes pending queued uploads from durable IndexedDB storage', async () => {
      const blob = new Blob(['queued payload'], { type: 'application/pdf' });
      const att: Attachment = {
        id: 'att_resumable_queue',
        noteId: NOTE_1,
        logicalPath: './assets/queued.pdf',
        fileName: 'queued.pdf',
        mimeType: 'application/pdf',
        byteSize: blob.size,
        kind: 'document',
        localState: 'available',
        cloudState: 'queued', // Queued in IndexedDB
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persist to storage
      await attachmentRepository.putAttachment(SUB_ALICE, att, blob);

      // Verify queue is currently empty in memory
      attachmentUploadService.resetForTesting();
      expect(attachmentUploadService.getPendingCount()).toBe(0);

      // Resume from storage
      await attachmentUploadService.resumeQueueFromStorage(SUB_ALICE);

      // Queue has resumed the pending item
      expect(attachmentUploadService.getPendingCount()).toBe(1);
    });
  });

  describe('7. Attachment Classification', () => {
    it('classifies MIME types accurately into domain categories', () => {
      expect(classifyAttachmentKind('image/png')).toBe('image');
      expect(classifyAttachmentKind('image/svg+xml')).toBe('image');
      expect(classifyAttachmentKind('application/pdf')).toBe('document');
      expect(classifyAttachmentKind('text/markdown')).toBe('text');
      expect(classifyAttachmentKind('application/zip')).toBe('archive');
      expect(
        classifyAttachmentKind(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
      ).toBe('spreadsheet');
      expect(classifyAttachmentKind('video/mp4')).toBe('other');
    });
  });
});

import { hashSub } from '~/features/workspace/services/userWorkspaceStorage';
import { IdentityService } from './identity.service';
import type { UserProfile } from '../schemas/username.schema';

export interface ProcessedAvatarResult {
  blob: Blob;
  width: number;
  height: number;
}

export interface UploadAvatarResult {
  avatarKey: string;
  avatarVersion: string;
  avatarUrl: string;
  profile: UserProfile;
}

export class AvatarService {
  /**
   * Client-side canvas center-square crop and resize to WebP (max 512x512)
   */
  static async cropAndResizeToWebp(
    file: File,
    maxDim = 512,
    quality = 0.85
  ): Promise<ProcessedAvatarResult> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // In SSR/Node test environment, return raw blob as fallback
      return {
        blob: file,
        width: maxDim,
        height: maxDim,
      };
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        // Center square crop
        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        const targetDim = Math.min(minSide, maxDim);

        const canvas = document.createElement('canvas');
        canvas.width = targetDim;
        canvas.height = targetDim;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('CANVAS_CONTEXT_UNAVAILABLE'));
          return;
        }

        // Draw cropped & scaled square
        ctx.drawImage(
          img,
          startX,
          startY,
          minSide,
          minSide,
          0,
          0,
          targetDim,
          targetDim
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('WEBP_ENCODING_FAILED'));
              return;
            }
            resolve({
              blob,
              width: targetDim,
              height: targetDim,
            });
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('IMAGE_LOAD_FAILED'));
      };

      img.src = objectUrl;
    });
  }

  /**
   * Processes, uploads to S3, and commits avatarKey & avatarVersion to backend profile.
   * Invariant: Never stores expiring S3 presigned URLs in profile JSON.
   */
  static async uploadAvatar(
    file: File,
    sub: string,
    token: string
  ): Promise<UploadAvatarResult> {
    const processed = await this.cropAndResizeToWebp(file);
    const version = Date.now().toString();
    const avatarKey = `profiles/${hashSub(sub)}/avatar/${version}.webp`;

    const apiBase = IdentityService.getApiBaseUrl();
    if (apiBase) {
      // 1. Get presigned upload URL
      const presignRes = await fetch(`${apiBase}/me/avatar/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType: 'image/webp',
          key: avatarKey,
        }),
      });

      if (!presignRes.ok) {
        throw new Error('FAILED_TO_GET_AVATAR_UPLOAD_URL');
      }

      const { uploadUrl } = (await presignRes.json()) as { uploadUrl: string };

      // 2. Upload directly to S3
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/webp',
        },
        body: processed.blob,
      });

      if (!s3Res.ok) {
        throw new Error('S3_AVATAR_UPLOAD_FAILED');
      }

      // 3. Commit avatarKey & avatarVersion to profile
      const commitRes = await fetch(`${apiBase}/me/avatar/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatarKey,
          avatarVersion: version,
        }),
      });

      if (!commitRes.ok) {
        throw new Error('FAILED_TO_COMMIT_AVATAR');
      }

      const profile = (await commitRes.json()) as UserProfile;
      return {
        avatarKey,
        avatarVersion: version,
        avatarUrl: profile.avatarUrl || URL.createObjectURL(processed.blob),
        profile,
      };
    }

    // Dev/Test simulation
    let localUrl = '';
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      try {
        localUrl = URL.createObjectURL(processed.blob);
      } catch {}
    }

    const updatedProfile = await IdentityService.updateProfile(
      {
        avatarKey,
        avatarVersion: version,
      },
      token
    );

    // Attach local runtime URL for instant preview
    updatedProfile.avatarUrl = localUrl;

    return {
      avatarKey,
      avatarVersion: version,
      avatarUrl: localUrl,
      profile: updatedProfile,
    };
  }
}

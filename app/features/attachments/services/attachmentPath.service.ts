/**
 * Attachment Path Service
 * Generates stable, sanitized logical Markdown paths and handles filename collisions.
 */

export function sanitizeFileName(rawName: string): string {
  // Strip null bytes and control characters
  let clean = rawName.replace(/[\x00-\x1f\x7f]/g, '');

  // Strip path traversal attempts and separators (/ and \)
  clean = clean.replace(/^[./\\]+/, '').replace(/[/\\]/g, '-');

  // Convert to lowercase for predictable filesystem and URL behavior
  clean = clean.toLowerCase();

  const extIdx = clean.lastIndexOf('.');
  const ext = extIdx > 0 ? clean.slice(extIdx) : '';
  const base = extIdx > 0 ? clean.slice(0, extIdx) : clean;

  const cleanBase = base
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const cleanExt = ext.replace(/[^a-z0-9.]/g, '').toLowerCase();

  clean = cleanBase ? `${cleanBase}${cleanExt}` : `attachment${cleanExt}`;

  // If name became empty or only dots
  if (!clean || /^(\.)+$/.test(clean)) {
    clean = 'attachment';
  }

  // Cap filename length to 120 chars while preserving extension
  if (clean.length > 120) {
    if (cleanExt.length > 0 && clean.length - cleanExt.length <= 110) {
      const b = cleanBase.slice(0, 120 - cleanExt.length);
      clean = `${b}${cleanExt}`;
    } else {
      clean = clean.slice(0, 120);
    }
  }

  return clean;
}

export function generateLogicalPath(
  fileName: string,
  existingPaths: Set<string>
): { logicalPath: string; fileName: string } {
  const sanitized = sanitizeFileName(fileName);
  const extIdx = sanitized.lastIndexOf('.');
  const base = extIdx > 0 ? sanitized.slice(0, extIdx) : sanitized;
  const ext = extIdx > 0 ? sanitized.slice(extIdx) : '';

  let candidateName = sanitized;
  let candidatePath = `./assets/${candidateName}`;
  let counter = 2;

  while (existingPaths.has(candidatePath)) {
    candidateName = `${base}-${counter}${ext}`;
    candidatePath = `./assets/${candidateName}`;
    counter++;
  }

  return {
    logicalPath: candidatePath,
    fileName: candidateName,
  };
}

export function extractAltText(fileName: string): string {
  const extIdx = fileName.lastIndexOf('.');
  const base =
    extIdx > 0 ? fileName.slice(0, extIdx) : extIdx === 0 ? '' : fileName;
  // Convert hyphens and underscores to spaces for clean readable alt text
  const text = base.replace(/[-_]+/g, ' ').trim();
  return text || 'image';
}

export const attachmentPathService = {
  sanitizeFileName,
  generateLogicalPath,
  extractAltText,
};

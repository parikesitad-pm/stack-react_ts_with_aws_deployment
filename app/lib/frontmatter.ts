export interface ParsedNoteContent {
  frontmatter: Record<string, string | string[]>;
  body: string;
}

export function parseFrontmatter(rawContent: string): ParsedNoteContent {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: rawContent };
  }

  const yamlBlock = match[1] ?? '';
  const body = match[2] ?? '';
  const frontmatter: Record<string, string | string[]> = {};

  yamlBlock.split(/\r?\n/).forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();

      if (val.startsWith('[') && val.endsWith(']')) {
        // Simple array: [tag1, tag2]
        const items = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
        frontmatter[key] = items;
      } else {
        frontmatter[key] = val.replace(/^['"]|['"]$/g, '');
      }
    }
  });

  return { frontmatter, body };
}

export function serializeFrontmatter(
  frontmatter: Record<string, string | string[]>,
  body: string
): string {
  if (Object.keys(frontmatter).length === 0) return body;

  const lines = ['---'];
  for (const [key, val] of Object.entries(frontmatter)) {
    if (Array.isArray(val)) {
      lines.push(`${key}: [${val.map((v) => `"${v}"`).join(', ')}]`);
    } else {
      lines.push(`${key}: "${val}"`);
    }
  }
  lines.push('---');
  lines.push('');
  lines.push(body);
  return lines.join('\n');
}

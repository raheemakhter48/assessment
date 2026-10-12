import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Converts raw text or basic markdown (.txt / .md) into semantic HTML for TipTap.
 */
export function parseTextToHtml(raw: string, filename: string): string {
  if (!raw || !raw.trim()) {
    return '<p></p>';
  }

  const isMarkdown = filename.toLowerCase().endsWith('.md');

  if (!isMarkdown) {
    // Plain text: split by double newlines into paragraphs, preserve single breaks with <br/>
    return raw
      .split(/\r?\n\r?\n/)
      .map((para) => `<p>${escapeHtml(para).replace(/\r?\n/g, '<br/>')}</p>`)
      .join('');
  }

  // Basic markdown parser
  const lines = raw.split(/\r?\n/);
  const htmlParts: string[] = [];
  let inBulletList = false;
  let inNumberedList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Bullet list
    const bulletMatch = line.match(/^(\*|-)\s+(.*)$/);
    if (bulletMatch) {
      if (!inBulletList) {
        if (inNumberedList) {
          htmlParts.push('</ol>');
          inNumberedList = false;
        }
        htmlParts.push('<ul>');
        inBulletList = true;
      }
      htmlParts.push(`<li>${formatInline(bulletMatch[2])}</li>`);
      continue;
    } else if (inBulletList) {
      htmlParts.push('</ul>');
      inBulletList = false;
    }

    // Numbered list
    const numberedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      if (!inNumberedList) {
        if (inBulletList) {
          htmlParts.push('</ul>');
          inBulletList = false;
        }
        htmlParts.push('<ol>');
        inNumberedList = true;
      }
      htmlParts.push(`<li>${formatInline(numberedMatch[1])}</li>`);
      continue;
    } else if (inNumberedList) {
      htmlParts.push('</ol>');
      inNumberedList = false;
    }

    // Empty line
    if (!line.trim()) {
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      htmlParts.push(`<h1>${formatInline(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      htmlParts.push(`<h2>${formatInline(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      htmlParts.push(`<h3>${formatInline(line.slice(4))}</h3>`);
    } else if (line.startsWith('> ')) {
      htmlParts.push(`<blockquote><p>${formatInline(line.slice(2))}</p></blockquote>`);
    } else {
      htmlParts.push(`<p>${formatInline(line)}</p>`);
    }
  }

  if (inBulletList) htmlParts.push('</ul>');
  if (inNumberedList) htmlParts.push('</ol>');

  return htmlParts.join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInline(text: string): string {
  let res = escapeHtml(text);
  // Bold **text**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Code `text`
  res = res.replace(/`(.*?)`/g, '<code>$1</code>');
  return res;
}

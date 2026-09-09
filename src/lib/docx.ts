import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
]

export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] })
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Plain text -> paragraphs. Blank lines split, single newlines become <br>. */
export function textToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** Sanitized HTML -> plain text, for round-tripping into the editor. */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return Array.from(doc.body.children)
    .map((el) => (el.textContent ?? '').trim())
    .filter(Boolean)
    .join('\n\n')
}

class DocxError extends Error {}

export async function importDocx(file: File): Promise<string> {
  let value: string
  try {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    ;({ value } = await mammoth.convertToHtml({ arrayBuffer }))
  } catch {
    // jszip/mammoth errors are unreadable on a teleprompter - say the useful part
    throw new DocxError(`Could not read "${file.name}". Is it a real .docx file?`)
  }

  const html = sanitize(value)
  if (!html.replace(/<[^>]*>/g, '').trim()) {
    throw new DocxError(`"${file.name}" has no readable text.`)
  }
  return html
}

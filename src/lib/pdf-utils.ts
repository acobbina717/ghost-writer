/**
 * Shared PDF utilities — used by both preview iframes and PDF generation.
 */

import { LETTER_CSS } from '../../convex/constants';

const WATERMARK_CSS = `
  body::after {
    content: 'Sample Letter';
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 64px;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.06);
    pointer-events: none;
    z-index: 9999;
    white-space: nowrap;
  }
`;

/** Wrap hydrated HTML in a full document with standard letter styling */
export function wrapHtmlForPreview(html: string, watermark?: boolean): string {
  const styles = watermark ? LETTER_CSS + WATERMARK_CSS : LETTER_CSS;
  return `<!DOCTYPE html>
<html>
  <head><style>${styles}</style></head>
  <body>${html}</body>
</html>`;
}

/** Decode a base64-encoded PDF and trigger a browser download */
export function downloadBase64Pdf(base64: string, filename: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

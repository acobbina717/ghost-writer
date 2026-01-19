import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

/**
 * Custom Tiptap extension to sanitize pasted content from Word/PDF documents.
 * Strips style tags, class attributes, id attributes, and inline styles
 * while preserving the text content and basic structure.
 */
export const PasteSanitizer = Extension.create({
  name: 'pasteSanitizer',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          transformPastedHTML(html: string) {
            // Remove <style> tags and their contents
            let cleaned = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

            // Remove <script> tags and their contents (security)
            cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

            // Remove class attributes
            cleaned = cleaned.replace(/\s+class\s*=\s*["'][^"']*["']/gi, '');

            // Remove id attributes
            cleaned = cleaned.replace(/\s+id\s*=\s*["'][^"']*["']/gi, '');

            // Remove inline style attributes
            cleaned = cleaned.replace(/\s+style\s*=\s*["'][^"']*["']/gi, '');

            // Remove data-* attributes
            cleaned = cleaned.replace(/\s+data-[a-z0-9-]*\s*=\s*["'][^"']*["']/gi, '');

            // Remove Microsoft Office specific tags
            cleaned = cleaned.replace(/<o:p[^>]*>[\s\S]*?<\/o:p>/gi, '');
            cleaned = cleaned.replace(/<\/?o:[^>]*>/gi, '');

            // Remove empty spans
            cleaned = cleaned.replace(/<span\s*>\s*<\/span>/gi, '');

            // Clean up excessive whitespace
            cleaned = cleaned.replace(/\s{2,}/g, ' ');

            return cleaned;
          },

          // Handle plain text paste to wrap in paragraph
          transformPastedText(text: string) {
            // Preserve smart tags that might be in plain text
            return text;
          },
        },
      }),
    ];
  },
});


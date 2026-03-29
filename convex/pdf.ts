"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { FilterXSS } from "xss";
import { LETTER_CSS } from "./constants";

const MAX_HTML_BYTES = 500_000; // ~500KB ceiling for payloads

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'blockquote', 'hr'];

const ALLOWED_ATTR_MAP: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  td: ['colspan', 'rowspan', 'style'],
  th: ['colspan', 'rowspan', 'style'],
  span: ['style'],
  p: ['style'],
  h1: ['style'],
  h2: ['style'],
  h3: ['style'],
  h4: ['style'],
  h5: ['style'],
  h6: ['style'],
};

const SAFE_CSS_PROPERTIES = new Set([
  'text-align',
  'font-family',
  'font-size',
  'line-height',
]);

function sanitizeStyle(value: string): string {
  return value
    .split(';')
    .map((decl) => decl.trim())
    .filter((decl) => {
      const prop = decl.split(':')[0]?.trim().toLowerCase();
      return prop && SAFE_CSS_PROPERTIES.has(prop);
    })
    .join('; ');
}

const xssFilter = new FilterXSS({
  whiteList: Object.fromEntries(
    ALLOWED_TAGS.map((tag) => [tag, ALLOWED_ATTR_MAP[tag] ?? []])
  ),
  stripIgnoreTag: true,
  onTagAttr(tag, name, value) {
    if (name !== 'style') return undefined;
    const cleaned = sanitizeStyle(value);
    if (!cleaned) return '';
    return `${name}="${cleaned}"`;
  },
});

function sanitizeHtml(html: string): string {
  return xssFilter.process(html);
}

/**
 * Generate PDF from HTML using Browserless
 *
 * Note: This returns the PDF as base64 since Convex actions can't stream binary.
 * The client should decode and download the base64 string.
 */
export const generatePdf = action({
  args: {
    html: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Validate HTML size
    const htmlSize = new TextEncoder().encode(args.html).length;
    if (htmlSize > MAX_HTML_BYTES) {
      throw new Error("HTML payload too large");
    }

    // Sanitize HTML
    const sanitizedHtml = sanitizeHtml(args.html);

    // Get API key from environment
    const apiKey = process.env.BROWSERLESS_API_KEY;
    if (!apiKey) {
      throw new Error("PDF service not configured");
    }

    const browserlessUrl = process.env.BROWSERLESS_API_URL || 'https://chrome.browserless.io/pdf';

    // Build styled HTML — Arial is a system font, no @import needed
    const styledHtml = `
      <html>
        <head>
          <style>${LETTER_CSS}</style>
        </head>
        <body>${sanitizedHtml}</body>
      </html>
    `;

    // Call Browserless API
    const response = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        html: styledHtml,
        options: {
          format: 'Letter',
          printBackground: true,
          margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' },
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    // Convert to base64 for transport
    const pdfBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(pdfBuffer).toString('base64');

    return {
      base64,
      filename: `dispute-letter-${Date.now()}.pdf`,
    };
  },
});

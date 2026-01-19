import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

const MAX_HTML_BYTES = 500_000; // ~500KB ceiling for payloads

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

/**
 * Simple HTML sanitizer for Convex action
 * (DOMPurify requires DOM, so we use a basic regex approach here)
 */
function sanitizeHtml(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
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

    // Build styled HTML
    const styledHtml = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Arial&display=swap');
            body { font-family: Arial, sans-serif; font-size: 12pt; }
          </style>
        </head>
        <body>${sanitizedHtml}</body>
      </html>
    `;

    // Call Browserless API
    const response = await fetch('https://chrome.browserless.io/pdf', {
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


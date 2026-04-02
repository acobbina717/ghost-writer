'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <head>
        <style>{`
          body.error-body { background: #F1F3F5; color: #212529; }
          body.error-body .error-heading { color: #212529; }
          body.error-body .error-subtext { color: #868E96; }
          @media (prefers-color-scheme: dark) {
            body.error-body { background: #111216; color: #F4F5F7; }
            body.error-body .error-heading { color: #F4F5F7; }
            body.error-body .error-subtext { color: #8D93A0; }
          }
        `}</style>
      </head>
      <body className="error-body" style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 className="error-heading" style={{ marginBottom: '1rem', fontWeight: 900 }}>
            Ghost hit a snag
          </h1>
          <p className="error-subtext" style={{ maxWidth: 400, margin: '0 auto 1.5rem', fontWeight: 500 }}>
            Something unexpected happened. The team has been notified.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#E21C1C',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

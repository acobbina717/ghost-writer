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
      <body style={{ 
        margin: 0, 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0A0A0A',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ color: '#fff', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#888', maxWidth: 400, margin: '0 auto 1.5rem' }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <button 
            onClick={() => reset()}
            style={{
              background: '#E21C1C',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

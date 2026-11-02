'use client';

/**
 * Route-level boundary for unexpected React rendering errors.
 *
 * API failures are handled by each page and by lib/api.js. This boundary is
 * reserved for rendering failures that would otherwise leave the route blank.
 */
export default function Error({ error, reset }) {
  return (
    <div className="notice warning" role="alert" style={{ marginTop: '32px' }}>
      <div>
        <strong>Something went wrong while displaying this page.</strong>
        <p style={{ margin: '6px 0 0' }}>
          Try the page again. If the problem continues, sign out and sign in again.
        </p>
        {process.env.NODE_ENV === 'development' && error?.message && (
          <small>{error.message}</small>
        )}
        <div style={{ marginTop: '14px' }}>
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

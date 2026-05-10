'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
        padding: '2rem'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>
          ⚠️
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem'
        }}>
          Something went wrong
        </h1>
        <p style={{
          color: '#64748b',
          marginBottom: '0.75rem',
          fontSize: '0.9rem'
        }}>
          An unexpected error occurred.
          Try refreshing the page.
        </p>
        {error.message && (
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            fontSize: '0.8rem',
            color: '#64748b',
            fontFamily: 'monospace',
            textAlign: 'left'
          }}>
            {error.message}
          </div>
        )}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={reset}
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
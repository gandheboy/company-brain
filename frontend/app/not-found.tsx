'use client'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

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
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>
          🧠
        </div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem'
        }}>
          Page Not Found
        </h1>
        <p style={{
          color: '#64748b',
          marginBottom: '2rem',
          fontSize: '0.95rem'
        }}>
          This page doesn't exist in your Company Brain.
        </p>
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => router.back()}
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
            ← Go Back
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
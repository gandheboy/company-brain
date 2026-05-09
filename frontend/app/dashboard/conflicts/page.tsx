'use client'
import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface ConflictNode {
  id: string
  title: string
  content: string
}

interface Conflict {
  node_a: ConflictNode
  node_b: ConflictNode
  conflict_type: string
  explanation: string
  recommendation: string
  similarity: number
}

export default function ConflictsPage() {
  const router = useRouter()
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)

  useEffect(() => {
    loadConflicts()
  }, [])

  const loadConflicts = async () => {
    setLoading(true)
    try {
      const result = await apiGet('/api/knowledge/conflicts')
      setConflicts(result.conflicts || [])
    } catch (error) {
      console.error('Failed to load conflicts:', error)
    }
    setLoading(false)
  }

  const handleResolve = async (
    keepId: string,
    discardId: string,
    conflictIndex: number
  ) => {
    setResolving(`${conflictIndex}`)
    try {
      await apiPost('/api/knowledge/conflicts/resolve', {
        keep_node_id: keepId,
        discard_node_id: discardId
      })
      // Remove resolved conflict from list
      setConflicts(prev =>
        prev.filter((_, i) => i !== conflictIndex)
      )
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
    }
    setResolving(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🧠</span>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            Company Brain
          </h1>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '0.4rem 1rem',
            backgroundColor: '#1e293b',
            color: 'white',
            border: '1px solid #334155',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          ← Dashboard
        </button>
      </div>

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            ⚠️ Knowledge Conflicts
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            These knowledge nodes contradict each other.
            Resolve them to keep your Company Brain accurate.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#64748b'
          }}>
            Scanning for conflicts...
          </div>
        )}

        {/* No conflicts */}
        {!loading && conflicts.length === 0 && (
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #166534',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              ✅
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>
              No Conflicts Found
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Your Company Brain knowledge is consistent.
            </p>
          </div>
        )}

        {/* Conflicts list */}
        {conflicts.map((conflict, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #7c2d12',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}
          >
            {/* Conflict header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  backgroundColor: '#7c2d12',
                  color: '#fca5a5',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {conflict.conflict_type}
                </span>
                <span style={{
                  color: '#64748b',
                  fontSize: '0.8rem'
                }}>
                  Similarity: {Math.round(conflict.similarity * 100)}%
                </span>
              </div>
            </div>

            {/* Two nodes side by side */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.25rem'
            }}>
              {/* Node A */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #334155'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>
                  Version A
                </div>
                <div style={{
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  {conflict.node_a.title}
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  lineHeight: '1.5'
                }}>
                  {conflict.node_a.content}
                </div>
                <button
                  onClick={() => handleResolve(
                    conflict.node_a.id,
                    conflict.node_b.id,
                    index
                  )}
                  disabled={resolving === `${index}`}
                  style={{
                    marginTop: '1rem',
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#166534',
                    color: '#86efac',
                    border: '1px solid #16a34a',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                >
                  ✓ Keep This Version
                </button>
              </div>

              {/* Node B */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #334155'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>
                  Version B
                </div>
                <div style={{
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  {conflict.node_b.title}
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  lineHeight: '1.5'
                }}>
                  {conflict.node_b.content}
                </div>
                <button
                  onClick={() => handleResolve(
                    conflict.node_b.id,
                    conflict.node_a.id,
                    index
                  )}
                  disabled={resolving === `${index}`}
                  style={{
                    marginTop: '1rem',
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#166534',
                    color: '#86efac',
                    border: '1px solid #16a34a',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                >
                  ✓ Keep This Version
                </button>
              </div>
            </div>

            {/* Explanation */}
            <div style={{
              backgroundColor: '#1c1917',
              border: '1px solid #292524',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: '#64748b' }}>
                AI Analysis:{' '}
              </span>
              <span style={{ color: '#a8a29e' }}>
                {conflict.explanation}
              </span>
              {conflict.recommendation && (
                <div style={{ marginTop: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>
                    Recommendation:{' '}
                  </span>
                  <span style={{ color: '#a8a29e' }}>
                    {conflict.recommendation}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
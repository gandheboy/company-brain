'use client'
import { useState } from 'react'
import { apiPost } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface QueryResult {
  question: string
  answer: string
  confidence: number
  has_answer: boolean
  sources: string[]
  nodes_searched: number
  missing_info?: string
}

export default function QueryPage() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<QueryResult[]>([])

  const handleQuery = async () => {
    if (!question.trim() || loading) return

    setLoading(true)
    setResult(null)

    try {
      const response = await apiPost('/api/knowledge/query', {
        question: question.trim()
      })

      setResult(response)
      setHistory(prev => [response, ...prev].slice(0, 10))
    } catch (error) {
      console.error('Query error:', error)
      setResult({
        question: question,
        answer: 'Error connecting to Company Brain. Make sure you are logged in.',
        confidence: 0,
        has_answer: false,
        sources: [],
        nodes_searched: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuery()
    }
  }

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#22c55e'
    if (confidence >= 0.5) return '#f59e0b'
    return '#ef4444'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem'
      }}>

        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Ask Your Company Brain 💬
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Ask anything about how your company works.
          </p>
        </div>

        {/* Query Input */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="How do we handle refunds? Who approves exceptions? What is our deployment process?"
            rows={3}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: 'white',
              padding: '0.75rem',
              fontSize: '1rem',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'system-ui, sans-serif'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem'
          }}>
            <span style={{ color: '#475569', fontSize: '0.8rem' }}>
              Press Enter to ask
            </span>
            <button
              onClick={handleQuery}
              disabled={loading || !question.trim()}
              style={{
                padding: '0.6rem 1.5rem',
                backgroundColor: loading || !question.trim()
                  ? '#1e293b'
                  : '#3b82f6',
                color: loading || !question.trim()
                  ? '#475569'
                  : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !question.trim()
                  ? 'not-allowed'
                  : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? '🔍 Searching...' : '🔍 Ask Brain'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠</div>
            <p style={{ color: '#64748b' }}>
              Searching knowledge base...
            </p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div style={{
            backgroundColor: '#0f172a',
            border: `1px solid ${result.has_answer ? '#1e3a5f' : '#1e293b'}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            {/* Question */}
            <div style={{
              fontSize: '0.8rem',
              color: '#64748b',
              marginBottom: '0.75rem'
            }}>
              Q: {result.question}
            </div>

            {/* Answer */}
            <div style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: result.has_answer ? 'white' : '#94a3b8',
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#1e293b',
              borderRadius: '8px'
            }}>
              {result.answer}
            </div>

            {/* Meta info */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>

              {/* Confidence */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: '#64748b' }}>Confidence:</span>
                <span style={{
                  color: confidenceColor(result.confidence),
                  fontWeight: 'bold'
                }}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>

              {/* Nodes searched */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: '#64748b' }}>Nodes searched:</span>
                <span style={{ color: '#94a3b8' }}>
                  {result.nodes_searched}
                </span>
              </div>

              {/* Sources */}
              {result.sources.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ color: '#64748b' }}>Sources:</span>
                  {result.sources.map((source, i) => (
                    <span key={i} style={{
                      backgroundColor: '#1e3a5f',
                      color: '#93c5fd',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      {source}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Missing info */}
            {result.missing_info && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#1c1917',
                border: '1px solid #292524',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#a8a29e'
              }}>
                💡 To improve this answer: {result.missing_info}
              </div>
            )}
          </div>
        )}

        {/* Sample questions */}
        {!result && !loading && (
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '0.85rem',
              color: '#64748b',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Try asking
            </h3>
            {[
              'How do we handle customer refunds?',
              'What is our deployment process?',
              'Who approves pricing exceptions?',
              'How do we onboard new employees?'
            ].map((q) => (
              <div
                key={q}
                onClick={() => setQuestion(q)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  borderBottom: '1px solid #1e293b',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.backgroundColor = '#1e293b'
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                → {q}
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{
              fontSize: '0.85rem',
              color: '#64748b',
              marginBottom: '1rem',
              textTransform: 'uppercase'
            }}>
              Previous Questions
            </h3>
            {history.slice(1).map((item, i) => (
              <div
                key={i}
                onClick={() => setResult(item)}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: '#94a3b8'
                }}
              >
                {item.has_answer ? '✅' : '❓'} {item.question}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
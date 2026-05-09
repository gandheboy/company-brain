'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QueryResult {
  question: string
  answer: string
  confidence: number
  has_answer: boolean
  sources: string[]
  nodes_searched: number
  missing_info?: string
  node_ids?: string[]
}

interface FeedbackState {
  submitted: boolean
  was_helpful: boolean | null
  show_text_input: boolean
  feedback_text: string
}

export default function QueryPage() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<QueryResult[]>([])
  const [feedback, setFeedback] = useState<FeedbackState>({
    submitted: false,
    was_helpful: null,
    show_text_input: false,
    feedback_text: ''
  })

  const handleQuery = async () => {
    if (!question.trim() || loading) return

    setLoading(true)
    setResult(null)
    setFeedback({
      submitted: false,
      was_helpful: null,
      show_text_input: false,
      feedback_text: ''
    })

    try {
      const response = await fetch(
        'http://localhost:8000/api/knowledge/query-test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question.trim() })
        }
      )
      const data = await response.json()
      setResult(data)
      setHistory(prev => [data, ...prev].slice(0, 10))
    } catch (error) {
      setResult({
        question,
        answer: 'Error connecting. Make sure backend is running.',
        confidence: 0,
        has_answer: false,
        sources: [],
        nodes_searched: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (was_helpful: boolean) => {
    if (!result) return

    setFeedback(prev => ({
      ...prev,
      was_helpful,
      show_text_input: !was_helpful
    }))

    if (was_helpful) {
      await submitFeedback(was_helpful, '')
    }
  }

  const submitFeedback = async (
    was_helpful: boolean,
    feedback_text: string
  ) => {
    if (!result) return

    try {
      await fetch(
        'http://localhost:8000/api/knowledge/feedback-test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: result.question,
            answer: result.answer,
            was_helpful,
            feedback_text,
            node_ids_used: result.node_ids || []
          })
        }
      )
      setFeedback(prev => ({
        ...prev,
        submitted: true,
        show_text_input: false
      }))
    } catch (error) {
      console.error('Feedback error:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuery()
    }
  }

  const confidenceColor = (c: number) =>
    c >= 0.8 ? '#22c55e' : c >= 0.5 ? '#f59e0b' : '#ef4444'

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
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '0.5rem'
          }}>
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
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="How do we handle refunds? Who approves discounts? What is our deployment process?"
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
            <span style={{
              color: '#475569',
              fontSize: '0.8rem'
            }}>
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
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>
              🧠
            </div>
            <p style={{ color: '#64748b' }}>
              Searching knowledge base...
            </p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div style={{
            backgroundColor: '#0f172a',
            border: `1px solid ${result.has_answer
              ? '#1e3a5f'
              : '#1e293b'}`,
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

            {/* Meta */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '1.25rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: '#64748b' }}>
                  Confidence:
                </span>
                <span style={{
                  color: confidenceColor(result.confidence),
                  fontWeight: 'bold'
                }}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>

              {result.sources.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ color: '#64748b' }}>
                    Sources:
                  </span>
                  {result.sources.map((s, i) => (
                    <span key={i} style={{
                      backgroundColor: '#1e3a5f',
                      color: '#93c5fd',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback section */}
            <div style={{
              borderTop: '1px solid #1e293b',
              paddingTop: '1rem'
            }}>
              {!feedback.submitted ? (
                <>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    marginBottom: '0.75rem'
                  }}>
                    Was this answer helpful?
                  </div>

                  {feedback.was_helpful === null && (
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem'
                    }}>
                      <button
                        onClick={() => handleFeedback(true)}
                        style={{
                          padding: '0.5rem 1.25rem',
                          backgroundColor: '#166534',
                          color: '#86efac',
                          border: '1px solid #16a34a',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        👍 Yes, helpful
                      </button>
                      <button
                        onClick={() => handleFeedback(false)}
                        style={{
                          padding: '0.5rem 1.25rem',
                          backgroundColor: '#450a0a',
                          color: '#fca5a5',
                          border: '1px solid #7f1d1d',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        👎 Not helpful
                      </button>
                    </div>
                  )}

                  {/* Not helpful text input */}
                  {feedback.show_text_input && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <textarea
                        value={feedback.feedback_text}
                        onChange={e => setFeedback(prev => ({
                          ...prev,
                          feedback_text: e.target.value
                        }))}
                        placeholder="What was wrong with this answer?"
                        rows={2}
                        style={{
                          width: '100%',
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: 'white',
                          padding: '0.6rem',
                          fontSize: '0.85rem',
                          resize: 'none',
                          outline: 'none',
                          boxSizing: 'border-box',
                          marginBottom: '0.5rem'
                        }}
                      />
                      <button
                        onClick={() => submitFeedback(
                          false,
                          feedback.feedback_text
                        )}
                        style={{
                          padding: '0.4rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Submit Feedback
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  color: feedback.was_helpful
                    ? '#22c55e'
                    : '#94a3b8',
                  fontSize: '0.85rem'
                }}>
                  {feedback.was_helpful
                    ? '✅ Thanks! Knowledge confidence boosted.'
                    : '📝 Thanks! We\'ll improve this answer.'}
                </div>
              )}
            </div>
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
            ].map(q => (
              <div
                key={q}
                onClick={() => setQuestion(q)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  borderBottom: '1px solid #1e293b'
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement)
                    .style.backgroundColor = '#1e293b'
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement)
                    .style.backgroundColor = 'transparent'
                }}
              >
                → {q}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
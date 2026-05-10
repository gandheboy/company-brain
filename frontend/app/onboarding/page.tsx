'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Step = 1 | 2 | 3 | 4

interface StepConfig {
  title: string
  subtitle: string
  icon: string
}

const steps: Record<Step, StepConfig> = {
  1: {
    title: 'Welcome to Company Brain',
    subtitle: 'Let\'s set up your account in 4 easy steps',
    icon: '🧠'
  },
  2: {
    title: 'Connect Your Tools',
    subtitle: 'Connect where your company knowledge lives',
    icon: '🔌'
  },
  3: {
    title: 'Extract Knowledge',
    subtitle: 'Watch your brain come alive',
    icon: '⚡'
  },
  4: {
    title: 'Ask Your First Question',
    subtitle: 'See Company Brain in action',
    icon: '💬'
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [orgName, setOrgName] = useState('')
  const [user, setUser] = useState<any>(null)
  const [slackConnected, setSlackConnected] = useState(false)
  const [notionConnected, setNotionConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncDone, setSyncDone] = useState(false)
  const [syncStats, setSyncStats] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<any>(null)
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUser(user)
      setOrgName(
        user.user_metadata?.org_name ||
        user.email?.split('@')[0] ||
        'My Company'
      )
    }
    getUser()

    // Check if redirected from Slack OAuth
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'slack') {
      setSlackConnected(true)
      setCurrentStep(2)
    }
  }, [router])

  const handleSyncAll = async () => {
    setSyncing(true)
    let totalNodes = 0

    try {
      // Sync Slack if connected
      if (slackConnected) {
        const slackRes = await fetch(
          'http://localhost:8000/api/integrations/slack/sync-test',
          { method: 'POST' }
        )
        const slackData = await slackRes.json()
        totalNodes += slackData.stats?.nodes_extracted || 0
      }

      // Sync Notion if connected
      if (notionConnected) {
        const notionRes = await fetch(
          'http://localhost:8000/api/integrations/notion/sync-test',
          { method: 'POST' }
        )
        const notionData = await notionRes.json()
        totalNodes += notionData.stats?.nodes_extracted || 0
      }

      // If neither connected use sample data
      if (!slackConnected && !notionConnected) {
        const sampleRes = await fetch(
          'http://localhost:8000/api/knowledge/extract-save-test',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `At ${orgName}, refunds under $500 are processed automatically in Stripe. 
                     Refunds over $500 require manager approval. Enterprise customers always 
                     need approval. We deploy every Tuesday and Thursday. Never on Fridays. 
                     All PRs need 2 approvals before merging. New employees get a buddy 
                     assigned for their first 30 days.`,
              source_type: 'general'
            })
          }
        )
        const sampleData = await sampleRes.json()
        totalNodes += sampleData.nodes_saved || 0
      }

      setSyncStats({ nodes_extracted: totalNodes })
      setSyncDone(true)

    } catch (error) {
      console.error('Sync error:', error)
      setSyncDone(true)
      setSyncStats({ nodes_extracted: 0 })
    }

    setSyncing(false)
  }

  const handleAsk = async () => {
    if (!question.trim() || asking) return
    setAsking(true)

    try {
      const res = await fetch(
        'http://localhost:8000/api/knowledge/query-test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        }
      )
      const data = await res.json()
      setAnswer(data)
    } catch (error) {
      setAnswer({
        answer: 'Error connecting to backend.',
        has_answer: false,
        confidence: 0,
        sources: []
      })
    }

    setAsking(false)
  }

  const handleFinish = async () => {
    // Mark onboarding complete in localStorage
    localStorage.setItem('onboarding_complete', 'true')
    router.push('/dashboard')
  }

  const connectSlack = async () => {
    try {
      const res = await fetch(
        'http://localhost:8000/api/integrations/slack/connect-url'
      )
      const data = await res.json()
      window.location.href = data.oauth_url +
        '&state=' + data.org_id +
        '&redirect_onboarding=true'
    } catch (e) {
      alert('Could not connect Slack. Check backend is running.')
    }
  }

  const step = steps[currentStep]

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px'
      }}>

        {/* Progress bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor:
                    s < currentStep ? '#22c55e' :
                    s === currentStep ? '#3b82f6' :
                    '#1e293b',
                  border: `2px solid ${
                    s < currentStep ? '#22c55e' :
                    s === currentStep ? '#3b82f6' :
                    '#334155'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: s <= currentStep ? 'white' : '#64748b'
                }}>
                  {s < currentStep ? '✓' : s}
                </div>
              </div>
            ))}
          </div>
          {/* Progress line */}
          <div style={{
            height: '3px',
            backgroundColor: '#1e293b',
            borderRadius: '999px',
            marginTop: '-20px',
            zIndex: -1,
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: '#3b82f6',
              borderRadius: '999px',
              width: `${((currentStep - 1) / 3) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          padding: '2.5rem'
        }}>
          {/* Step header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              {step.icon}
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              {step.title}
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '0.9rem'
            }}>
              {step.subtitle}
            </p>
          </div>

          {/* Step 1 — Welcome */}
          {currentStep === 1 && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  fontSize: '0.85rem',
                  color: '#94a3b8',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}>
                  Your Company Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Acme Corp"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#64748b',
                  marginBottom: '0.75rem'
                }}>
                  What you'll get:
                </div>
                {[
                  'All company knowledge extracted automatically',
                  'AI agents that know how your company works',
                  'Conflict detection across all your knowledge',
                  'Skills files for agent integration'
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.3rem 0',
                    fontSize: '0.9rem',
                    color: '#94a3b8'
                  }}>
                    <span style={{ color: '#22c55e' }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={!orgName.trim()}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: orgName.trim()
                    ? '#3b82f6'
                    : '#1e293b',
                  color: orgName.trim() ? 'white' : '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: orgName.trim()
                    ? 'pointer'
                    : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Let's Go →
              </button>
            </div>
          )}

          {/* Step 2 — Connect */}
          {currentStep === 2 && (
            <div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                {/* Slack */}
                <div style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: slackConnected
                    ? '1px solid #22c55e'
                    : '1px solid #334155'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>#</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        Slack
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#64748b'
                      }}>
                        Messages and threads
                      </div>
                    </div>
                  </div>
                  {slackConnected ? (
                    <span style={{
                      color: '#22c55e',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      ✓ Connected
                    </span>
                  ) : (
                    <button
                      onClick={connectSlack}
                      style={{
                        padding: '0.4rem 1rem',
                        backgroundColor: '#4a1d96',
                        color: '#c4b5fd',
                        border: '1px solid #6d28d9',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* Notion */}
                <div style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: notionConnected
                    ? '1px solid #22c55e'
                    : '1px solid #334155'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>N</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        Notion
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#64748b'
                      }}>
                        Pages and wikis
                      </div>
                    </div>
                  </div>
                  {notionConnected ? (
                    <span style={{
                      color: '#22c55e',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      ✓ Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => setNotionConnected(true)}
                      style={{
                        padding: '0.4rem 1rem',
                        backgroundColor: '#1e293b',
                        color: '#94a3b8',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem'
              }}>
                <button
                  onClick={() => setCurrentStep(1)}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  style={{
                    flex: 2,
                    padding: '0.85rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                >
                  {slackConnected || notionConnected
                    ? 'Continue →'
                    : 'Skip for now →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Extract */}
          {currentStep === 3 && (
            <div>
              {!syncDone ? (
                <div>
                  <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    {syncing ? (
                      <div>
                        <div style={{
                          fontSize: '3rem',
                          marginBottom: '1rem',
                          animation: 'spin 2s linear infinite'
                        }}>
                          ⚡
                        </div>
                        <p style={{ color: '#64748b' }}>
                          Extracting knowledge...
                        </p>
                        <p style={{
                          color: '#475569',
                          fontSize: '0.8rem',
                          marginTop: '0.5rem'
                        }}>
                          Reading your tools and finding procedures
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div style={{
                          fontSize: '3rem',
                          marginBottom: '1rem'
                        }}>
                          🧠
                        </div>
                        <p style={{
                          color: '#94a3b8',
                          marginBottom: '1rem'
                        }}>
                          Ready to extract knowledge from:
                        </p>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '1rem',
                          marginBottom: '1rem'
                        }}>
                          {slackConnected && (
                            <span style={{
                              backgroundColor: '#4a1d96',
                              color: '#c4b5fd',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.85rem'
                            }}>
                              # Slack
                            </span>
                          )}
                          {notionConnected && (
                            <span style={{
                              backgroundColor: '#1e293b',
                              color: '#94a3b8',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              border: '1px solid #334155'
                            }}>
                              N Notion
                            </span>
                          )}
                          {!slackConnected && !notionConnected && (
                            <span style={{
                              color: '#64748b',
                              fontSize: '0.85rem'
                            }}>
                              Sample data (no integrations connected)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.75rem'
                  }}>
                    <button
                      onClick={() => setCurrentStep(2)}
                      disabled={syncing}
                      style={{
                        flex: 1,
                        padding: '0.85rem',
                        backgroundColor: '#1e293b',
                        color: '#94a3b8',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        cursor: syncing
                          ? 'not-allowed'
                          : 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleSyncAll}
                      disabled={syncing}
                      style={{
                        flex: 2,
                        padding: '0.85rem',
                        backgroundColor: syncing
                          ? '#1e293b'
                          : '#3b82f6',
                        color: syncing ? '#475569' : 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: syncing
                          ? 'not-allowed'
                          : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {syncing
                        ? '⚡ Extracting...'
                        : '⚡ Extract Knowledge →'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Success state */}
                  <div style={{
                    backgroundColor: '#0a1f0a',
                    border: '1px solid #166534',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      fontSize: '3rem',
                      marginBottom: '0.75rem'
                    }}>
                      🎉
                    </div>
                    <h3 style={{
                      color: '#86efac',
                      marginBottom: '0.5rem'
                    }}>
                      Knowledge Extracted!
                    </h3>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#22c55e',
                      marginBottom: '0.25rem'
                    }}>
                      {syncStats?.nodes_extracted || 0}
                    </div>
                    <div style={{
                      color: '#64748b',
                      fontSize: '0.85rem'
                    }}>
                      knowledge nodes ready
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep(4)}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Ask Your First Question →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — First question */}
          {currentStep === 4 && (
            <div>
              {!answer ? (
                <div>
                  <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <textarea
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      placeholder="How do we handle refunds? What is our deployment process?"
                      rows={3}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleAsk()
                        }
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '1rem',
                        resize: 'none',
                        outline: 'none',
                        fontFamily: 'system-ui, sans-serif',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Sample questions */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#475569',
                      marginBottom: '0.5rem'
                    }}>
                      Try one of these:
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      {[
                        'How do we handle refunds?',
                        'What is our deployment process?',
                        'How many PR approvals needed?'
                      ].map(q => (
                        <button
                          key={q}
                          onClick={() => setQuestion(q)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            backgroundColor: '#1e293b',
                            color: '#94a3b8',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.75rem'
                  }}>
                    <button
                      onClick={() => setCurrentStep(3)}
                      style={{
                        flex: 1,
                        padding: '0.85rem',
                        backgroundColor: '#1e293b',
                        color: '#94a3b8',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleAsk}
                      disabled={asking || !question.trim()}
                      style={{
                        flex: 2,
                        padding: '0.85rem',
                        backgroundColor: asking || !question.trim()
                          ? '#1e293b'
                          : '#3b82f6',
                        color: asking || !question.trim()
                          ? '#475569'
                          : 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: asking || !question.trim()
                          ? 'not-allowed'
                          : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {asking ? '🔍 Searching...' : '🔍 Ask Brain →'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Answer result */}
                  <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      marginBottom: '0.5rem'
                    }}>
                      Q: {question}
                    </div>
                    <div style={{
                      color: answer.has_answer
                        ? 'white'
                        : '#94a3b8',
                      lineHeight: 1.6,
                      fontSize: '0.95rem'
                    }}>
                      {answer.answer}
                    </div>
                    {answer.sources?.length > 0 && (
                      <div style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        {answer.sources.map((s: string, i: number) => (
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

                  {answer.has_answer && (
                    <div style={{
                      backgroundColor: '#0a1f0a',
                      border: '1px solid #166534',
                      borderRadius: '12px',
                      padding: '1rem',
                      textAlign: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        color: '#86efac',
                        fontWeight: 'bold',
                        marginBottom: '0.25rem'
                      }}>
                        🎉 Your Company Brain is working!
                      </div>
                      <div style={{
                        color: '#64748b',
                        fontSize: '0.85rem'
                      }}>
                        It answered from your company knowledge
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleFinish}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Go to Dashboard →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Skip link */}
        {currentStep < 4 && (
          <div style={{
            textAlign: 'center',
            marginTop: '1rem'
          }}>
            <button
              onClick={handleFinish}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Skip setup, go to dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Handle email verification tokens in URL
      const hashParams = new URLSearchParams(
        window.location.hash.substring(1)
      )
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      if (accessToken && type === 'signup') {
        // New user verified email
        // Set session from token
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || ''
        })
        router.push('/onboarding')
        return
      }

      if (accessToken) {
        // Existing user verified something
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || ''
        })
        router.push('/dashboard')
        return
      }

      // Normal flow — check if already logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if new user needs onboarding
        const onboardingDone = localStorage.getItem('onboarding_complete')
        if (!onboardingDone) {
          const createdAt = new Date(user.created_at).getTime()
          const now = Date.now()
          const isNewUser = (now - createdAt) < 300000 // 5 minutes

          if (isNewUser) {
            router.push('/onboarding')
            return
          }
        }
        router.push('/dashboard')
      } else {
        setChecking(false)
      }
    }
    checkAuth()
  }, [router])

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#030712',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '2rem',
          animation: 'pulse 1s infinite'
        }}>
          🧠
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>

      {/* Navigation */}
      <nav style={{
        padding: '1.25rem 2rem',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1100px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🧠</span>
          <span style={{
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            Company Brain
          </span>
        </div>
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <button
            onClick={() => router.push('/auth')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Login
          </button>
          <button
            onClick={() => router.push('/auth')}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          >
            Get Started Free →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '5rem 2rem 3rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-block',
            backgroundColor: '#1e3a5f',
            color: '#93c5fd',
            padding: '0.35rem 1rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            marginBottom: '1.5rem',
            border: '1px solid #1e40af'
          }}>
            🚀 Now in Beta — Free to try
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 'bold',
            lineHeight: 1.15,
            marginBottom: '1.5rem',
            maxWidth: '750px',
            margin: '0 auto 1.5rem'
          }}>
            The Memory Layer for{' '}
            <span style={{ color: '#3b82f6' }}>
              AI-Powered Companies
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: '1.2rem',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6
          }}>
            Company Brain reads your Slack, Notion, and GitHub.
            Extracts your procedures and policies.
            Turns them into knowledge your AI agents can actually use.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => router.push('/auth')}
              style={{
                padding: '0.85rem 2rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Start Free →
            </button>
            <button
              onClick={() => router.push('/auth')}
              style={{
                padding: '0.85rem 2rem',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              See Demo
            </button>
          </div>

          <p style={{
            color: '#475569',
            fontSize: '0.8rem',
            marginTop: '1rem'
          }}>
            Free forever on starter plan · No credit card required
          </p>
        </div>

        {/* Problem → Solution */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '4rem'
        }}>
          {/* Problem */}
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #450a0a',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '1rem'
            }}>
              😤
            </div>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#fca5a5'
            }}>
              The Problem
            </h3>
            {[
              'AI agents fail on company-specific tasks',
              'Knowledge buried in Slack threads',
              'Procedures live in people\'s heads',
              'New employees take months to onboard',
              'Contradicting policies nobody noticed'
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.4rem 0',
                fontSize: '0.9rem',
                color: '#94a3b8'
              }}>
                <span style={{ color: '#ef4444' }}>✗</span>
                {item}
              </div>
            ))}
          </div>

          {/* Solution */}
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #166534',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '1rem'
            }}>
              🧠
            </div>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#86efac'
            }}>
              Company Brain
            </h3>
            {[
              'Agents know exactly how your company works',
              'All knowledge extracted automatically',
              'Procedures structured and searchable',
              'New hires productive from day one',
              'Conflicts detected and resolved'
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.4rem 0',
                fontSize: '0.9rem',
                color: '#94a3b8'
              }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '0.5rem'
          }}>
            How It Works
          </h2>
          <p style={{
            color: '#64748b',
            textAlign: 'center',
            marginBottom: '2.5rem',
            fontSize: '0.95rem'
          }}>
            Three steps to a smarter company
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem'
          }}>
            {[
              {
                step: '01',
                icon: '🔌',
                title: 'Connect Your Tools',
                desc: 'Connect Slack, Notion, and GitHub in one click. No setup required.'
              },
              {
                step: '02',
                icon: '🧠',
                title: 'Brain Extracts Knowledge',
                desc: 'AI reads everything and extracts procedures, policies, and decisions automatically.'
              },
              {
                step: '03',
                icon: '⚡',
                title: 'Agents Work Correctly',
                desc: 'Your AI agents get a skills file with exact company procedures. No more guessing.'
              }
            ].map(item => (
              <div key={item.step} style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#3b82f6',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  letterSpacing: '0.1em'
                }}>
                  STEP {item.step}
                </div>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem'
                }}>
                  {item.icon}
                </div>
                <h3 style={{
                  fontWeight: 'bold',
                  marginBottom: '0.75rem',
                  fontSize: '1rem'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: '#64748b',
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Features grid */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '2.5rem'
          }}>
            Everything Your Company Needs
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            {[
              {
                icon: '💬',
                title: 'Ask Anything',
                desc: 'Ask questions in plain English. Get answers with sources.'
              },
              {
                icon: '⚡',
                title: 'Skills Files',
                desc: 'Export procedures as JSON for your AI agents to consume.'
              },
              {
                icon: '⚠️',
                title: 'Conflict Detection',
                desc: 'Find contradicting policies before they cause problems.'
              },
              {
                icon: '🔍',
                title: 'Knowledge Explorer',
                desc: 'Browse, verify, and manage all extracted knowledge.'
              },
              {
                icon: '📊',
                title: 'Confidence Scoring',
                desc: 'Every answer comes with a confidence score and sources.'
              },
              {
                icon: '🔄',
                title: 'Auto Sync',
                desc: 'Knowledge updates automatically as your team communicates.'
              }
            ].map(feature => (
              <div key={feature.title} style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  marginBottom: '0.75rem'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontWeight: 'bold',
                  marginBottom: '0.4rem',
                  fontSize: '0.95rem'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#64748b',
                  fontSize: '0.85rem',
                  lineHeight: 1.5
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '0.5rem'
          }}>
            Simple Pricing
          </h2>
          <p style={{
            color: '#64748b',
            textAlign: 'center',
            marginBottom: '2.5rem',
            fontSize: '0.95rem'
          }}>
            Start free. Upgrade when you grow.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {[
              {
                name: 'Starter',
                price: '$299',
                desc: 'For small teams',
                features: [
                  '3 integrations',
                  '500 knowledge nodes',
                  '100 queries/day',
                  'Basic skills file'
                ],
                cta: 'Start Free',
                highlight: false
              },
              {
                name: 'Growth',
                price: '$799',
                desc: 'Most popular',
                features: [
                  '10 integrations',
                  'Unlimited nodes',
                  'Unlimited queries',
                  'Full skills file export',
                  'Conflict detection',
                  'Priority support'
                ],
                cta: 'Get Started',
                highlight: true
              },
              {
                name: 'Team',
                price: '$1,999',
                desc: 'For AI-first companies',
                features: [
                  'Unlimited integrations',
                  'API access',
                  'Agent integration support',
                  'Custom workflows',
                  'Dedicated support',
                  'SLA guarantee'
                ],
                cta: 'Contact Us',
                highlight: false
              }
            ].map(plan => (
              <div key={plan.name} style={{
                backgroundColor: '#0f172a',
                border: plan.highlight
                  ? '2px solid #3b82f6'
                  : '1px solid #1e293b',
                borderRadius: '16px',
                padding: '2rem',
                position: 'relative'
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.2rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    marginBottom: '0.25rem'
                  }}>
                    {plan.name}
                  </div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold'
                  }}>
                    {plan.price}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#64748b'
                  }}>
                    per month
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      gap: '0.5rem',
                      padding: '0.35rem 0',
                      fontSize: '0.85rem',
                      color: '#94a3b8'
                    }}>
                      <span style={{ color: '#22c55e' }}>
                        ✓
                      </span>
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push('/auth')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: plan.highlight
                      ? '#3b82f6'
                      : '#1e293b',
                    color: plan.highlight ? 'white' : '#94a3b8',
                    border: plan.highlight
                      ? 'none'
                      : '1px solid #334155',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e3a5f',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            Ready to give your company a brain?
          </h2>
          <p style={{
            color: '#64748b',
            marginBottom: '2rem',
            fontSize: '0.95rem'
          }}>
            Join companies already using Company Brain
            to power their AI agents.
          </p>
          <button
            onClick={() => router.push('/auth')}
            style={{
              padding: '1rem 2.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Start Free Today →
          </button>
          <p style={{
            color: '#475569',
            fontSize: '0.8rem',
            marginTop: '1rem'
          }}>
            No credit card · Free starter plan · 5 min setup
          </p>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          color: '#475569',
          fontSize: '0.8rem',
          paddingBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span>🧠</span>
            <span style={{ fontWeight: 'bold', color: '#64748b' }}>
              Company Brain
            </span>
          </div>
          <div>
            Built with ❤️ · The memory layer for AI companies
          </div>
        </div>
      </div>
    </div>
  )
}
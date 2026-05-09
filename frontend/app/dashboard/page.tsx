'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Stats {
  integrations: number
  knowledge_nodes: number
  documents: number
}

interface NavItem {
  icon: string
  label: string
  path: string
  color: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    integrations: 0,
    knowledge_nodes: 0,
    documents: 0
  })
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState('/dashboard')

  useEffect(() => {
    initialize()
  }, [])

  const initialize = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth')
      return
    }

    setUser(user)

    try {
      // Get org from database directly
      const response = await fetch(
        'http://localhost:8000/api/organizations/me/stats',
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setOrg(data.org)
        setStats(data.stats)
      } else {
        // Fallback — get from supabase directly
        const orgs = await fetch(
          'http://localhost:8000/api/knowledge/nodes-test'
        )
        const nodesData = await orgs.json()

        setOrg({ name: user.email?.split('@')[0] || 'My Company' })
        setStats(prev => ({
          ...prev,
          knowledge_nodes: nodesData.total || 0
        }))
      }
    } catch (error) {
      console.error('Init error:', error)
      setOrg({ name: user.email?.split('@')[0] || 'My Company' })
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const navItems: NavItem[] = [
    {
      icon: '💬',
      label: 'Ask Brain',
      path: '/dashboard/query',
      color: '#3b82f6'
    },
    {
      icon: '🧠',
      label: 'Knowledge',
      path: '/dashboard/knowledge',
      color: '#8b5cf6'
    },
    {
      icon: '⚡',
      label: 'Skills File',
      path: '/dashboard/skills',
      color: '#7c3aed'
    },
    {
      icon: '⚠️',
      label: 'Conflicts',
      path: '/dashboard/conflicts',
      color: '#ef4444'
    },
  ]

  const quickActions = [
    {
      icon: '🔄',
      label: 'Sync Slack',
      action: async () => {
        try {
          await fetch(
            'http://localhost:8000/api/integrations/slack/sync-test',
            { method: 'POST' }
          )
          alert('Slack sync started!')
          initialize()
        } catch (e) {
          alert('Slack not connected yet')
        }
      }
    },
    {
      icon: '📋',
      label: 'Sync Notion',
      action: async () => {
        try {
          await fetch(
            'http://localhost:8000/api/integrations/notion/sync-test',
            { method: 'POST' }
          )
          alert('Notion sync started!')
          initialize()
        } catch (e) {
          alert('Notion not connected yet')
        }
      }
    },
    {
      icon: '⚡',
      label: 'Generate Skills',
      action: () => router.push('/dashboard/skills')
    },
    {
      icon: '🔍',
      label: 'Find Conflicts',
      action: () => router.push('/dashboard/conflicts')
    }
  ]

  if (loading) {
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            🧠
          </div>
          <p style={{ color: '#64748b' }}>
            Loading Company Brain...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '240px',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
          padding: '0 0.5rem'
        }}>
          <span style={{ fontSize: '1.8rem' }}>🧠</span>
          <div>
            <div style={{
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              Company Brain
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: '#64748b'
            }}>
              {org?.name || 'Your Company'}
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          flex: 1
        }}>
          {/* Dashboard home */}
          <div
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: '#1e293b',
              marginBottom: '0.5rem'
            }}
          >
            <span>🏠</span>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              Dashboard
            </span>
          </div>

          <div style={{
            fontSize: '0.7rem',
            color: '#475569',
            padding: '0.5rem 0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Features
          </div>

          {navItems.map(item => (
            <div
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement)
                  .style.backgroundColor = '#1e293b'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement)
                  .style.backgroundColor = 'transparent'
              }}
            >
              <span>{item.icon}</span>
              <span style={{ fontSize: '0.9rem' }}>
                {item.label}
              </span>
            </div>
          ))}

          <div style={{
            fontSize: '0.7rem',
            color: '#475569',
            padding: '0.5rem 0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '0.5rem'
          }}>
            Integrations
          </div>

          <div
            onClick={() => {
              window.open(
                'http://localhost:8000/api/integrations/slack/connect-url',
                '_blank'
              )
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement)
                .style.backgroundColor = '#1e293b'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement)
                .style.backgroundColor = 'transparent'
            }}
          >
            <span>#</span>
            <span style={{ fontSize: '0.9rem' }}>
              Connect Slack
            </span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.7rem',
              color: stats.integrations > 0
                ? '#22c55e'
                : '#64748b'
            }}>
              {stats.integrations > 0 ? '●' : '○'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement)
                .style.backgroundColor = '#1e293b'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement)
                .style.backgroundColor = 'transparent'
            }}
          >
            <span>N</span>
            <span style={{ fontSize: '0.9rem' }}>
              Notion
            </span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.7rem',
              color: stats.integrations > 1
                ? '#22c55e'
                : '#64748b'
            }}>
              {stats.integrations > 1 ? '●' : '○'}
            </span>
          </div>
        </div>

        {/* User section */}
        <div style={{
          borderTop: '1px solid #1e293b',
          paddingTop: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#64748b',
            marginBottom: '0.5rem',
            padding: '0 0.5rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{
          padding: '2rem',
          maxWidth: '900px'
        }}>

          {/* Welcome header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '0.25rem'
            }}>
              Welcome back 👋
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '0.9rem'
            }}>
              {org?.name || 'Your Company'} · Company Brain
            </p>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {[
              {
                label: 'Integrations',
                value: stats.integrations,
                icon: '🔌',
                color: '#3b82f6',
                sub: 'connected'
              },
              {
                label: 'Knowledge Nodes',
                value: stats.knowledge_nodes,
                icon: '🧠',
                color: '#8b5cf6',
                sub: 'extracted'
              },
              {
                label: 'Documents',
                value: stats.documents,
                icon: '📄',
                color: '#10b981',
                sub: 'processed'
              }
            ].map(card => (
              <div key={card.label} style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '1.25rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: card.color,
                      lineHeight: 1
                    }}>
                      {card.value}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: '#94a3b8',
                      marginTop: '0.4rem'
                    }}>
                      {card.label}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#475569'
                    }}>
                      {card.sub}
                    </div>
                  </div>
                  <span style={{ fontSize: '1.5rem' }}>
                    {card.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '0.85rem',
              color: '#64748b',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Quick Actions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem'
            }}>
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={action.action}
                  style={{
                    padding: '0.85rem',
                    backgroundColor: '#1e293b',
                    color: 'white',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement)
                      .style.backgroundColor = '#273548'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement)
                      .style.backgroundColor = '#1e293b'
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    marginBottom: '0.4rem'
                  }}>
                    {action.icon}
                  </div>
                  <div>{action.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Feature cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {[
              {
                icon: '💬',
                title: 'Ask Your Brain',
                desc: 'Get instant answers from your company knowledge base.',
                path: '/dashboard/query',
                color: '#1e3a5f',
                btnColor: '#3b82f6'
              },
              {
                icon: '⚡',
                title: 'Skills File',
                desc: 'Generate machine-readable procedures for AI agents.',
                path: '/dashboard/skills',
                color: '#1e1b4b',
                btnColor: '#7c3aed'
              },
              {
                icon: '⚠️',
                title: 'Conflicts',
                desc: 'Find and resolve contradicting knowledge nodes.',
                path: '/dashboard/conflicts',
                color: '#2d0a0a',
                btnColor: '#ef4444'
              },
              {
                icon: '🧠',
                title: 'Knowledge Explorer',
                desc: 'Browse, verify, and manage all knowledge nodes.',
                path: '/dashboard/knowledge',
                color: '#1a1a2e',
                btnColor: '#8b5cf6'
              }
            ].map(card => (
              <div
                key={card.title}
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer'
                }}
                onClick={() => router.push(card.path)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement)
                    .style.borderColor = card.btnColor
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement)
                    .style.borderColor = '#1e293b'
                }}
              >
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.75rem'
                }}>
                  {card.icon}
                </div>
                <h3 style={{
                  fontWeight: 'bold',
                  marginBottom: '0.4rem',
                  fontSize: '1rem'
                }}>
                  {card.title}
                </h3>
                <p style={{
                  color: '#64748b',
                  fontSize: '0.85rem',
                  lineHeight: '1.5'
                }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Getting started checklist */}
          {stats.knowledge_nodes === 0 && (
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
                Getting Started
              </h3>
              {[
                {
                  step: '1',
                  text: 'Connect Slack workspace',
                  done: stats.integrations > 0
                },
                {
                  step: '2',
                  text: 'Connect Notion workspace',
                  done: stats.integrations > 1
                },
                {
                  step: '3',
                  text: 'Extract your knowledge',
                  done: stats.knowledge_nodes > 0
                },
                {
                  step: '4',
                  text: 'Ask your first question',
                  done: false
                }
              ].map(item => (
                <div key={item.step} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #1e293b'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: item.done
                      ? '#166534'
                      : '#1e293b',
                    border: `1px solid ${item.done
                      ? '#22c55e'
                      : '#334155'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: item.done ? '#22c55e' : '#64748b',
                    flexShrink: 0
                  }}>
                    {item.done ? '✓' : item.step}
                  </div>
                  <span style={{
                    color: item.done ? '#22c55e' : '#94a3b8',
                    fontSize: '0.9rem',
                    textDecoration: item.done
                      ? 'line-through'
                      : 'none'
                  }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
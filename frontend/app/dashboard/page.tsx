'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { apiGet, apiPost } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [stats, setStats] = useState({
    integrations: 0,
    knowledge_nodes: 0,
    documents: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      setUser(user)

      try {
        // Try to get existing org
        let orgData = null

        try {
          const result = await apiGet('/api/organizations/me')
          orgData = result
        } catch {
          // Org doesn't exist yet — create it
          const orgName = user.user_metadata?.org_name || 'My Company'
          orgData = await apiPost('/api/organizations', {
            name: orgName,
            owner_email: user.email
          })
        }

        setOrg(orgData)

        // Get stats
        const statsResult = await apiGet('/api/organizations/me/stats')
        setStats(statsResult.stats)

      } catch (error) {
        console.error('Failed to load org data:', error)
      }

      setLoading(false)
    }

    initialize()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

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
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧠</div>
          <p style={{ color: '#64748b' }}>Loading your Company Brain...</p>
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
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              Company Brain
            </h1>
            {org && (
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {org.name}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
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
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{
        padding: '2rem',
        maxWidth: '900px',
        margin: '0 auto'
      }}>

        {/* Welcome */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '1.5rem 2rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>
            Welcome back 👋
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
  Your Company Brain is ready. Connect your first integration to start
  extracting knowledge.
</p>
<button
  onClick={() => router.push('/dashboard/query')}
  style={{
    padding: '0.6rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold'
  }}
>
  💬 Ask Your Brain
</button> 
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {[
            {
              label: 'Integrations',
              value: stats.integrations,
              icon: '🔌',
              color: '#3b82f6'
            },
            {
              label: 'Knowledge Nodes',
              value: stats.knowledge_nodes,
              icon: '🧠',
              color: '#8b5cf6'
            },
            {
              label: 'Documents',
              value: stats.documents,
              icon: '📄',
              color: '#10b981'
            },
          ].map((card) => (
            <div key={card.label} style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                {card.icon}
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: card.color,
                marginBottom: '0.25rem'
              }}>
                {card.value}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '1.5rem 2rem'
        }}>
          <h3 style={{
            marginBottom: '1.25rem',
            color: '#94a3b8',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Getting Started
          </h3>
          {[
            {
              step: '1',
              text: 'Connect your Slack workspace',
              done: stats.integrations > 0
            },
            {
              step: '2',
              text: 'Connect your Notion workspace',
              done: stats.integrations > 1
            },
            {
              step: '3',
              text: 'Watch Company Brain extract your knowledge',
              done: stats.knowledge_nodes > 0
            },
            {
              step: '4',
              text: 'Ask your first question',
              done: false
            },
          ].map((item) => (
            <div key={item.step} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 0',
              borderBottom: '1px solid #1e293b'
            }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: item.done ? '#166534' : '#1e293b',
                border: `1px solid ${item.done ? '#22c55e' : '#334155'}`,
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
                textDecoration: item.done ? 'line-through' : 'none'
              }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const getUser = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push('/auth')
      } else {
        setUser(session.user)
      }
      setLoading(false)
    }
    getUser()
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
        justifyContent: 'center'
      }}>
        Loading...
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
        <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
          Company Brain 🧠
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
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

      {/* Main content */}
      <div style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Welcome to your Company Brain 👋
          </h2>
          <p style={{ color: '#64748b' }}>
            Your account is set up. Next step: connect your first integration.
          </p>
        </div>

        {/* Status cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[
            { label: 'Integrations', value: '0', icon: '🔌' },
            { label: 'Knowledge Nodes', value: '0', icon: '🧠' },
            { label: 'Queries Today', value: '0', icon: '💬' },
          ].map((card) => (
            <div key={card.label} style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {card.icon}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {card.value}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Next steps */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '2rem'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#94a3b8' }}>
            Next Steps
          </h3>
          {[
            { step: '1', text: 'Connect your Slack workspace', done: false },
            { step: '2', text: 'Connect your Notion workspace', done: false },
            { step: '3', text: 'Watch Company Brain extract your knowledge', done: false },
            { step: '4', text: 'Ask your first question', done: false },
          ].map((item) => (
            <div key={item.step} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 0',
              borderBottom: '1px solid #1e293b'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                color: '#64748b',
                flexShrink: 0
              }}>
                {item.step}
              </div>
              <span style={{ color: '#94a3b8' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
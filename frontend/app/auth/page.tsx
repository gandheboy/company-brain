'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      if (isLogin) {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        router.push('/onboarding')

      } else {
        // SIGNUP
        if (!orgName.trim()) {
          throw new Error('Company name is required')
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { org_name: orgName }
          }
        })
        if (error) throw error
        if (data.session) {
          router.replace('/dashboard')
          router.refresh()
        } else {
          setSuccessMessage('Account created. Please verify your email, then log in.')
          setIsLogin(true)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            Company Brain 🧠
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            The memory layer for AI-powered companies
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isLogin ? '#3b82f6' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: isLogin ? 'bold' : 'normal'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: !isLogin ? '#3b82f6' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: !isLogin ? 'bold' : 'normal'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Company name - signup only */}
          {!isLogin && (
            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
                Company Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Corp"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#450a0a',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#052e16',
              border: '1px solid #16a34a',
              borderRadius: '8px',
              color: '#86efac',
              fontSize: '0.85rem'
            }}>
              {successMessage}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleAuth}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              backgroundColor: loading ? '#1e40af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </div>

        {/* Switch mode */}
        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: '#64748b',
          fontSize: '0.85rem'
        }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            style={{ color: '#3b82f6', cursor: 'pointer' }}
          >
            {isLogin ? 'Sign up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

const supabase = createClient()

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage('Invalid email or password.')
      setLoading(false)
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <main
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: '#f4f7f8',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(6, 43, 84, 0.12)',
        }}
      >
        <header style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1
            style={{
              margin: '0 0 8px',
              color: '#062b54',
              fontSize: '2rem',
            }}
          >
            RitsuFlow
          </h1>

          <p style={{ margin: 0, color: '#64748b' }}>
            Location-based planning and flow control
          </p>
        </header>

        <form
          onSubmit={handleLogin}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {errorMessage && (
            <div
              role="alert"
              style={{
                padding: '12px',
                color: '#991b1b',
                backgroundColor: '#fee2e2',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              {errorMessage}
            </div>
          )}

          <label style={{ color: '#334155', fontWeight: 600 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              required
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxSizing: 'border-box',
                fontSize: '1rem',
              }}
            />
          </label>

          <label style={{ color: '#334155', fontWeight: 600 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxSizing: 'border-box',
                fontSize: '1rem',
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px',
              color: '#ffffff',
              backgroundColor: loading ? '#94a3b8' : '#062b54',
              border: 0,
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Chama o cofre do Supabase para verificar e-mail e senha
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('E-mail ou senha incorretos.');
      setLoading(false);
    } else {
      // Se der certo, manda para o painel comercial
      router.push('/dashboard');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ color: '#2A4365', textAlign: 'center', marginBottom: '30px' }}>ExcelisPro System</h1>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {error && (
            <div style={{ color: '#c53030', backgroundColor: '#fed7d7', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#4A5568', fontWeight: 'bold', fontSize: '0.9rem' }}>E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gestao.excelispro@gmail.com" 
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', boxSizing: 'border-box' }} 
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#4A5568', fontWeight: 'bold', fontSize: '0.9rem' }}>Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', boxSizing: 'border-box' }} 
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '14px', 
              backgroundColor: loading ? '#a0aec0' : '#2A4365', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              marginTop: '10px' 
            }}
          >
            {loading ? 'Validando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

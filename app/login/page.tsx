'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setLoading(false);
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(43,127,255,0.12) 0%, transparent 70%), #05080f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"DM Sans",system-ui,sans-serif',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus {
          border-color: rgba(43,127,255,0.6) !important;
          box-shadow: 0 0 0 3px rgba(43,127,255,0.15) !important;
          outline: none !important;
          background: rgba(0,0,0,0.5) !important;
        }
      `}</style>

      <div style={{
        background: 'rgba(13,20,40,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg,#3b8fff 0%,#1a4fd6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            boxShadow: '0 2px 16px rgba(43,127,255,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}>✉</div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.025em', color: '#f0f4ff' }}>
            AutoEmail
          </span>
        </div>

        <div style={{ marginBottom: 6, fontSize: 20, fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.02em' }}>
          Welcome back
        </div>
        <div style={{ fontSize: 13, color: '#4a6080', marginBottom: 28 }}>
          Enter your password to continue
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.09em', textTransform: 'uppercase',
            color: '#4a6080', marginBottom: 7,
          }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter password"
            autoFocus
            style={{
              display: 'block', width: '100%',
              border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: 10, padding: '11px 14px', fontSize: 14,
              color: '#f0f4ff', background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(8px)', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', borderRadius: 8,
            padding: '9px 14px', fontSize: 13,
            marginBottom: 16, fontFamily: 'DM Mono,monospace',
          }}>
            ✕ {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !password}
          style={{
            width: '100%',
            background: loading || !password
              ? 'rgba(43,127,255,0.3)'
              : 'linear-gradient(135deg, #2b7fff 0%, #1a5fd6 100%)',
            color: '#fff', border: 'none',
            borderRadius: 10, padding: '11px 22px', fontSize: 14,
            fontWeight: 600, cursor: loading || !password ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: loading || !password ? 'none' : '0 2px 16px rgba(43,127,255,0.4)',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>
      </div>
    </div>
  );
}
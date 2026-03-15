'use client';
import { View, CronHealth, Theme } from './types';

interface Props {
  view: View;
  setView: (v: View) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  lastRefreshed: number;
  fetchCampaigns: () => void;
  cronHealth: CronHealth;
  checkCronHealth: () => void;
  goHome: () => void;
  C: Theme;
  btnGhost: React.CSSProperties;
}

export function NavBar({ view, setView, dark, setDark, lastRefreshed, fetchCampaigns, cronHealth, checkCronHealth, goHome, C, btnGhost }: Props) {
  const d = dark;
  const tabs = [
    { v: 'list' as View, label: 'Campaigns', icon: '✉' },
    { v: 'create' as View, label: 'New Campaign', icon: '+' },
    { v: 'test' as View, label: 'Test Email', icon: '⚡' },
    { v: 'senders' as View, label: 'Senders', icon: '⚙' },
  ];

  return (
    <nav style={{
      background: d ? 'rgba(5,8,15,0.92)' : '#ffffff',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: d ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: d
        ? '0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.4)'
        : '0 1px 0 #e2e8f0, 0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <button onClick={goHome} className="logo-btn" style={{
        display: 'flex', alignItems: 'center', gap: 9, marginRight: 36,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        transition: 'opacity 0.15s', flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'linear-gradient(135deg, #3b8fff 0%, #1a4fd6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, boxShadow: '0 2px 12px rgba(43,127,255,0.4)',
        }}>✉</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em', color: C.text, lineHeight: 1.1 }}>AutoEmail</div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'DM Mono,monospace' }}>Campaign Manager</div>
        </div>
      </button>

      <div style={{ display: 'flex', gap: 1, flex: 1, background: d ? 'rgba(255,255,255,0.04)' : '#f1f5f9', borderRadius: 10, padding: 3 }}>
        {tabs.map(({ v, label, icon }) => (
          <button key={v} onClick={() => setView(v)} className="nav-tab gbtn"
            style={{
              padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: view === v ? 600 : 500,
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 5,
              color: view === v ? (d ? '#fff' : '#1e293b') : C.muted,
              background: view === v
                ? d ? 'rgba(43,127,255,0.9)' : '#ffffff'
                : 'transparent',
              boxShadow: view === v
                ? d ? '0 1px 8px rgba(43,127,255,0.4)' : '0 1px 4px rgba(0,0,0,0.1)'
                : undefined,
            } as React.CSSProperties}>
            <span style={{ fontSize: 11, opacity: 0.7 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16 }}>
        <div onClick={fetchCampaigns} title="Click to refresh" style={{
          fontSize: 10, fontFamily: 'DM Mono,monospace', color: C.muted,
          background: d ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
          padding: '4px 10px', borderRadius: 6,
          border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
          letterSpacing: '0.07em', cursor: 'pointer', userSelect: 'none' as const,
        }}>
          {Math.floor((Date.now() - lastRefreshed) / 1000) < 5 ? '● LIVE' : `↻ ${Math.floor((Date.now() - lastRefreshed) / 1000)}s`}
        </div>

        <div onClick={checkCronHealth} title="Click to ping cron" style={{
          fontSize: 10, fontFamily: 'DM Mono,monospace', cursor: 'pointer',
          padding: '4px 10px', borderRadius: 6, letterSpacing: '0.07em', userSelect: 'none' as const,
          border: `1px solid ${cronHealth.status === 'error' ? 'rgba(239,68,68,0.35)' : cronHealth.status === 'sent' ? 'rgba(16,185,129,0.35)' : d ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
          background: cronHealth.status === 'error' ? 'rgba(239,68,68,0.08)' : cronHealth.status === 'sent' ? 'rgba(16,185,129,0.08)' : d ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
          color: cronHealth.status === 'error' ? '#fca5a5' : cronHealth.status === 'sent' ? '#6ee7b7' : C.muted,
        }}>
          {cronHealth.status === 'error' ? '⚠ CRON' : cronHealth.status === 'sent' ? '✓ CRON' : cronHealth.last ? `CRON ${Math.floor((Date.now() - new Date(cronHealth.last).getTime()) / 60000)}m` : '○ CRON'}
        </div>

        <button onClick={() => setDark(!d)} title={d ? 'Light mode' : 'Dark mode'}
          style={{
            width: 36, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
            background: d ? 'linear-gradient(135deg,#3b8fff,#1a4fd6)' : '#e2e8f0',
            position: 'relative', transition: 'all 0.25s', flexShrink: 0,
            boxShadow: d ? '0 0 10px rgba(43,127,255,0.4)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',
          }}>
          <div style={{
            position: 'absolute', top: 3, left: d ? 17 : 3,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', transition: 'left 0.25s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8,
          }}>
            {d ? '☽' : '☀'}
          </div>
        </button>
      </div>
    </nav>
  );
}
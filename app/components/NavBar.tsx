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

export function NavBar({
  view, setView, dark, setDark,
  lastRefreshed, fetchCampaigns,
  cronHealth, checkCronHealth,
  goHome, C, btnGhost,
}: Props) {
  const d = dark;
  return (
    <nav style={{
      background: d ? 'rgba(5,8,15,0.8)' : 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderBottom: `1px solid ${C.border}`,
      padding: '0 32px', display: 'flex', alignItems: 'center', height: 52,
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: d
        ? '0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)'
        : '0 1px 0 rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)',
    }}>
      {/* LOGO */}
      <button onClick={goHome} className="logo-btn" style={{
        display: 'flex', alignItems: 'center', gap: 10, marginRight: 40,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        transition: 'opacity 0.15s',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg,#3b8fff 0%,#1a4fd6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          boxShadow: '0 2px 12px rgba(43,127,255,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}>✉</div>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.025em', color: C.text }}>
          AutoEmail
        </span>
      </button>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 2, flex: 1 }}>
        {(['list', 'Campaigns'], ['create', 'New Campaign'], ['test', 'Test Email'], ['senders', 'Senders']) as unknown as never}
        {(
          [
            ['list', 'Campaigns'],
            ['create', 'New Campaign'],
            ['test', 'Test Email'],
            ['senders', 'Senders'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => { setView(v); }}
            className="nav-tab gbtn"
            style={{
              padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              color: view === v ? C.accent : C.muted,
              background: view === v
                ? d ? 'rgba(43,127,255,0.12)' : 'rgba(43,127,255,0.08)'
                : 'transparent',
              boxShadow: view === v ? 'inset 0 0 0 1px rgba(43,127,255,0.2)' : undefined,
            } as React.CSSProperties}
          >
            {label}
          </button>
        ))}
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            fontSize: 10, fontFamily: 'DM Mono,monospace', color: C.muted,
            background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            padding: '3px 9px', borderRadius: 6,
            border: `1px solid ${C.border}`, letterSpacing: '0.07em', cursor: 'pointer',
          }}
          onClick={fetchCampaigns}
          title="Click to refresh"
        >
          {Math.floor((Date.now() - lastRefreshed) / 1000) < 5
            ? '✓ LIVE'
            : `↻ ${Math.floor((Date.now() - lastRefreshed) / 1000)}s ago`}
        </div>
        <div
          onClick={checkCronHealth}
          title="Click to ping cron"
          style={{
            fontSize: 10, fontFamily: 'DM Mono,monospace', cursor: 'pointer',
            padding: '3px 9px', borderRadius: 6, letterSpacing: '0.07em',
            border: `1px solid ${
              cronHealth.status === 'error' ? 'rgba(239,68,68,0.3)'
              : cronHealth.status === 'sent' ? 'rgba(16,185,129,0.3)'
              : C.border}`,
            background: cronHealth.status === 'error' ? 'rgba(239,68,68,0.08)'
              : cronHealth.status === 'sent' ? 'rgba(16,185,129,0.08)'
              : d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            color: cronHealth.status === 'error' ? '#fca5a5'
              : cronHealth.status === 'sent' ? '#6ee7b7'
              : C.muted,
          }}
        >
          {cronHealth.status === 'error' ? '⚠ CRON ERR'
            : cronHealth.status === 'sent' ? '✓ CRON OK'
            : cronHealth.last
              ? `CRON ${Math.floor((Date.now() - new Date(cronHealth.last).getTime()) / 60000)}m ago`
              : '○ CRON'}
        </div>
        <button
          onClick={() => setDark(!d)}
          className="gbtn"
          style={{ ...btnGhost, padding: '5px 12px', fontSize: 12, borderRadius: 8 }}
        >
          {d ? '☀ Light' : '☽ Dark'}
        </button>
      </div>
    </nav>
  );
}
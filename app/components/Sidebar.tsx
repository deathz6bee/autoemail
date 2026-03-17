'use client';
import { View, CronHealth, Theme, Campaign } from './types';

interface Props {
  view: View;
  setView: (v: View) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  lastRefreshed: number;
  fetchCampaigns: () => void;
  cronHealth: CronHealth;
  checkCronHealth: () => void;
  C: Theme;
  campaigns: Campaign[];
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const SvgIcon = ({ d, size = 16, color }: { d: string; size?: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const ICONS = {
  campaigns: "M3 8h18M3 12h18M3 16h12",
  create:    "M12 5v14M5 12h14",
  test:      "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
  senders:   "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  collapse:  "M11 19l-7-7 7-7M18 19l-7-7 7-7",
  expand:    "M13 5l7 7-7 7M6 5l7 7-7 7",
  moon:      "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  sun:       "M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 6a6 6 0 100 12 6 6 0 000-12z",
  cron:      "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  contacts:  "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
};

export function Sidebar({ view, setView, dark, setDark, lastRefreshed, fetchCampaigns, cronHealth, checkCronHealth, C, campaigns, collapsed, setCollapsed }: Props) {
  const d = dark;
  const W = collapsed ? 64 : 240;

  const active = campaigns.filter(c => ['in_progress', 'sending'].includes(c.status)).length;
  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);

  const navItems = [
    { v: 'list' as View,     label: 'Campaigns',    icon: ICONS.campaigns, badge: campaigns.length > 0 ? String(campaigns.length) : null },
    { v: 'create' as View,   label: 'New Campaign', icon: ICONS.create,    badge: null },
    { v: 'contacts' as View, label: 'Contacts',     icon: ICONS.contacts,  badge: null },
    { v: 'test' as View,     label: 'Test Email',   icon: ICONS.test,      badge: null },
    { v: 'senders' as View,  label: 'Senders',      icon: ICONS.senders,   badge: null },
  ];

  const sidebarBg = d ? '#0a0f1e' : '#ffffff';
  const borderColor = d ? 'rgba(255,255,255,0.07)' : '#e8edf5';
  const activeColor = '#2b7fff';
  const activeBg = d ? 'rgba(43,127,255,0.12)' : 'rgba(43,127,255,0.08)';
  const hoverBg = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  return (
  <>
    <aside style={{
      width: W,
      minWidth: W,
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: sidebarBg,
      borderRight: `1px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      boxShadow: d ? '2px 0 20px rgba(0,0,0,0.3)' : '2px 0 12px rgba(0,0,0,0.04)',
      zIndex: 50,
      flexShrink: 0,
    }} className="desktop-sidebar">

      {/* LOGO + COLLAPSE */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '20px 0' : '18px 16px',
        borderBottom: `1px solid ${borderColor}`,
        minHeight: 64,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg, #3b8fff, #1a4fd6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(43,127,255,0.35)',
              fontSize: 16,
            }}>✉</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: C.text, lineHeight: 1.1, whiteSpace: 'nowrap' }}>AutoEmail</div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'DM Mono,monospace', whiteSpace: 'nowrap' }}>Campaign Manager</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #3b8fff, #1a4fd6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(43,127,255,0.35)',
            fontSize: 16, cursor: 'pointer',
          }} onClick={() => setCollapsed(false)}>✉</div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            borderRadius: 6, display: 'flex', alignItems: 'center',
            color: C.muted, transition: 'all 0.15s',
          }}>
            <SvgIcon d={ICONS.collapse} size={14} color={C.muted} />
          </button>
        )}
      </div>

      {/* NEW CAMPAIGN BUTTON */}
      {!collapsed && (
        <div style={{ padding: '12px 12px 4px' }}>
          <button onClick={() => setView('create')} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 7, padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #2b7fff, #1a5fd6)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            boxShadow: '0 2px 12px rgba(43,127,255,0.35)',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}>
            <SvgIcon d={ICONS.create} size={13} color="#fff" />
            New Campaign
          </button>
        </div>
      )}
      {collapsed && (
        <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => { setView('create'); setCollapsed(false); }} style={{
            width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #2b7fff, #1a5fd6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(43,127,255,0.35)',
          }}>
            <SvgIcon d={ICONS.create} size={15} color="#fff" />
          </button>
        </div>
      )}

      {/* NAV ITEMS */}
      <nav style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ v, label, icon, badge }) => {
          const isActive = view === v;
          return (
            <button key={v} onClick={() => setView(v)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 0' : '9px 12px',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: isActive ? activeBg : 'transparent',
                color: isActive ? activeColor : C.muted,
                fontSize: 15, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s', width: '100%',
                fontFamily: 'inherit', position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {/* active indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', height: '60%',
                  width: 3, borderRadius: 2,
                  background: activeColor,
                  boxShadow: `0 0 8px ${activeColor}`,
                }} />
              )}
              <SvgIcon d={icon} size={16} color={isActive ? activeColor : C.muted} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
              {!collapsed && badge && (
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                  background: isActive ? activeColor : (d ? 'rgba(255,255,255,0.08)' : '#e8edf5'),
                  color: isActive ? '#fff' : C.muted,
                  padding: '1px 7px', borderRadius: 10,
                  fontFamily: 'DM Mono,monospace',
                }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* DIVIDER */}
      <div style={{ height: 1, background: borderColor, margin: '0 12px' }} />

      {/* STATS MINI */}
      {!collapsed && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: active > 0 ? '#f59e0b' : C.muted, fontFamily: 'DM Mono,monospace' }}>{active}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sent</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.accent, fontFamily: 'DM Mono,monospace' }}>{totalSent.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* DIVIDER */}
      <div style={{ height: 1, background: borderColor, margin: '0 12px' }} />

      {/* BOTTOM — cron + dark toggle */}
      <div style={{ padding: collapsed ? '12px 0' : '12px 12px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: collapsed ? 'center' : 'stretch' }}>
        {/* CRON */}
        <button onClick={checkCronHealth} title="Ping cron" style={{
          display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 8,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '8px 0' : '7px 10px',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          background: cronHealth.status === 'error' ? 'rgba(239,68,68,0.08)' : cronHealth.status === 'sent' ? 'rgba(16,185,129,0.08)' : 'transparent',
          color: cronHealth.status === 'error' ? '#fca5a5' : cronHealth.status === 'sent' ? '#6ee7b7' : C.muted,
          fontSize: 12, fontFamily: 'DM Mono,monospace', transition: 'all 0.15s', width: collapsed ? 'auto' : '100%',
        }}>
          <SvgIcon d={ICONS.cron} size={14} color={cronHealth.status === 'error' ? '#fca5a5' : cronHealth.status === 'sent' ? '#6ee7b7' : C.muted} />
          {!collapsed && <span>{cronHealth.status === 'error' ? '⚠ CRON ERR' : cronHealth.status === 'sent' ? '✓ CRON OK' : 'CRON'}</span>}
        </button>

        {/* LIVE */}
        <button onClick={fetchCampaigns} title="Refresh" style={{
          display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 8,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '8px 0' : '7px 10px',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'transparent', color: C.muted,
          fontSize: 12, fontFamily: 'DM Mono,monospace', transition: 'all 0.15s', width: collapsed ? 'auto' : '100%',
        }}>
          <SvgIcon d="M4 4v5h.582M20 20v-5h-.581M5.5 9A7.5 7.5 0 0118 12M18.5 15A7.5 7.5 0 016 12" size={14} color={C.muted} />
          {!collapsed && <span>{Math.floor((Date.now() - lastRefreshed) / 1000) < 5 ? '● LIVE' : `↻ ${Math.floor((Date.now() - lastRefreshed) / 1000)}s ago`}</span>}
        </button>

        {/* DARK TOGGLE */}
        <button onClick={() => setDark(!d)} title={d ? 'Light mode' : 'Dark mode'} style={{
          display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 8,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '8px 0' : '7px 10px',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'transparent', color: C.muted,
          fontSize: 12, fontFamily: 'DM Mono,monospace', transition: 'all 0.15s', width: collapsed ? 'auto' : '100%',
        }}>
          <SvgIcon d={d ? ICONS.sun : ICONS.moon} size={14} color={C.muted} />
          {!collapsed && <span>{d ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* EXPAND when collapsed */}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} title="Expand sidebar" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: C.muted, transition: 'all 0.15s',
          }}>
            <SvgIcon d={ICONS.expand} size={13} color={C.muted} />
          </button>
        )}
      </div>
    </aside>

    {/* MOBILE BOTTOM NAV */}
    <nav className="mobile-nav" style={{
      display: 'none',
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: sidebarBg,
      borderTop: `1px solid ${borderColor}`,
      padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {navItems.map(({ v, label, icon }) => {
          const isActive = view === v;
          return (
            <button key={v} onClick={() => setView(v)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer',
              color: isActive ? activeColor : C.muted, fontFamily: 'inherit',
              minWidth: 48,
            }}>
              <SvgIcon d={icon} size={20} color={isActive ? activeColor : C.muted} />
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>{label}</span>
            </button>
          );
        })}
        <button onClick={() => setDark(!d)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer',
          color: C.muted, fontFamily: 'inherit', minWidth: 48,
        }}>
          <SvgIcon d={d ? ICONS.sun : ICONS.moon} size={20} color={C.muted} />
          <span style={{ fontSize: 9, letterSpacing: '0.03em' }}>{d ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </nav>
  </>
  );
}
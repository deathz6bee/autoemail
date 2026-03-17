'use client';
import { Campaign, Theme } from './types';

interface Props {
  campaigns: Campaign[];
  C: Theme;
  glassCard: React.CSSProperties;
}

const Icon = ({ path, color, size = 20 }: { path: string; color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const ICONS = {
  send:   "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
  zap:    "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  check:  "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
  folder: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
  bounce: "M10 15l-3-3 3-3M14 9l3 3-3 3M3 12h18",
  clock:  "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
};

export function StatsBar({ campaigns, C }: Props) {
  const d = C.text === '#f0f4ff';

  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
  const active = campaigns.filter(c => ['in_progress', 'scheduled', 'sending'].includes(c.status)).length;
  const done = campaigns.filter(c => c.status === 'done');
  const totalRecips = done.reduce((s, c) => s + (c.total_count || 0), 0);
  const successRate = totalRecips > 0
    ? Math.round((done.reduce((s, c) => s + (c.sent_count || 0), 0) / totalRecips) * 100)
    : 0;
  const totalFailed = campaigns.reduce((s, c) => s + ((c as any).failed_count || 0), 0);
  const bounceRate = totalSent > 0 ? Math.round((totalFailed / totalSent) * 100) : 0;
  const todaySent = campaigns
    .filter(c => ['in_progress', 'sending'].includes(c.status))
    .reduce((s, c) => s + (c.sent_count || 0), 0);

  const stats = [
    {
      label: 'Emails Sent',
      value: totalSent.toLocaleString(),
      sub: 'all time',
      color: '#2b7fff',
      glow: 'rgba(43,127,255,0.22)',
      border: d ? 'rgba(43,127,255,0.2)' : 'rgba(43,127,255,0.18)',
      bg: d ? 'rgba(43,127,255,0.09)' : 'rgba(43,127,255,0.05)',
      icon: ICONS.send,
    },
    {
      label: 'Active Campaigns',
      value: String(active),
      sub: 'running now',
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.22)',
      border: d ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.22)',
      bg: d ? 'rgba(245,158,11,0.09)' : 'rgba(245,158,11,0.06)',
      icon: ICONS.zap,
    },
    {
      label: 'Success Rate',
      value: totalRecips > 0 ? `${successRate}%` : '—',
      sub: totalRecips > 0 ? `${done.reduce((s,c)=>s+(c.sent_count||0),0)} of ${totalRecips}` : 'no data yet',
      color: '#10b981',
      glow: 'rgba(16,185,129,0.22)',
      border: d ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.18)',
      bg: d ? 'rgba(16,185,129,0.09)' : 'rgba(16,185,129,0.05)',
      icon: ICONS.check,
    },
    {
      label: 'Total Campaigns',
      value: String(campaigns.length),
      sub: `${done.length} completed`,
      color: d ? '#94a3b8' : '#64748b',
      glow: 'rgba(100,116,139,0.15)',
      border: d ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)',
      bg: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
      icon: ICONS.folder,
    },
    {
      label: 'Bounce Rate',
      value: totalSent > 0 ? `${bounceRate}%` : '—',
      sub: totalFailed > 0 ? `${totalFailed} failed` : 'no bounces',
      color: totalFailed > 0 ? '#ef4444' : '#10b981',
      glow: totalFailed > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.18)',
      border: totalFailed > 0
        ? (d ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.18)')
        : (d ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.18)'),
      bg: totalFailed > 0
        ? (d ? 'rgba(239,68,68,0.09)' : 'rgba(239,68,68,0.04)')
        : (d ? 'rgba(16,185,129,0.09)' : 'rgba(16,185,129,0.04)'),
      icon: ICONS.bounce,
    },
    {
      label: 'In Progress',
      value: String(todaySent),
      sub: 'emails sent so far',
      color: '#8b5cf6',
      glow: 'rgba(139,92,246,0.22)',
      border: d ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.18)',
      bg: d ? 'rgba(139,92,246,0.09)' : 'rgba(139,92,246,0.05)',
      icon: ICONS.clock,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 14,
      marginBottom: 32,
    }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: d
            ? `linear-gradient(145deg, ${s.bg}, rgba(255,255,255,0.02))`
            : `linear-gradient(145deg, ${s.bg}, rgba(255,255,255,0.97))`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${s.border}`,
          borderRadius: 18,
          padding: '22px 24px',
          boxShadow: d
            ? `0 4px 28px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)`
            : `0 2px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'default',
        }}>
          {/* glow orb */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 100, height: 100, borderRadius: '50%',
            background: s.glow, filter: 'blur(24px)',
            pointerEvents: 'none',
          }} />

          {/* TOP ROW — label + icon */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 16,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.09em',
              textTransform: 'uppercase', color: s.color,
              fontFamily: 'DM Mono,monospace', opacity: 0.85,
            }}>
              {s.label}
            </span>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: d ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
              border: `1px solid ${s.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 2px 12px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
            }}>
              <Icon path={s.icon} color={s.color} size={18} />
            </div>
          </div>

          {/* BIG NUMBER */}
          <div style={{
            fontSize: 42, fontWeight: 800,
            color: s.color,
            fontFamily: 'DM Mono,monospace',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: 8,
            textShadow: `0 0 32px ${s.glow}`,
          }}>
            {s.value}
          </div>

          {/* SUB LABEL */}
          <div style={{
            fontSize: 12, color: C.muted,
            fontFamily: 'DM Mono,monospace',
            opacity: 0.6,
            letterSpacing: '0.01em',
          }}>
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
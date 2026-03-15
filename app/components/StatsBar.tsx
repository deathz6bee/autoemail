'use client';
import { Campaign, Theme } from './types';

interface Props {
  campaigns: Campaign[];
  C: Theme;
  glassCard: React.CSSProperties;
}

export function StatsBar({ campaigns, C, glassCard }: Props) {
  const d = C.text === '#f0f4ff'; // detect dark mode
  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
  const active = campaigns.filter(c => ['in_progress', 'scheduled', 'sending'].includes(c.status)).length;
  const done = campaigns.filter(c => c.status === 'done');
  const totalRecips = done.reduce((s, c) => s + (c.total_count || 0), 0);
  const successRate = totalRecips > 0 ? Math.round((done.reduce((s, c) => s + (c.sent_count || 0), 0) / totalRecips) * 100) : 0;
  const totalFailed = campaigns.reduce((s, c) => s + ((c as any).failed_count || 0), 0);
  const bounceRate = totalSent > 0 ? Math.round((totalFailed / totalSent) * 100) : 0;
  const todaySent = campaigns.filter(c => ['in_progress', 'sending'].includes(c.status)).reduce((s, c) => s + (c.sent_count || 0), 0);

  const stats = [
    { label: 'Emails Sent',     value: totalSent.toLocaleString(), color: '#3b82f6', bg: d ? 'rgba(59,130,246,0.1)' : '#eff6ff',  border: d ? 'rgba(59,130,246,0.2)' : '#bfdbfe', icon: '📤' },
    { label: 'Active',          value: String(active),             color: '#f59e0b', bg: d ? 'rgba(245,158,11,0.1)' : '#fffbeb',  border: d ? 'rgba(245,158,11,0.2)' : '#fde68a', icon: '🔄' },
    { label: 'Success Rate',    value: totalRecips > 0 ? `${successRate}%` : '—', color: '#10b981', bg: d ? 'rgba(16,185,129,0.1)' : '#ecfdf5', border: d ? 'rgba(16,185,129,0.2)' : '#a7f3d0', icon: '✓' },
    { label: 'Campaigns',       value: String(campaigns.length),   color: C.muted,   bg: d ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: d ? 'rgba(255,255,255,0.08)' : '#e2e8f0', icon: '📁' },
    { label: 'Bounce Rate',     value: totalSent > 0 ? `${bounceRate}%` : '—', color: '#ef4444', bg: d ? 'rgba(239,68,68,0.1)' : '#fef2f2',  border: d ? 'rgba(239,68,68,0.2)' : '#fecaca', icon: '↩' },
    { label: 'In Progress',     value: String(todaySent),          color: '#8b5cf6', bg: d ? 'rgba(139,92,246,0.1)' : '#f5f3ff',  border: d ? 'rgba(139,92,246,0.2)' : '#ddd6fe', icon: '⚡' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 24 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 12,
          padding: '14px 16px',
          transition: 'transform 0.15s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.color, fontFamily: 'DM Mono,monospace', opacity: 0.8 }}>{s.label}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'DM Mono,monospace', color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
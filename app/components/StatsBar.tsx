import { Campaign, Theme } from './types';

interface Props {
  campaigns: Campaign[];
  C: Theme;
  glassCard: React.CSSProperties;
}

export function StatsBar({ campaigns, C, glassCard }: Props) {
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
    { label: 'Emails Sent',     value: totalSent.toLocaleString(), color: '#60a5fa', glow: 'rgba(59,130,246,0.2)' },
    { label: 'Active',          value: String(active),             color: '#fcd34d', glow: 'rgba(245,158,11,0.2)' },
    { label: 'Success Rate',    value: totalRecips > 0 ? `${successRate}%` : '—', color: '#6ee7b7', glow: 'rgba(16,185,129,0.2)' },
    { label: 'Total Campaigns', value: String(campaigns.length),   color: C.muted2,  glow: 'transparent' },
    { label: 'Bounce Rate',     value: totalSent > 0 ? `${bounceRate}%` : '—', color: '#fca5a5', glow: 'rgba(239,68,68,0.15)' },
    { label: 'Est. Today',      value: String(todaySent),          color: '#c4b5fd', glow: 'rgba(139,92,246,0.15)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 28 }}>
      {stats.map(s => (
        <div key={s.label} style={{ ...glassCard, padding: '16px 18px' }}>
          <div style={{
            fontSize: 26, fontWeight: 700,
            fontFamily: 'DM Mono,monospace', color: s.color,
            letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6,
            textShadow: `0 0 20px ${s.glow}`,
          }}>
            {s.value}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: C.muted,
          }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
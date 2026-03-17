export type Recipient = {
  email: string;
  name?: string;
  first_name?: string;
  business_name?: string;
  phone?: string;
  city?: string;
  state?: string;
  overall_score?: string;
  is_safe_to_send?: string;
  website?: string;
  rating?: string;
  [key: string]: string | undefined;
};

export type Variant = { subject: string; body: string };

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduled_at: string;
  notes?: string;
  sent_count?: number;
  total_count?: number;
  recipients: { count: number }[];
};

export type FollowUpRec = { id: string; email: string; name: string; selected: boolean };

export type View = 'list' | 'create' | 'test' | 'followup' | 'senders' | 'contacts';

export type SenderAccount = { id: string; email: string; label: string; is_active: boolean; created_at: string };

export type SenderSplit = { email: string; pct: number };

export type ToastItem = { id: number; msg: string; ok: boolean };

export type CronHealth = { last: string | null; status: string };

export const TAGS = [
  '{{first_name}}', '{{name}}', '{{company}}', '{{city}}',
  '{{state}}', '{{email}}', '{{phone}}', '{{website}}', '{{rating}}',
];

export const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string; glow: string }> = {
  scheduled:   { label: 'SCHEDULED', dot: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  text: '#93c5fd', glow: 'rgba(59,130,246,0.3)' },
  sending:     { label: 'SENDING',   dot: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  text: '#fcd34d', glow: 'rgba(245,158,11,0.4)' },
  in_progress: { label: 'ACTIVE',    dot: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  text: '#fcd34d', glow: 'rgba(245,158,11,0.4)' },
  done:        { label: 'COMPLETE',  dot: '#34d399', bg: 'rgba(16,185,129,0.12)',  text: '#6ee7b7', glow: 'rgba(16,185,129,0.3)' },
  failed:      { label: 'FAILED',    dot: '#f87171', bg: 'rgba(239,68,68,0.12)',   text: '#fca5a5', glow: 'rgba(239,68,68,0.3)' },
  paused:      { label: 'PAUSED',    dot: '#a78bfa', bg: 'rgba(139,92,246,0.12)', text: '#c4b5fd', glow: 'rgba(139,92,246,0.3)' },
  draft:       { label: 'DRAFT',     dot: '#9ca3af', bg: 'rgba(107,114,128,0.12)', text: '#d1d5db', glow: 'rgba(107,114,128,0.2)' },
};

// Theme colors helper — pass dark boolean, get color map
export type Theme = ReturnType<typeof makeTheme>;
export function makeTheme(d: boolean) {
  return {
    bg:         d ? '#05080f'  : '#eef1f8',
    bgGrad:     d
      ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(43,127,255,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.07) 0%, transparent 60%), #05080f'
      : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(43,127,255,0.07) 0%, transparent 70%), #eef1f8',
    glass:      d ? 'rgba(13,20,40,0.7)'    : 'rgba(255,255,255,0.75)',
    glassSolid: d ? 'rgba(10,16,32,0.95)'   : 'rgba(255,255,255,0.97)',
    glassHover: d ? 'rgba(16,25,50,0.85)'   : 'rgba(255,255,255,0.95)',
    border:     d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    border2:    d ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.13)',
    borderFocus: 'rgba(43,127,255,0.6)',
    text:       d ? '#f0f4ff' : '#0f172a',
    muted:      d ? '#4a6080' : '#64748b',
    muted2:     d ? '#6a8090' : '#94a3b8',
    accent:     '#2b7fff',
    accentGlow: 'rgba(43,127,255,0.25)',
    green:      '#10b981',
    greenGlow:  'rgba(16,185,129,0.2)',
    amber:      '#f59e0b',
    red:        '#ef4444',
    purple:     '#8b5cf6',
    cyan:       '#0ea5e9',
  };
}

// Shared style factories
export function makeStyles(C: Theme, d: boolean) {
  const glassCard: React.CSSProperties = {
    background: C.glass,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    boxShadow: d
      ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 700,
    letterSpacing: '0.09em', textTransform: 'uppercase',
    color: C.muted, marginBottom: 8,
  };
  const inp: React.CSSProperties = {
    display: 'block', width: '100%',
    border: `1px solid ${C.border2}`,
    borderRadius: 10, padding: '11px 15px', fontSize: 15,
    color: C.text, outline: 'none', boxSizing: 'border-box',
    background: d ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(8px)',
    fontFamily: 'inherit', transition: 'all 0.2s',
  };
  const btn: React.CSSProperties = {
    background: 'linear-gradient(135deg, #2b7fff 0%, #1a5fd6 100%)',
    color: '#fff', border: 'none',
    borderRadius: 10, padding: '11px 24px', fontSize: 15,
    fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em',
    transition: 'all 0.2s',
    boxShadow: '0 2px 12px rgba(43,127,255,0.35)',
  };
  const btnGhost: React.CSSProperties = {
    background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    color: C.muted2,
    border: `1px solid ${C.border2}`,
    borderRadius: 10, padding: '10px 18px', fontSize: 15,
    fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
    backdropFilter: 'blur(8px)',
  };
  return { glassCard, lbl, inp, btn, btnGhost };
}
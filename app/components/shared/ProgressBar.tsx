'use client';
import { Campaign, Theme } from '../types';

interface Props {
  c: Campaign;
  C: Theme;
}

export function ProgressBar({ c, C }: Props) {
  if (!(c.total_count && c.total_count > 0)) return null;
  if (!['in_progress', 'sending', 'done'].includes(c.status)) return null;
  const pct = Math.round(((c.sent_count || 0) / (c.total_count || 1)) * 100);
  const color = c.status === 'done' ? C.green : C.accent;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        height: 3, borderRadius: 99,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          width: `${pct}%`, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: c.status !== 'done' ? `0 0 8px ${color}88` : undefined,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Mono,monospace' }}>
          {c.sent_count || 0} / {c.total_count}
        </span>
        <span style={{ fontSize: 11, color, fontWeight: 600, fontFamily: 'DM Mono,monospace' }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}
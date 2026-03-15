'use client';
import { STATUS_META } from '../types';

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  const isPulsing = status === 'sending' || status === 'in_progress';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 6,
      background: m.bg, border: `1px solid ${m.glow}`,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
      color: m.text, fontFamily: 'DM Mono,monospace',
      boxShadow: isPulsing ? `0 0 10px ${m.glow}` : undefined,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: m.dot, flexShrink: 0,
        boxShadow: isPulsing ? `0 0 6px ${m.dot}` : undefined,
      }} />
      {m.label}
    </span>
  );
}
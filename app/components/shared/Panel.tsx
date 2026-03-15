'use client';
import { Theme } from '../types';

interface Props {
  title: string;
  accent: string;
  children: React.ReactNode;
  tint: string;
  C: Theme;
}

export function Panel({ title, accent, children, tint, C }: Props) {
  return (
    <div style={{
      borderTop: `1px solid ${C.border}`,
      padding: '20px 20px',
      background: tint,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div style={{
          width: 3, height: 16, borderRadius: 2,
          background: accent, boxShadow: `0 0 8px ${accent}88`, flexShrink: 0,
        }} />
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: accent, fontFamily: 'DM Mono,monospace',
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
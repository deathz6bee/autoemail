import { Theme } from './types';

interface Props {
  C: Theme;
  glassCard: React.CSSProperties;
  lbl: React.CSSProperties;
  inp: React.CSSProperties;
  btn: React.CSSProperties;
  testEmail: string; setTestEmail: (v: string) => void;
  testSubject: string; setTestSubject: (v: string) => void;
  testBody: string; setTestBody: (v: string) => void;
  testSending: boolean;
  testResult: string;
  sendTest: () => void;
}

export function TestEmailView(p: Props) {
  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.015em' }}>Test Email</h2>
      <div style={{ ...p.glassCard, padding: 28 }}>
        <div style={{ marginBottom: 14 }}><label style={p.lbl}>To</label><input style={p.inp} placeholder="your@email.com" value={p.testEmail} onChange={e => p.setTestEmail(e.target.value)} /></div>
        <div style={{ marginBottom: 14 }}><label style={p.lbl}>Subject</label><input style={p.inp} value={p.testSubject} onChange={e => p.setTestSubject(e.target.value)} /></div>
        <div style={{ marginBottom: 20 }}><label style={p.lbl}>Body</label><textarea style={{ ...p.inp, height: 140, resize: 'vertical' }} value={p.testBody} onChange={e => p.setTestBody(e.target.value)} /></div>
        {p.testResult && (
          <div style={{
            borderRadius: 10, padding: '10px 16px', marginBottom: 16,
            fontSize: 12, fontFamily: 'DM Mono,monospace', letterSpacing: '0.02em',
            background: p.testResult.includes('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: p.testResult.includes('✓') ? '#6ee7b7' : '#fca5a5',
            border: `1px solid ${p.testResult.includes('✓') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            boxShadow: p.testResult.includes('✓') ? '0 0 16px rgba(16,185,129,0.08)' : '0 0 16px rgba(239,68,68,0.08)',
          }}>
            {p.testResult}
          </div>
        )}
        <button style={{ ...p.btn, background: p.testSending ? 'rgba(255,255,255,0.1)' : p.btn.background as string }}
          disabled={p.testSending} onClick={p.sendTest} className="gbtn">
          {p.testSending ? 'Sending…' : '↑ Send Test Email'}
        </button>
      </div>
    </div>
  );
}
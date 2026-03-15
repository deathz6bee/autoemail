import { SenderAccount, Theme } from './types';

interface Props {
  C: Theme;
  d: boolean;
  glassCard: React.CSSProperties;
  lbl: React.CSSProperties;
  inp: React.CSSProperties;
  btn: React.CSSProperties;
  btnGhost: React.CSSProperties;
  senderAccounts: SenderAccount[];
  newSenderEmail: string; setNewSenderEmail: (v: string) => void;
  newSenderPassword: string; setNewSenderPassword: (v: string) => void;
  newSenderLabel: string; setNewSenderLabel: (v: string) => void;
  senderSaving: boolean;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  addSenderAccount: () => void;
  deleteSenderAccount: (id: string) => void;
  toggleSenderAccount: (id: string, active: boolean) => void;
}

export function SendersView(p: Props) {
  const { C } = p;
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em' }}>Sender Accounts</h2>
        <div style={{ fontSize: 11, color: '#fcd34d', fontFamily: 'DM Mono,monospace', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', padding: '4px 10px', borderRadius: 6 }}>
          ⚠ App passwords stored in Supabase — personal use only
        </div>
      </div>
      <div style={{ ...p.glassCard, padding: 22, marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, marginBottom: 14, fontFamily: 'DM Mono,monospace' }}>ADD ACCOUNT</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={p.lbl}>Gmail / Workspace Email</label>
            <input style={p.inp} placeholder="you@yourworkspace.com" value={p.newSenderEmail} onChange={e => p.setNewSenderEmail(e.target.value)} />
          </div>
          <div>
            <label style={p.lbl}>Label (optional)</label>
            <input style={p.inp} placeholder="e.g. Main, Outreach 2" value={p.newSenderLabel} onChange={e => p.setNewSenderLabel(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={p.lbl}>App Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={p.showPassword ? 'text' : 'password'}
              style={{ ...p.inp, paddingRight: 80 }}
              placeholder="xxxx xxxx xxxx xxxx"
              value={p.newSenderPassword}
              onChange={e => p.setNewSenderPassword(e.target.value)}
            />
            <button onClick={() => p.setShowPassword(!p.showPassword)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.muted, fontFamily: 'DM Mono,monospace' }}>
              {p.showPassword ? 'hide' : 'show'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 5, fontFamily: 'DM Mono,monospace', opacity: 0.7 }}>
            Google Account → Security → 2FA → App Passwords → generate one for "Mail"
          </div>
        </div>
        <button onClick={p.addSenderAccount} className="gbtn"
          style={{ ...p.btn, background: p.senderSaving ? 'rgba(255,255,255,0.1)' : p.btn.background as string }}
          disabled={p.senderSaving}>
          {p.senderSaving ? 'Adding…' : '+ Add Account'}
        </button>
      </div>

      {p.senderAccounts.length === 0 ? (
        <div style={{ ...p.glassCard, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: C.muted }}>No sender accounts added yet.</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 5, opacity: 0.6 }}>Add accounts above to send from multiple addresses.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {p.senderAccounts.map(a => (
            <div key={a.id} style={{ ...p.glassCard, padding: '14px 18px', opacity: a.is_active ? 1 : 0.5, transition: 'opacity 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: a.is_active ? '#34d399' : '#6b7280', boxShadow: a.is_active ? '0 0 8px rgba(52,211,153,0.5)' : undefined }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'DM Mono,monospace', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</div>
                  {a.label && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{a.label}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => p.toggleSenderAccount(a.id, !a.is_active)} className="gbtn"
                    style={{ ...p.btnGhost, fontSize: 11, padding: '4px 10px', color: a.is_active ? '#fcd34d' : '#6ee7b7', borderColor: a.is_active ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)' }}>
                    {a.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => p.deleteSenderAccount(a.id)} className="gbtn"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.muted, opacity: 0.4, padding: '2px 6px' }}>×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {p.senderAccounts.length > 0 && (
        <div style={{ ...p.glassCard, padding: 18, marginTop: 16, background: 'rgba(43,127,255,0.06)', border: '1px solid rgba(43,127,255,0.2)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#93c5fd', marginBottom: 12, fontFamily: 'DM Mono,monospace' }}>HOW SPLITS WORK</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
            When creating a campaign, Step 4 shows a split configurator. Set what % of recipients each account sends to. Recipients are assigned at campaign creation — not dynamically.
          </div>
        </div>
      )}
    </div>
  );
}
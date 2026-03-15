import { Campaign, FollowUpRec, Theme } from './types';

interface Props {
  C: Theme;
  d: boolean;
  glassCard: React.CSSProperties;
  lbl: React.CSSProperties;
  inp: React.CSSProperties;
  btn: React.CSSProperties;
  btnGhost: React.CSSProperties;
  fuCampaign: Campaign;
  fuRecs: FollowUpRec[];
  setFuRecs: (recs: FollowUpRec[]) => void;
  fuSearch: string; setFuSearch: (v: string) => void;
  fuSubject: string; setFuSubject: (v: string) => void;
  fuBody: string; setFuBody: (v: string) => void;
  fuSchedule: string; setFuSchedule: (v: string) => void;
  fuSubmitting: boolean;
  sendFollowUp: () => void;
  goBack: () => void;
}

export function FollowUpView(p: Props) {
  const { C } = p;
  const filtered = p.fuRecs.filter(r =>
    r.email.includes(p.fuSearch) || r.name.toLowerCase().includes(p.fuSearch.toLowerCase())
  );
  return (
    <div>
      <button onClick={p.goBack} className="gbtn" style={{ ...p.btnGhost, padding: '6px 14px', fontSize: 12, marginBottom: 22 }}>← Back</button>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 5, letterSpacing: '-0.015em' }}>
        Follow Up
        <span style={{ fontWeight: 400, color: C.muted, marginLeft: 10 }}>{p.fuCampaign.name}</span>
      </h2>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
        Uncheck anyone who replied — we'll only follow up the rest.
      </p>
      <div style={{ ...p.glassCard, padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...p.inp, flex: 1, minWidth: 160 }} placeholder="Search…" value={p.fuSearch} onChange={e => p.setFuSearch(e.target.value)} />
          <span style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: C.muted, background: p.d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
            {p.fuRecs.filter(r => r.selected).length} / {p.fuRecs.length}
          </span>
          <button onClick={() => p.setFuRecs(p.fuRecs.map(x => ({ ...x, selected: false })))} className="gbtn" style={{ ...p.btnGhost, fontSize: 11, padding: '6px 12px' }}>None</button>
          <button onClick={() => p.setFuRecs(p.fuRecs.map(x => ({ ...x, selected: true })))} className="gbtn" style={{ ...p.btn, fontSize: 11, padding: '6px 12px' }}>All</button>
        </div>
        <div style={{ maxHeight: 230, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          {filtered.map(r => (
            <div key={r.id}
              onClick={() => p.setFuRecs(p.fuRecs.map(x => x.id === r.id ? { ...x, selected: !x.selected } : x))}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: r.selected ? 'transparent' : p.d ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.025)', transition: 'background 0.15s' }}
              className="grow">
              <input type="checkbox" checked={r.selected} onChange={() => {}} onClick={e => e.stopPropagation()} style={{ accentColor: C.accent, width: 14, height: 14 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontFamily: 'DM Mono,monospace', color: C.text }}>{r.email}</div>
                {r.name && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{r.name}</div>}
              </div>
              {!r.selected && <span style={{ fontSize: 9, color: '#fca5a5', fontFamily: 'DM Mono,monospace', fontWeight: 700, letterSpacing: '0.1em' }}>SKIP</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...p.glassCard, padding: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Compose Follow-Up</h3>
        <div style={{ marginBottom: 12 }}><label style={p.lbl}>Subject</label><input style={p.inp} value={p.fuSubject} onChange={e => p.setFuSubject(e.target.value)} /></div>
        <div style={{ marginBottom: 12 }}><label style={p.lbl}>Body</label><textarea style={{ ...p.inp, height: 120, resize: 'vertical' }} value={p.fuBody} onChange={e => p.setFuBody(e.target.value)} /></div>
        <div style={{ marginBottom: 20 }}><label style={p.lbl}>Schedule At</label><input type="datetime-local" style={p.inp} value={p.fuSchedule} onChange={e => p.setFuSchedule(e.target.value)} /></div>
        <button style={{ ...p.btn, background: p.fuSubmitting ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,${C.purple},#7c3aed)`, boxShadow: p.fuSubmitting ? 'none' : '0 2px 14px rgba(139,92,246,0.4)' }}
          disabled={p.fuSubmitting} onClick={p.sendFollowUp} className="gbtn">
          {p.fuSubmitting ? 'Scheduling…' : `↑ Follow Up ${p.fuRecs.filter(r => r.selected).length} people`}
        </button>
      </div>
    </div>
  );
}
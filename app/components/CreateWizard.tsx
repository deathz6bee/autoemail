import { useRef } from 'react';
import { Recipient, Variant, SenderAccount, SenderSplit, Theme, TAGS } from './types';

interface Props {
  C: Theme;
  d: boolean;
  glassCard: React.CSSProperties;
  lbl: React.CSSProperties;
  inp: React.CSSProperties;
  btn: React.CSSProperties;
  btnGhost: React.CSSProperties;
  step: number; setStep: (n: number) => void;
  error: string; setError: (v: string) => void;
  name: string; setName: (v: string) => void;
  fromName: string; setFromName: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  recipients: Recipient[];
  safeFilter: boolean; setSafeFilter: (v: boolean) => void;
  filteredCount: number;
  csvError: string;
  handleCSV: (file: File) => void;
  variants: Variant[];
  activeVariant: number; setActiveVariant: (n: number) => void;
  abEnabled: boolean; setAbEnabled: (v: boolean) => void;
  updateVariant: (idx: number, field: 'subject' | 'body', val: string) => void;
  scheduledAt: string; setScheduledAt: (v: string) => void;
  windowStart: string; setWindowStart: (v: string) => void;
  windowEnd: string; setWindowEnd: (v: string) => void;
  dailyLimit: number; setDailyLimit: (n: number) => void;
  senderAccounts: SenderAccount[];
  senderSplits: SenderSplit[];
  setSenderSplits: (s: SenderSplit[]) => void;
  initSplits: (accounts: SenderAccount[]) => void;
  updateSplit: (email: string, pct: number) => void;
  submitting: boolean;
  handleSubmit: () => void;
  preview: (text: string, r?: Recipient) => string;
  toast: (msg: string, ok?: boolean) => void;
  templates: { id: string; name: string; subject: string; body: string }[];
  showTemplates: boolean; setShowTemplates: (v: boolean) => void;
  saveTemplate: () => void;
  loadTemplate: (t: { subject: string; body: string }) => void;
  deleteTemplate: (id: string) => void;
  saveDraftToStorage: () => void;
  loadDraftFromStorage: () => void;
  campaigns: { name: string }[];
}

export function CreateWizard(p: Props) {
  const { C, d } = p;
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    const ta = bodyRef.current; if (!ta) return;
    const s = ta.selectionStart, e2 = ta.selectionEnd;
    p.updateVariant(p.activeVariant, 'body',
      p.variants[p.activeVariant].body.slice(0, s) + tag + p.variants[p.activeVariant].body.slice(e2));
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + tag.length; ta.focus(); }, 0);
  };

  return (
    <div>
      {/* STEPPER */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
        {['Details', 'Recipients', 'Compose', 'Schedule'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: i + 1 < p.step ? 'pointer' : 'default' }}
              onClick={() => i + 1 < p.step && p.setStep(i + 1)}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, fontFamily: 'DM Mono,monospace',
                transition: 'all 0.25s',
                background: p.step === i + 1
                  ? 'linear-gradient(135deg,#3b8fff,#1a4fd6)'
                  : p.step > i + 1
                    ? 'linear-gradient(135deg,#10b981,#059669)'
                    : d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
                color: p.step >= i + 1 ? '#fff' : C.muted,
                boxShadow: p.step === i + 1
                  ? '0 0 16px rgba(43,127,255,0.5)'
                  : p.step > i + 1 ? '0 0 10px rgba(16,185,129,0.4)' : undefined,
              }}>
                {p.step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 12, fontWeight: p.step === i + 1 ? 600 : 400,
                color: p.step === i + 1 ? C.accent : p.step > i + 1 ? C.green : C.muted,
                letterSpacing: '0.01em',
              }}>{s}</span>
            </div>
            {i < 3 && (
              <div style={{
                width: 32, height: 1, margin: '0 10px',
                background: p.step > i + 1
                  ? 'linear-gradient(90deg,#10b981,#059669)'
                  : `linear-gradient(90deg,${C.border2},${C.border})`,
                transition: 'background 0.4s',
              }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ ...p.glassCard, padding: 30 }}>
        {p.error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13, boxShadow: '0 0 16px rgba(239,68,68,0.1)' }}>
            {p.error}
          </div>
        )}

        {/* STEP 1 */}
        {p.step === 1 && (
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 22, letterSpacing: '-0.01em' }}>Campaign Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label style={p.lbl}>Campaign Name</label><input style={p.inp} placeholder="SEO Outreach Q1" value={p.name} onChange={e => p.setName(e.target.value)} /></div>
              <div><label style={p.lbl}>From Name</label><input style={p.inp} placeholder="Aftab from DigiXFlyy" value={p.fromName} onChange={e => p.setFromName(e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={p.lbl}>Internal Notes <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', opacity: 0.6 }}>(optional)</span></label>
              <textarea style={{ ...p.inp, height: 72, resize: 'vertical' }} placeholder="e.g. Fitness leads from Google Maps" value={p.notes} onChange={e => p.setNotes(e.target.value)} />
            </div>
            <button style={p.btn} className="gbtn" onClick={() => { if (!p.name || !p.fromName) { p.setError('Fill both fields'); return; } p.setError(''); p.setStep(2); }}>Continue →</button>
          </div>
        )}

        {/* STEP 2 */}
        {p.step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Upload Recipients</h3>
              <button className="gbtn" onClick={() => {
                const h = 'email,name,first_name,city,state,phone,website,rating,is_safe_to_send';
                const ex = 'john@example.com,John Smith,John,New York,NY,+1234567890,example.com,4.5,true';
                const blob = new Blob([h + '\n' + ex], { type: 'text/csv' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'recipients_template.csv'; a.click();
              }} style={{ ...p.btnGhost, fontSize: 11, padding: '5px 12px' }}>↓ Template</button>
            </div>
            <p style={{ fontSize: 11, color: C.muted, marginBottom: 14, fontFamily: 'DM Mono,monospace', lineHeight: 1.7, opacity: 0.8 }}>
              email · name · first_name · city · state · phone · website · rating · is_safe_to_send
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16, cursor: 'pointer', fontSize: 12, color: C.muted }}>
              <input type="checkbox" checked={p.safeFilter} onChange={e => p.setSafeFilter(e.target.checked)} style={{ accentColor: C.accent, width: 14, height: 14 }} />
              Filter unsafe contacts <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, opacity: 0.7, marginLeft: 4 }}>(is_safe_to_send = false)</span>
            </label>
            {p.csvError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>{p.csvError}</div>}
            <label style={{ display: 'block', border: `1px dashed ${C.border2}`, borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer', marginBottom: 16, background: d ? 'rgba(43,127,255,0.02)' : 'rgba(43,127,255,0.01)', transition: 'all 0.2s' }}>
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && p.handleCSV(e.target.files[0])} />
              <div style={{ fontSize: 22, marginBottom: 9, opacity: 0.3 }}>↑</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.muted }}>Click to upload CSV</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, opacity: 0.55 }}>or drag and drop</div>
            </label>
            {p.recipients.length > 0 && (
              <>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 16px', fontSize: 12, color: '#6ee7b7', marginBottom: 12, fontWeight: 600, boxShadow: '0 0 16px rgba(16,185,129,0.08)' }}>
                  ✓ {p.recipients.length} recipients loaded{p.filteredCount > 0 && ` · ${p.filteredCount} filtered out`}
                </div>
                <div style={{ maxHeight: 130, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: d ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.03)' }}>
                      {['Email', 'Name', 'City', 'Safe'].map(h => <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{p.recipients.slice(0, 4).map((r, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }} className="grow">
                        <td style={{ padding: '7px 12px', fontFamily: 'DM Mono,monospace', fontSize: 11, color: C.text }}>{r.email}</td>
                        <td style={{ padding: '7px 12px', color: C.muted }}>{r.first_name || r.name || r.business_name || '—'}</td>
                        <td style={{ padding: '7px 12px', color: C.muted }}>{r.city || '—'}</td>
                        <td style={{ padding: '7px 12px', color: r.is_safe_to_send === 'true' || r.is_safe_to_send === '1' ? '#6ee7b7' : C.muted, fontFamily: 'DM Mono,monospace' }}>
                          {r.is_safe_to_send === 'true' || r.is_safe_to_send === '1' ? '✓' : '—'}
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                  {p.recipients.length > 4 && <div style={{ padding: '6px 12px', fontSize: 11, color: C.muted, fontFamily: 'DM Mono,monospace', opacity: 0.7 }}>+{p.recipients.length - 4} more</div>}
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button style={p.btnGhost} className="gbtn" onClick={() => p.setStep(1)}>← Back</button>
              <button style={p.btn} className="gbtn" onClick={() => { if (!p.recipients.length) { p.setError('Upload CSV first'); return; } p.setError(''); p.setStep(3); }}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {p.step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Compose Email</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>A/B Test</span>
                <div onClick={() => p.setAbEnabled(!p.abEnabled)}
                  style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: p.abEnabled ? 'linear-gradient(135deg,#3b8fff,#1a4fd6)' : d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)', position: 'relative', transition: 'all 0.2s', boxShadow: p.abEnabled ? '0 0 10px rgba(43,127,255,0.4)' : undefined }}>
                  <div style={{ position: 'absolute', top: 2, left: p.abEnabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
                </div>
              </div>
            </div>
            {/* TEMPLATE PANEL */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              <button onClick={() => p.setShowTemplates(!p.showTemplates)} className="gbtn" style={{ ...p.btnGhost, fontSize: 11, padding: '5px 12px', color: p.showTemplates ? C.accent : C.muted }}>
                📄 Templates {p.templates.length > 0 && `(${p.templates.length})`}
              </button>
              <button onClick={p.saveTemplate} className="gbtn" style={{ ...p.btnGhost, fontSize: 11, padding: '5px 12px' }}>Save as Template</button>
              <button onClick={p.saveDraftToStorage} className="gbtn" style={{ ...p.btnGhost, fontSize: 11, padding: '5px 12px' }}>💾 Save Draft</button>
              <button onClick={p.loadDraftFromStorage} className="gbtn" style={{ ...p.btnGhost, fontSize: 11, padding: '5px 12px', color: '#fcd34d', borderColor: 'rgba(245,158,11,0.3)' }}>Load Draft</button>
            </div>
            {p.showTemplates && p.templates.length > 0 && (
              <div style={{ ...p.glassCard, padding: 12, marginBottom: 14 }}>
                {p.templates.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: `1px solid ${C.border}`, gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Mono,monospace', marginTop: 2, opacity: 0.8 }}>{t.subject.slice(0, 50)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => p.loadTemplate(t)} className="gbtn" style={{ ...p.btn, fontSize: 10, padding: '4px 10px' }}>Load</button>
                      <button onClick={() => p.deleteTemplate(t.id)} className="gbtn" style={{ ...p.btnGhost, fontSize: 10, padding: '4px 8px', color: '#fca5a5' }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {p.abEnabled && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {[0, 1].map(i => (
                  <button key={i} onClick={() => p.setActiveVariant(i)} className="gbtn"
                    style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${p.activeVariant === i ? 'rgba(43,127,255,0.5)' : C.border2}`, background: p.activeVariant === i ? d ? 'rgba(43,127,255,0.14)' : 'rgba(43,127,255,0.09)' : 'transparent', color: p.activeVariant === i ? C.accent : C.muted, boxShadow: p.activeVariant === i ? '0 0 12px rgba(43,127,255,0.15)' : undefined }}>
                    Variant {String.fromCharCode(65 + i)}
                    <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.5, fontFamily: 'DM Mono,monospace' }}>50%</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                <label style={{ ...p.lbl, marginBottom: 0 }}>Subject Line</label>
                <span style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: p.variants[p.activeVariant].subject.length > 60 ? C.red : C.muted, opacity: 0.8 }}>
                  {p.variants[p.activeVariant].subject.length}/60
                </span>
              </div>
              <input style={p.inp} placeholder="Quick question for {{name}}" value={p.variants[p.activeVariant].subject} onChange={e => p.updateVariant(p.activeVariant, 'subject', e.target.value)} />
              {p.variants[p.activeVariant].subject.length > 60 && <div style={{ fontSize: 11, color: C.red, marginTop: 4, fontFamily: 'DM Mono,monospace' }}>Subject may be truncated by email clients</div>}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={p.lbl}>Insert Tag</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TAGS.map(t => (
                  <button key={t} onClick={() => insertTag(t)} className="tag-btn gbtn"
                    style={{ fontSize: 10, padding: '4px 9px', borderRadius: 6, cursor: 'pointer', fontFamily: 'DM Mono,monospace', border: `1px solid ${C.border2}`, background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: C.muted2, transition: 'all 0.15s' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'DM Mono,monospace', marginBottom: 6, opacity: 0.75 }}>
              Spintax: <span style={{ color: '#c4b5fd' }}>{'{Hi|Hello|Hey}'} {'{{first_name}}'}</span> — randomizes per recipient
            </div>
            <textarea ref={bodyRef} style={{ ...p.inp, height: 188, resize: 'vertical', marginTop: 10, marginBottom: 14 }}
              placeholder={'Hi {{first_name}},\n\nI came across {{name}} in {{city}}...'}
              value={p.variants[p.activeVariant].body} onChange={e => p.updateVariant(p.activeVariant, 'body', e.target.value)} />
            {p.recipients.length > 0 && p.variants[p.activeVariant].subject && (
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16, background: d ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.015)', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 10, fontFamily: 'DM Mono,monospace', opacity: 0.8 }}>
                  PREVIEW — {p.recipients[0].email}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 9, color: C.text }}>
                  {p.preview(p.variants[p.activeVariant].subject, p.recipients[0])}
                </div>
                <div style={{ fontSize: 12, color: C.muted, whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                  {p.preview(p.variants[p.activeVariant].body, p.recipients[0])}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={p.btnGhost} className="gbtn" onClick={() => p.setStep(2)}>← Back</button>
              <button style={p.btn} className="gbtn" onClick={() => { if (!p.variants[0].subject || !p.variants[0].body) { p.setError('Fill subject and body'); return; } p.setError(''); p.setStep(4); }}>Continue →</button>
              <button className="gbtn" onClick={() => { navigator.clipboard.writeText(p.variants[p.activeVariant].subject); p.toast('Subject copied'); }} style={{ ...p.btnGhost, fontSize: 11, padding: '6px 12px', marginLeft: 'auto' }}>Copy Subject</button>
              <button className="gbtn" onClick={() => { navigator.clipboard.writeText(p.variants[p.activeVariant].body); p.toast('Body copied'); }} style={{ ...p.btnGhost, fontSize: 11, padding: '6px 12px' }}>Copy Body</button>
              <button className="gbtn" onClick={() => { if (confirm('Clear subject and body?')) { p.updateVariant(p.activeVariant, 'subject', ''); p.updateVariant(p.activeVariant, 'body', ''); } }} style={{ ...p.btnGhost, fontSize: 11, padding: '6px 12px', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}>Clear</button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {p.step === 4 && (() => {
          const [sh, sm] = p.windowStart.split(':').map(Number);
          const [eh, em] = p.windowEnd.split(':').map(Number);
          const startMin = sh * 60 + sm, endMin = eh * 60 + em;
          const windowMins = endMin > startMin ? endMin - startMin : (24 * 60 - startMin) + endMin;
          const maxEmails = Math.floor(windowMins / 5);
          const cappedLimit = Math.min(p.dailyLimit, maxEmails);
          const gap = Math.max(5, Math.floor(windowMins / cappedLimit));
          const daysToComplete = Math.ceil(p.recipients.length / cappedLimit);
          return (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 22, letterSpacing: '-0.01em' }}>Schedule</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={p.lbl}>Start Sending At <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', opacity: 0.6 }}>(local time)</span></label>
                <input type="datetime-local" style={p.inp} value={p.scheduledAt} onChange={e => p.setScheduledAt(e.target.value)} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={p.lbl}>Daily Send Window (IST)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 7 }}>
                  <div><label style={{ ...p.lbl, opacity: 0.65 }}>Start</label><input type="time" style={p.inp} value={p.windowStart} onChange={e => p.setWindowStart(e.target.value)} /></div>
                  <div><label style={{ ...p.lbl, opacity: 0.65 }}>End</label><input type="time" style={p.inp} value={p.windowEnd} onChange={e => p.setWindowEnd(e.target.value)} /></div>
                </div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Mono,monospace', opacity: 0.75 }}>
                  e.g. 20:00–01:00 IST = US daytime · overnight windows work automatically
                </div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.09)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '9px 14px', fontSize: 11, color: '#6ee7b7', marginBottom: 18, fontFamily: 'DM Mono,monospace', boxShadow: '0 0 16px rgba(16,185,129,0.06)' }}>
                ✓ {windowMins}min window · max {maxEmails} emails/day at 5min intervals
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={p.lbl}>
                  Emails Per Day
                  <span style={{ fontFamily: 'DM Mono,monospace', fontWeight: 500, textTransform: 'none', marginLeft: 8, color: '#93c5fd', fontSize: 13 }}>
                    {cappedLimit}{p.dailyLimit > maxEmails ? ' (capped)' : ''}
                  </span>
                </label>
                <input type="range" min={5} max={maxEmails} step={5} style={{ width: '100%', marginTop: 8, height: 4 }} value={cappedLimit} onChange={e => p.setDailyLimit(Number(e.target.value))} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginTop: 5, fontFamily: 'DM Mono,monospace', opacity: 0.7 }}>
                  <span>5</span><span>{Math.floor(maxEmails / 2)}</span><span>{maxEmails}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 10, fontFamily: 'DM Mono,monospace', opacity: 0.8 }}>
                  1 email every {gap} min within window
                </div>
              </div>

              {/* SENDER SPLIT */}
              {p.senderAccounts.filter(a => a.is_active).length > 0 && (
                <div style={{ background: d ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c4b5fd', fontFamily: 'DM Mono,monospace' }}>SENDER SPLIT</div>
                    <button onClick={() => p.initSplits(p.senderAccounts)} className="gbtn" style={{ ...p.btnGhost, fontSize: 10, padding: '3px 8px', color: '#c4b5fd', borderColor: 'rgba(139,92,246,0.3)' }}>Reset Equal</button>
                  </div>
                  {p.senderSplits.length === 0 && (
                    <button onClick={() => p.initSplits(p.senderAccounts)} className="gbtn"
                      style={{ ...p.btn, fontSize: 11, padding: '6px 14px', width: '100%', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', boxShadow: '0 2px 10px rgba(139,92,246,0.3)' }}>
                      Configure Splits ({p.senderAccounts.filter(a => a.is_active).length} accounts)
                    </button>
                  )}
                  {p.senderSplits.length > 0 && (
                    <>
                      {p.senderSplits.map(split => (
                        <div key={split.email} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{split.email}</span>
                            <span style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: '#c4b5fd', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                              {split.pct}% ({Math.round(p.recipients.length * split.pct / 100)} recip.)
                            </span>
                          </div>
                          <input type="range" min={0} max={100} step={5} style={{ width: '100%', accentColor: '#8b5cf6' }} value={split.pct} onChange={e => p.updateSplit(split.email, Number(e.target.value))} />
                        </div>
                      ))}
                      {(() => { const total = p.senderSplits.reduce((s, x) => s + x.pct, 0); return total !== 100 && (
                        <div style={{ fontSize: 11, color: '#fca5a5', fontFamily: 'DM Mono,monospace', marginTop: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '5px 10px' }}>
                          ⚠ Total is {total}% — must equal 100%
                        </div>
                      ); })()}
                      {p.senderSplits.reduce((s, x) => s + x.pct, 0) === 100 && (
                        <div style={{ fontSize: 11, color: '#6ee7b7', fontFamily: 'DM Mono,monospace', marginTop: 6 }}>✓ Split adds up to 100%</div>
                      )}
                      <button onClick={() => p.setSenderSplits([])} className="gbtn" style={{ ...p.btnGhost, fontSize: 10, padding: '3px 8px', marginTop: 8, color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}>Remove Split</button>
                    </>
                  )}
                </div>
              )}

              {/* SUMMARY */}
              <div style={{ background: d ? 'rgba(43,127,255,0.06)' : 'rgba(43,127,255,0.035)', border: '1px solid rgba(43,127,255,0.2)', borderRadius: 12, padding: 18, marginBottom: 24, boxShadow: '0 0 24px rgba(43,127,255,0.07)', backdropFilter: 'blur(12px)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#93c5fd', marginBottom: 14, fontFamily: 'DM Mono,monospace' }}>SEND SUMMARY</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {[
                    ['Recipients', `${p.recipients.length}`],
                    ['Daily limit', `${cappedLimit} emails`],
                    ['Interval', `${gap} min`],
                    ['Est. duration', `~${daysToComplete} day${daysToComplete !== 1 ? 's' : ''}`],
                    ['Window', `${p.windowStart}–${p.windowEnd} IST`],
                    ['Starts', p.scheduledAt
                      ? new Date(p.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' IST'
                      : 'Not set'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '7px 0', borderBottom: `1px solid ${C.border}`, gap: 8 }}>
                      <span style={{ color: C.muted }}>{k}</span>
                      <span style={{ fontFamily: 'DM Mono,monospace', color: C.text, fontWeight: 500, textAlign: 'right' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button style={p.btnGhost} className="gbtn" onClick={() => p.setStep(3)}>← Back</button>
                <button style={{ ...p.btn, background: p.submitting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#10b981,#059669)', boxShadow: p.submitting ? 'none' : '0 2px 16px rgba(16,185,129,0.4)' }} disabled={p.submitting} onClick={p.handleSubmit} className="gbtn">
                  {p.submitting ? 'Scheduling…' : '↑ Schedule Campaign'}
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
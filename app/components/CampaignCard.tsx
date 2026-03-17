'use client';
import { Campaign, Theme } from './types';
import { StatusBadge } from './shared/StatusBadge';
import { ProgressBar } from './shared/ProgressBar';
import { Panel } from './shared/Panel';

interface Props {
  c: Campaign;
  C: Theme;
  d: boolean;
  glassCard: React.CSSProperties;
  lbl: React.CSSProperties;
  inp: React.CSSProperties;
  btn: React.CSSProperties;
  btnGhost: React.CSSProperties;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  tags: Record<string, string[]>;
  tagInput: Record<string, string>;
  setTagInput: (t: Record<string, string>) => void;
  addTag: (campaignId: string, tag: string) => void;
  removeTag: (campaignId: string, tag: string) => void;
  editingNoteId: string | null;
  setEditingNoteId: (id: string | null) => void;
  editingNoteVal: string;
  setEditingNoteVal: (v: string) => void;
  saveNote: (id: string) => void;
  archivedIds: string[];
  archiveCampaign: (id: string) => void;
  unarchiveCampaign: (id: string) => void;
  deleteCampaign: (id: string, name: string) => void;
  pauseResume: (c: Campaign) => void;
  openFollowUp: (c: Campaign) => void;
  sendNow: (c: Campaign) => void;
  exportSentCSV: (c: Campaign) => void;
  editingId: string | null;
  openEdit: (c: any) => void;
  editSubject: string; setEditSubject: (v: string) => void;
  editBody: string; setEditBody: (v: string) => void;
  editFromName: string; setEditFromName: (v: string) => void;
  editScheduledAt: string; setEditScheduledAt: (v: string) => void;
  editSaving: boolean;
  saveEdit: () => void;
  setEditingId: (id: string | null) => void;
  dupSource: Campaign | null;
  openDuplicate: (c: Campaign) => void;
  dupName: string; setDupName: (v: string) => void;
  dupSubject: string; setDupSubject: (v: string) => void;
  dupBody: string; setDupBody: (v: string) => void;
  dupFromName: string; setDupFromName: (v: string) => void;
  dupScheduledAt: string; setDupScheduledAt: (v: string) => void;
  dupSaving: boolean;
  saveDuplicate: () => void;
  setDupSource: (c: Campaign | null) => void;
  openSent: string | null;
  fetchSent: (id: string) => void;
  sentMap: Record<string, any[]>;
  openErrors: string | null;
  fetchFailed: (id: string) => void;
  failedMap: Record<string, any[]>;
  requeueFailed: (id: string) => void;
  requeueing: string | null;
  openRecipients: string | null;
  fetchAllRecipients: (id: string) => void;
  recipientsMap: Record<string, any[]>;
  recipStatusFilter: Record<string, string>;
  setRecipStatusFilter: (f: Record<string, string>) => void;
  continueDraft?: (c: Campaign) => void;
}

export function CampaignCard(p: Props) {
  const { c, C, d } = p;

  const actionBtn = (label: string, color: string, bg: string, border: string, onClick: () => void, active = false) => (
    <button onClick={onClick} className="gbtn"
      style={{
        fontSize: 11, padding: '4px 10px', borderRadius: 7, border: `1px solid ${active ? border : d ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
        background: active ? bg : 'transparent',
        color: active ? color : C.muted,
        cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
        whiteSpace: 'nowrap' as const,
      }}>
      {label}
    </button>
  );

  return (
    <div style={{
      background: d ? 'rgba(13,20,40,0.6)' : '#ffffff',
      border: d ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
      borderRadius: 14,
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
      boxShadow: d ? '0 2px 16px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'all 0.2s',
    }} className="gcard">

      {/* STATUS STRIPE */}
      <div style={{
        height: 3,
        background: c.status === 'done' ? 'linear-gradient(90deg,#10b981,#059669)'
          : c.status === 'in_progress' || c.status === 'sending' ? 'linear-gradient(90deg,#f59e0b,#d97706)'
          : c.status === 'failed' ? 'linear-gradient(90deg,#ef4444,#dc2626)'
          : c.status === 'paused' ? 'linear-gradient(90deg,#8b5cf6,#7c3aed)'
          : 'linear-gradient(90deg,#3b82f6,#1d4ed8)',
      }} />

      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* CHECKBOX */}
          <input type="checkbox" checked={p.selectedIds.includes(c.id)}
            onChange={e => p.setSelectedIds(e.target.checked ? [...p.selectedIds, c.id] : p.selectedIds.filter(x => x !== c.id))}
            onClick={e => e.stopPropagation()}
            style={{ accentColor: C.accent, width: 14, height: 14, marginTop: 3, flexShrink: 0 }} />

          {/* MAIN CONTENT */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: C.text, letterSpacing: '-0.01em' }}>{c.name}</span>
              <StatusBadge status={c.status} />
              {(c as any).failed_count > 0 && (
                <span style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', fontWeight: 700, color: '#ef4444', background: d ? 'rgba(239,68,68,0.15)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.3)', padding: '1px 6px', borderRadius: 4 }}>
                  {(c as any).failed_count} failed
                </span>
              )}
            </div>

            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 480 }}>
              {c.subject}
            </div>

            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ background: d ? 'rgba(255,255,255,0.05)' : '#f1f5f9', padding: '2px 8px', borderRadius: 5, border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0', fontFamily: 'DM Mono,monospace', fontSize: 10 }}>
                {c.recipients?.[0]?.count ?? 0} recipients
              </span>
              <span>
                {new Date(c.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} IST
              </span>
              {(c as any).from_name && <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, opacity: 0.6 }}>from: {(c as any).from_name}</span>}
              {c.status === 'in_progress' && c.total_count && c.sent_count !== undefined && (() => {
                const remaining = (c.total_count || 0) - (c.sent_count || 0);
                return remaining > 0 ? <span style={{ color: C.amber, fontWeight: 600 }}>~{remaining} left</span> : null;
              })()}
              {c.notes && (
                <span style={{ fontStyle: 'italic', opacity: 0.7, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onDoubleClick={e => { e.stopPropagation(); p.setEditingNoteId(c.id); p.setEditingNoteVal(c.notes || ''); }}>
                  {p.editingNoteId === c.id
                    ? <input autoFocus value={p.editingNoteVal} onChange={e => p.setEditingNoteVal(e.target.value)}
                        onBlur={() => p.saveNote(c.id)} onKeyDown={e => e.key === 'Enter' && p.saveNote(c.id)}
                        style={{ ...p.inp, display: 'inline', width: 160, padding: '1px 6px', fontSize: 11 }}
                        onClick={e => e.stopPropagation()} />
                    : `📝 ${c.notes}`}
                </span>
              )}
            </div>

            {/* TAGS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, alignItems: 'center' }}>
              {(p.tags[c.id] || []).map(tag => (
                <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: d ? 'rgba(139,92,246,0.12)' : '#f5f3ff', border: d ? '1px solid rgba(139,92,246,0.25)' : '1px solid #ddd6fe', color: '#8b5cf6', fontFamily: 'DM Mono,monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {tag}
                  <span onClick={() => p.removeTag(c.id, tag)} style={{ cursor: 'pointer', opacity: 0.5, fontSize: 12 }}>×</span>
                </span>
              ))}
              <input value={p.tagInput[c.id] || ''} onChange={e => p.setTagInput({ ...p.tagInput, [c.id]: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && p.addTag(c.id, p.tagInput[c.id] || '')}
                placeholder="+ tag"
                style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, border: `1px solid ${d ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, background: 'transparent', color: C.muted, width: 50, outline: 'none', fontFamily: 'DM Mono,monospace' }} />
            </div>

            <ProgressBar c={c} C={C} />
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 320 }}>
            {c.status === 'draft' && p.continueDraft && actionBtn('✎ Continue', C.accent, d ? 'rgba(43,127,255,0.12)' : '#eff6ff', 'rgba(43,127,255,0.4)', () => p.continueDraft!(c), true)}
            {c.status === 'done' && actionBtn('Follow Up', '#8b5cf6', d ? 'rgba(139,92,246,0.12)' : '#f5f3ff', 'rgba(139,92,246,0.3)', () => p.openFollowUp(c))}
            {c.status === 'scheduled' && actionBtn('▶ Now', '#f59e0b', d ? 'rgba(245,158,11,0.1)' : '#fffbeb', 'rgba(245,158,11,0.3)', () => p.sendNow(c))}
            {c.status === 'scheduled' && actionBtn('Edit', '#10b981', d ? 'rgba(16,185,129,0.1)' : '#ecfdf5', 'rgba(16,185,129,0.3)', () => p.openEdit(c))}
            {['scheduled', 'in_progress', 'paused'].includes(c.status) && actionBtn(
              c.status === 'paused' ? '▶ Resume' : '⏸ Pause',
              c.status === 'paused' ? '#10b981' : '#f59e0b',
              c.status === 'paused' ? (d ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (d ? 'rgba(245,158,11,0.1)' : '#fffbeb'),
              c.status === 'paused' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
              () => p.pauseResume(c)
            )}
            {actionBtn('Errors', '#ef4444', d ? 'rgba(239,68,68,0.1)' : '#fef2f2', 'rgba(239,68,68,0.3)', () => p.fetchFailed(c.id), p.openErrors === c.id)}
            {actionBtn('Clone', C.accent, d ? 'rgba(43,127,255,0.1)' : '#eff6ff', 'rgba(43,127,255,0.3)', () => p.openDuplicate(c))}
            {actionBtn('Recipients', '#8b5cf6', d ? 'rgba(139,92,246,0.1)' : '#f5f3ff', 'rgba(139,92,246,0.3)', () => p.fetchAllRecipients(c.id), p.openRecipients === c.id)}
            {actionBtn('Sent', C.accent, d ? 'rgba(43,127,255,0.1)' : '#eff6ff', 'rgba(43,127,255,0.3)', () => p.fetchSent(c.id), p.openSent === c.id)}
            {actionBtn('↓ CSV', C.muted, 'transparent', 'transparent', () => p.exportSentCSV(c))}
            {!p.archivedIds.includes(c.id)
              ? actionBtn('Archive', C.muted, 'transparent', 'transparent', () => p.archiveCampaign(c.id))
              : actionBtn('Unarchive', '#10b981', 'transparent', 'transparent', () => p.unarchiveCampaign(c.id))}
            <button onClick={() => p.deleteCampaign(c.id, c.name)} className="gbtn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.muted, padding: '2px 6px', lineHeight: 1, opacity: 0.35, transition: 'opacity 0.15s' }}>×</button>
          </div>
        </div>
      </div>

      {/* EDIT PANEL */}
      {p.editingId === c.id && (
        <Panel title="Edit Campaign" accent={C.green} tint={d ? 'rgba(16,185,129,0.04)' : 'rgba(16,185,129,0.02)'} C={C}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={p.lbl}>From Name</label><input style={p.inp} value={p.editFromName} onChange={e => p.setEditFromName(e.target.value)} /></div>
            <div><label style={p.lbl}>Schedule Time</label><input type="datetime-local" style={p.inp} value={p.editScheduledAt} onChange={e => p.setEditScheduledAt(e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={p.lbl}>Subject</label><input style={p.inp} value={p.editSubject} onChange={e => p.setEditSubject(e.target.value)} /></div>
          <div style={{ marginBottom: 16 }}><label style={p.lbl}>Body</label><textarea style={{ ...p.inp, height: 110, resize: 'vertical' }} value={p.editBody} onChange={e => p.setEditBody(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...p.btn, background: p.editSaving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 2px 12px rgba(16,185,129,0.3)', padding: '8px 18px', fontSize: 12 }} disabled={p.editSaving} onClick={p.saveEdit} className="gbtn">{p.editSaving ? 'Saving…' : 'Save Changes'}</button>
            <button style={{ ...p.btnGhost, padding: '8px 14px', fontSize: 12 }} onClick={() => p.setEditingId(null)} className="gbtn">Cancel</button>
          </div>
        </Panel>
      )}

      {/* CLONE PANEL */}
      {p.dupSource?.id === c.id && (
        <Panel title="Clone Campaign" accent={C.cyan} tint={d ? 'rgba(14,165,233,0.04)' : 'rgba(14,165,233,0.02)'} C={C}>
          <div style={{ marginBottom: 12 }}><label style={p.lbl}>Campaign Name</label><input style={p.inp} value={p.dupName} onChange={e => p.setDupName(e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={p.lbl}>From Name</label><input style={p.inp} value={p.dupFromName} onChange={e => p.setDupFromName(e.target.value)} /></div>
            <div><label style={p.lbl}>Schedule Time</label><input type="datetime-local" style={p.inp} value={p.dupScheduledAt} onChange={e => p.setDupScheduledAt(e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={p.lbl}>Subject</label><input style={p.inp} value={p.dupSubject} onChange={e => p.setDupSubject(e.target.value)} /></div>
          <div style={{ marginBottom: 16 }}><label style={p.lbl}>Body</label><textarea style={{ ...p.inp, height: 110, resize: 'vertical' }} value={p.dupBody} onChange={e => p.setDupBody(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...p.btn, background: p.dupSaving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,${C.cyan},#0284c7)`, boxShadow: `0 2px 12px rgba(14,165,233,0.3)`, padding: '8px 18px', fontSize: 12 }} disabled={p.dupSaving} onClick={p.saveDuplicate} className="gbtn">{p.dupSaving ? 'Creating…' : 'Create Clone'}</button>
            <button style={{ ...p.btnGhost, padding: '8px 14px', fontSize: 12 }} onClick={() => p.setDupSource(null)} className="gbtn">Cancel</button>
          </div>
        </Panel>
      )}

      {/* SENT PANEL */}
      {p.openSent === c.id && (
        <Panel title={`Sent Recipients${p.sentMap[c.id]?.length ? ` · ${p.sentMap[c.id].length}` : ''}`} accent={C.accent} tint={d ? 'rgba(43,127,255,0.04)' : 'rgba(43,127,255,0.02)'} C={C}>
          {!p.sentMap[c.id]?.length
            ? <div style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Mono,monospace' }}>No sent recipients yet.</div>
            : <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: d ? 'rgba(0,0,0,0.4)' : '#f8fafc' }}>
                    {['Email', 'Name', 'Sent At'].map(h => <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{p.sentMap[c.id].map((r: any, i: number) => (
                    <tr key={i} style={{ borderTop: `1px solid ${C.border}` }} className="grow">
                      <td style={{ padding: '7px 12px', fontFamily: 'DM Mono,monospace', fontSize: 11 }}>{r.email}</td>
                      <td style={{ padding: '7px 12px', color: C.muted }}>{r.name || '—'}</td>
                      <td style={{ padding: '7px 12px', color: C.muted, fontFamily: 'DM Mono,monospace', fontSize: 10 }}>{r.sent_at ? new Date(r.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>}
        </Panel>
      )}

      {/* RECIPIENTS PANEL */}
      {p.openRecipients === c.id && (
        <Panel title={`All Recipients${p.recipientsMap[c.id]?.length ? ` · ${p.recipientsMap[c.id].length}` : ''}`} accent={C.purple} tint={d ? 'rgba(139,92,246,0.04)' : 'rgba(139,92,246,0.02)'} C={C}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {['all', 'pending', 'sent', 'failed'].map(s => (
              <button key={s} onClick={() => p.setRecipStatusFilter({ ...p.recipStatusFilter, [c.id]: s })} className="gbtn"
                style={{ ...p.btnGhost, fontSize: 10, padding: '3px 10px', color: (p.recipStatusFilter[c.id] || 'all') === s ? '#8b5cf6' : C.muted, borderColor: (p.recipStatusFilter[c.id] || 'all') === s ? 'rgba(139,92,246,0.4)' : C.border2, background: (p.recipStatusFilter[c.id] || 'all') === s ? (d ? 'rgba(139,92,246,0.1)' : '#f5f3ff') : 'transparent' }}>
                {s.charAt(0).toUpperCase() + s.slice(1)} ({(p.recipientsMap[c.id] || []).filter((r: any) => s === 'all' || r.status === s).length})
              </button>
            ))}
            {(p.recipientsMap[c.id] || []).some((r: any) => r.status === 'failed') && (
              <button onClick={() => p.requeueFailed(c.id)} className="gbtn" style={{ ...p.btnGhost, fontSize: 10, padding: '3px 10px', marginLeft: 'auto', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.35)', background: d ? 'rgba(245,158,11,0.08)' : '#fffbeb' }}>
                {p.requeueing === c.id ? 'Re-queuing…' : '↺ Re-queue Failed'}
              </button>
            )}
          </div>
          {!(p.recipientsMap[c.id] || []).length
            ? <div style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Mono,monospace' }}>No recipients found.</div>
            : <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: d ? 'rgba(0,0,0,0.4)' : '#f8fafc', position: 'sticky', top: 0 }}>
                    {['Email', 'Name', 'Status', 'Sent At', 'Error'].map(h => <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(p.recipientsMap[c.id] || []).filter((r: any) => (p.recipStatusFilter[c.id] || 'all') === 'all' || r.status === (p.recipStatusFilter[c.id] || 'all')).map((r: any, i: number) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }} className="grow">
                        <td style={{ padding: '7px 12px', fontFamily: 'DM Mono,monospace', fontSize: 10 }}>{r.email}</td>
                        <td style={{ padding: '7px 12px', color: C.muted, fontSize: 11 }}>{r.name || '—'}</td>
                        <td style={{ padding: '7px 12px' }}><StatusBadge status={r.status || 'pending'} /></td>
                        <td style={{ padding: '7px 12px', color: C.muted, fontFamily: 'DM Mono,monospace', fontSize: 10 }}>{r.sent_at ? new Date(r.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td style={{ padding: '7px 12px', color: '#ef4444', fontSize: 10, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.error || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </Panel>
      )}

      {/* ERRORS PANEL */}
      {p.openErrors === c.id && (
        <Panel title={`Failed Recipients${p.failedMap[c.id]?.length ? ` · ${p.failedMap[c.id].length}` : ''}`} accent={C.red} tint={d ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.02)'} C={C}>
          {p.failedMap[c.id]?.length > 0 && (
            <button onClick={() => p.requeueFailed(c.id)} className="gbtn" style={{ ...p.btnGhost, fontSize: 11, padding: '5px 12px', marginBottom: 12, color: '#f59e0b', borderColor: 'rgba(245,158,11,0.35)', background: d ? 'rgba(245,158,11,0.08)' : '#fffbeb' }}>
              {p.requeueing === c.id ? 'Re-queuing…' : '↺ Re-queue All Failed → Pending'}
            </button>
          )}
          {!p.failedMap[c.id]?.length
            ? <div style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Mono,monospace' }}>No failed recipients. ✓</div>
            : <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: d ? 'rgba(0,0,0,0.4)' : '#f8fafc' }}>
                    {['Email', 'Error Message', 'Retried'].map(h => <th key={h} style={{ padding: '8px 13px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {p.failedMap[c.id].map((r: any, i: number) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }} className="grow">
                        <td style={{ padding: '8px 13px', fontFamily: 'DM Mono,monospace', color: C.text, fontSize: 11 }}>{r.email}</td>
                        <td style={{ padding: '8px 13px', color: '#ef4444', maxWidth: 280, fontSize: 11 }}>{r.error || 'Unknown error'}</td>
                        <td style={{ padding: '8px 13px', color: C.muted, fontFamily: 'DM Mono,monospace', fontSize: 11 }}>{r.retry_attempted ? 'YES' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </Panel>
      )}
    </div>
  );
}
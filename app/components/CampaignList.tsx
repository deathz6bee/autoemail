import { Campaign, Theme } from './types';
import { CampaignCard } from './CampaignCard';

interface Props {
  campaigns: Campaign[];
  C: Theme;
  d: boolean;
  glassCard: React.CSSProperties;
  lbl: React.CSSProperties;
  inp: React.CSSProperties;
  btn: React.CSSProperties;
  btnGhost: React.CSSProperties;
  // search/filter/sort
  search: string; setSearch: (v: string) => void;
  statusFilter: string; setStatusFilter: (v: string) => void;
  sortBy: 'date' | 'name' | 'sent'; setSortBy: (v: 'date' | 'name' | 'sent') => void;
  // archive
  showArchived: boolean; setShowArchived: (v: boolean) => void;
  archivedIds: string[];
  archiveCampaign: (id: string) => void;
  unarchiveCampaign: (id: string) => void;
  // unsub
  showUnsub: boolean; setShowUnsub: (v: boolean) => void;
  unsubList: string[];
  unsubInput: string; setUnsubInput: (v: string) => void;
  saveUnsub: (u: string[]) => void;
  toast: (msg: string, ok?: boolean) => void;
  // selection
  selectedIds: string[]; setSelectedIds: (ids: string[]) => void;
  bulkDelete: () => void;
  // recip search
  showRecipSearch: boolean; setShowRecipSearch: (v: boolean) => void;
  recipSearch: string; setRecipSearch: (v: string) => void;
  recipResults: any[]; recipSearching: boolean;
  searchAllRecipients: () => void;
  // new campaign
  setView: (v: any) => void;
  setStep: (n: number) => void;
  // campaign card props (forwarded)
  tags: Record<string, string[]>;
  tagInput: Record<string, string>; setTagInput: (t: Record<string, string>) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  editingNoteId: string | null; setEditingNoteId: (id: string | null) => void;
  editingNoteVal: string; setEditingNoteVal: (v: string) => void;
  saveNote: (id: string) => void;
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
  openSent: string | null; fetchSent: (id: string) => void; sentMap: Record<string, any[]>;
  openErrors: string | null; fetchFailed: (id: string) => void; failedMap: Record<string, any[]>;
  requeueFailed: (id: string) => void; requeueing: string | null;
  openRecipients: string | null; fetchAllRecipients: (id: string) => void;
  recipientsMap: Record<string, any[]>;
  recipStatusFilter: Record<string, string>; setRecipStatusFilter: (f: Record<string, string>) => void;
}

export function CampaignList(p: Props) {
  const { C, d } = p;

  const filtered = p.campaigns
    .filter(c => p.showArchived ? p.archivedIds.includes(c.id) : !p.archivedIds.includes(c.id))
    .filter(c =>
      (p.statusFilter === 'all' || c.status === p.statusFilter) &&
      (p.search === '' || c.name.toLowerCase().includes(p.search.toLowerCase()) || c.subject.toLowerCase().includes(p.search.toLowerCase()))
    )
    .sort((a, b) =>
      p.sortBy === 'name' ? a.name.localeCompare(b.name) :
      p.sortBy === 'sent' ? (b.sent_count || 0) - (a.sent_count || 0) :
      new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    );

  return (
    <div>
      {/* RECIPIENT SEARCH */}
      {p.showRecipSearch && (
        <div style={{ ...p.glassCard, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={p.recipSearch}
              onChange={e => p.setRecipSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && p.searchAllRecipients()}
              placeholder="Search by email or name across all campaigns…"
              style={{ ...p.inp, flex: 1, padding: '7px 12px', fontSize: 12 }}
              autoFocus
            />
            <button onClick={p.searchAllRecipients} style={p.btn} className="gbtn" disabled={p.recipSearching}>
              {p.recipSearching ? '…' : 'Search'}
            </button>
          </div>
          {p.recipResults.length > 0 && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: d ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.04)' }}>
                  {['Email', 'Name', 'Campaign', 'Status'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: C.muted, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{p.recipResults.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.border}` }} className="grow">
                    <td style={{ padding: '7px 12px', fontFamily: 'DM Mono,monospace' }}>{r.email}</td>
                    <td style={{ padding: '7px 12px', color: C.muted }}>{r.name || '—'}</td>
                    <td style={{ padding: '7px 12px', color: C.muted, fontSize: 11 }}>{r.campaignName}</td>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: C.muted }}>{r.status}</span>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {p.recipResults.length === 0 && p.recipSearch && !p.recipSearching && (
            <div style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Mono,monospace' }}>No results found.</div>
          )}
        </div>
      )}

      {/* SEARCH + FILTER + SORT */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={p.search} onChange={e => p.setSearch(e.target.value)}
          placeholder="Search campaigns…"
          style={{ ...p.inp, flex: 1, minWidth: 180, padding: '7px 12px', fontSize: 12 }}
        />
        <select value={p.statusFilter} onChange={e => p.setStatusFilter(e.target.value)}
          style={{ ...p.inp, width: 'auto', padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>
          {['all', 'scheduled', 'in_progress', 'paused', 'done', 'failed'].map(v => (
            <option key={v} value={v}>{v === 'all' ? 'All Status' : v.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={p.sortBy} onChange={e => p.setSortBy(e.target.value as any)}
          style={{ ...p.inp, width: 'auto', padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>
          <option value="date">Sort: Date</option>
          <option value="name">Sort: Name</option>
          <option value="sent">Sort: Sent</option>
        </select>
        <button onClick={() => p.setShowRecipSearch(!p.showRecipSearch)} className="gbtn"
          style={{ ...p.btnGhost, fontSize: 11, padding: '6px 12px', color: p.showRecipSearch ? C.accent : C.muted, borderColor: p.showRecipSearch ? 'rgba(43,127,255,0.4)' : C.border2 }}>
          🔍 Recipients
        </button>
        <button onClick={() => p.setShowArchived(!p.showArchived)} className="gbtn"
          style={{ ...p.btnGhost, fontSize: 11, padding: '6px 12px', color: p.showArchived ? '#c4b5fd' : C.muted, borderColor: p.showArchived ? 'rgba(139,92,246,0.4)' : C.border2 }}>
          {p.showArchived ? 'Hide Archived' : 'Archived'}
          {p.archivedIds.length > 0 && <span style={{ marginLeft: 5, fontFamily: 'DM Mono,monospace', fontSize: 10, opacity: 0.7 }}>{p.archivedIds.length}</span>}
        </button>
        <button onClick={() => p.setShowUnsub(!p.showUnsub)} className="gbtn"
          style={{ ...p.btnGhost, fontSize: 11, padding: '6px 12px', color: p.showUnsub ? '#fca5a5' : C.muted, borderColor: p.showUnsub ? 'rgba(239,68,68,0.35)' : C.border2 }}>
          Unsub {p.unsubList.length > 0 && `(${p.unsubList.length})`}
        </button>
        {p.selectedIds.length > 0 && (
          <button onClick={p.bulkDelete} className="gbtn"
            style={{ ...p.btnGhost, fontSize: 11, padding: '6px 12px', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)' }}>
            Delete {p.selectedIds.length}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>
          {p.campaigns.length} campaign{p.campaigns.length !== 1 ? 's' : ''}
        </span>
        <button onClick={() => { p.setView('create'); p.setStep(1); }} style={p.btn} className="gbtn">
          + New Campaign
        </button>
      </div>

      {/* UNSUB PANEL */}
      {p.showUnsub && (
        <div style={{ ...p.glassCard, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fca5a5', marginBottom: 10, fontFamily: 'DM Mono,monospace' }}>
            GLOBAL UNSUBSCRIBE LIST
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={p.unsubInput} onChange={e => p.setUnsubInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && p.unsubInput.trim()) { p.saveUnsub([...p.unsubList, p.unsubInput.trim()]); p.setUnsubInput(''); p.toast('Added to unsub list'); } }}
              placeholder="email@example.com — press Enter to add"
              style={{ ...p.inp, flex: 1, padding: '7px 12px', fontSize: 12 }}
            />
          </div>
          {p.unsubList.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.unsubList.map(e => (
                <span key={e} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontFamily: 'DM Mono,monospace', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {e}
                  <span onClick={() => p.saveUnsub(p.unsubList.filter(x => x !== e))} style={{ cursor: 'pointer', opacity: 0.6 }}>×</span>
                </span>
              ))}
            </div>
          )}
          {!p.unsubList.length && <div style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Mono,monospace' }}>No emails blocked yet.</div>}
        </div>
      )}

      {p.campaigns.length === 0 && (
        <div style={{ ...p.glassCard, padding: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.15, filter: 'blur(0.5px)' }}>✉</div>
          <div style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>No campaigns yet</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 5, opacity: 0.6 }}>Create your first campaign to get started</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(c => (
          <CampaignCard
            key={c.id}
            c={c}
            C={C}
            d={d}
            glassCard={p.glassCard}
            lbl={p.lbl}
            inp={p.inp}
            btn={p.btn}
            btnGhost={p.btnGhost}
            selectedIds={p.selectedIds}
            setSelectedIds={p.setSelectedIds}
            tags={p.tags}
            tagInput={p.tagInput}
            setTagInput={p.setTagInput}
            addTag={p.addTag}
            removeTag={p.removeTag}
            editingNoteId={p.editingNoteId}
            setEditingNoteId={p.setEditingNoteId}
            editingNoteVal={p.editingNoteVal}
            setEditingNoteVal={p.setEditingNoteVal}
            saveNote={p.saveNote}
            archivedIds={p.archivedIds}
            archiveCampaign={p.archiveCampaign}
            unarchiveCampaign={p.unarchiveCampaign}
            deleteCampaign={p.deleteCampaign}
            pauseResume={p.pauseResume}
            openFollowUp={p.openFollowUp}
            sendNow={p.sendNow}
            exportSentCSV={p.exportSentCSV}
            editingId={p.editingId}
            openEdit={p.openEdit}
            editSubject={p.editSubject} setEditSubject={p.setEditSubject}
            editBody={p.editBody} setEditBody={p.setEditBody}
            editFromName={p.editFromName} setEditFromName={p.setEditFromName}
            editScheduledAt={p.editScheduledAt} setEditScheduledAt={p.setEditScheduledAt}
            editSaving={p.editSaving}
            saveEdit={p.saveEdit}
            setEditingId={p.setEditingId}
            dupSource={p.dupSource}
            openDuplicate={p.openDuplicate}
            dupName={p.dupName} setDupName={p.setDupName}
            dupSubject={p.dupSubject} setDupSubject={p.setDupSubject}
            dupBody={p.dupBody} setDupBody={p.setDupBody}
            dupFromName={p.dupFromName} setDupFromName={p.setDupFromName}
            dupScheduledAt={p.dupScheduledAt} setDupScheduledAt={p.setDupScheduledAt}
            dupSaving={p.dupSaving}
            saveDuplicate={p.saveDuplicate}
            setDupSource={p.setDupSource}
            openSent={p.openSent} fetchSent={p.fetchSent} sentMap={p.sentMap}
            openErrors={p.openErrors} fetchFailed={p.fetchFailed} failedMap={p.failedMap}
            requeueFailed={p.requeueFailed} requeueing={p.requeueing}
            openRecipients={p.openRecipients} fetchAllRecipients={p.fetchAllRecipients}
            recipientsMap={p.recipientsMap}
            recipStatusFilter={p.recipStatusFilter} setRecipStatusFilter={p.setRecipStatusFilter}
          />
        ))}
      </div>
    </div>
  );
}
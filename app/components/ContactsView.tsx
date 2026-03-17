'use client';
import { useState } from 'react';
import { Recipient, Theme } from './types';

interface Props {
  C: Theme;
  d: boolean;
  glassCard: React.CSSProperties;
  lbl: React.CSSProperties;
  inp: React.CSSProperties;
  btn: React.CSSProperties;
  btnGhost: React.CSSProperties;
  contacts: Recipient[];
  contactSearch: string; setContactSearch: (v: string) => void;
  deleteContact: (email: string) => void;
  importContactsFromCSV: (recs: Recipient[]) => Promise<void>;
  loadContactsAsRecipients: (selected: Recipient[]) => void;
  handleCSV: (file: File) => void;
  toast: (msg: string, ok?: boolean) => void;
}

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let cur = '', inQuote = false;
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
};

const extractCityState = (address: string): { city: string; state: string } => {
  if (!address.trim()) return { city: '', state: '' };
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 4) {
    return { city: parts[parts.length - 3], state: parts[parts.length - 2].split(' ')[0] };
  }
  if (parts.length === 3) {
    return { city: parts[parts.length - 2], state: parts[parts.length - 1].split(' ')[0] };
  }
  return { city: '', state: '' };
};

export function ContactsView(p: Props) {
  const { C, d } = p;
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const filtered = p.contacts.filter(c =>
    !p.contactSearch ||
    c.email.toLowerCase().includes(p.contactSearch.toLowerCase()) ||
    (c.name || '').toLowerCase().includes(p.contactSearch.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(p.contactSearch.toLowerCase())
  );

  const toggleSelect = (email: string) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedEmails.size === filtered.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filtered.map(c => c.email)));
    }
  };

  const handleImportCSV = async (file: File) => {
    setImporting(true);
    const text = await file.text();
    const lines = text.replace(/^\uFEFF/, '').trim().split('\n');
    const rawHeaders = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, '').trim());
    const isScraperFormat = rawHeaders.includes('address') && rawHeaders.includes('name') && !rawHeaders.includes('first_name');
    const seen = new Set<string>();
    const recs: Recipient[] = [];

    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const vals = parseCSVLine(line);
      const row: Record<string, string> = {};
      rawHeaders.forEach((h, i) => { row[h] = (vals[i] || '').replace(/"/g, '').trim(); });
      const email = (row['email'] || row['email id'] || '').toLowerCase().trim();
      if (!email || seen.has(email)) continue;
      seen.add(email);

      if (isScraperFormat) {
        const { city, state } = extractCityState(row['address'] || '');
        const name = row['name'] || '';
        recs.push({ email, name, first_name: name.split(' ')[0] || '', city, state, phone: row['mobile number'] || row['phone'] || '', website: row['website'] || '', rating: row['rating'] || '', is_safe_to_send: 'true' });
      } else {
        recs.push({ email, name: row['name'] || '', first_name: row['first_name'] || '', city: row['city'] || '', state: row['state'] || '', phone: row['phone'] || '', website: row['website'] || '', rating: row['rating'] || '', is_safe_to_send: row['is_safe_to_send'] || 'true' });
      }
    }

    await p.importContactsFromCSV(recs);
    setImporting(false);
  };

  const loadSelected = () => {
    const sel = p.contacts.filter(c => selectedEmails.has(c.email));
    if (!sel.length) { p.toast('Select contacts first', false); return; }
    p.loadContactsAsRecipients(sel);
  };

  const borderColor = d ? 'rgba(255,255,255,0.07)' : '#e2e8f0';

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: C.text, margin: 0 }}>Contact Book</h2>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{p.contacts.length} contacts saved</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {selectedEmails.size > 0 && (
            <button onClick={loadSelected} className="gbtn" style={{ ...p.btn, fontSize: 13, padding: '8px 18px', background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 2px 12px rgba(16,185,129,0.35)' }}>
              ↗ Use {selectedEmails.size} in Campaign
            </button>
          )}
          <label className="gbtn" style={{ ...p.btnGhost, fontSize: 13, padding: '8px 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {importing ? 'Importing…' : '↑ Import CSV'}
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImportCSV(e.target.files[0])} disabled={importing} />
          </label>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: 14 }}>
        <input
          value={p.contactSearch}
          onChange={e => p.setContactSearch(e.target.value)}
          placeholder="Search contacts by email, name or city…"
          style={{ ...p.inp, fontSize: 14 }}
        />
      </div>

      {/* EMPTY STATE */}
      {p.contacts.length === 0 && (
        <div style={{ ...p.glassCard, padding: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.12 }}>👤</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.muted, marginBottom: 6 }}>No contacts yet</div>
          <div style={{ fontSize: 13, color: C.muted, opacity: 0.6 }}>Import a CSV to build your contact book</div>
        </div>
      )}

      {/* CONTACTS TABLE */}
      {p.contacts.length > 0 && (
        <div style={{ ...p.glassCard, overflow: 'hidden' }}>
          {/* TABLE HEADER */}
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 80px 80px 80px 90px', gap: 0, padding: '10px 16px', background: d ? 'rgba(0,0,0,0.3)' : '#f8fafc', borderBottom: `1px solid ${borderColor}` }}>
            <input type="checkbox"
              checked={selectedEmails.size === filtered.length && filtered.length > 0}
              onChange={toggleAll}
              style={{ accentColor: C.accent, width: 14, height: 14 }}
            />
            {['Email', 'Name', 'City', 'State', 'Rating', ''].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>{h}</div>
            ))}
          </div>

          {/* ROWS */}
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '28px 16px', fontSize: 13, color: C.muted, textAlign: 'center' }}>No contacts match your search.</div>
            )}
            {filtered.map((c, i) => (
              <div key={c.email} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 1fr 80px 80px 80px 90px',
                gap: 0, padding: '10px 16px',
                borderTop: i === 0 ? 'none' : `1px solid ${borderColor}`,
                background: selectedEmails.has(c.email) ? (d ? 'rgba(43,127,255,0.07)' : 'rgba(43,127,255,0.04)') : 'transparent',
                transition: 'background 0.15s',
              }} className="grow">
                <input type="checkbox"
                  checked={selectedEmails.has(c.email)}
                  onChange={() => toggleSelect(c.email)}
                  style={{ accentColor: C.accent, width: 14, height: 14 }}
                />
                <div style={{ fontSize: 13, fontFamily: 'DM Mono,monospace', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{c.email}</div>
                <div style={{ fontSize: 13, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{c.name || c.first_name || '—'}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{c.city || '—'}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{c.state || '—'}</div>
                <div style={{ fontSize: 12, color: c.rating ? C.amber : C.muted }}>
                  {c.rating ? `★ ${c.rating}` : '—'}
                </div>
                <button
                  onClick={() => { if (confirm(`Remove ${c.email}?`)) p.deleteContact(c.email); }}
                  className="gbtn"
                  style={{ ...p.btnGhost, fontSize: 11, padding: '3px 9px', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)', background: 'transparent' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* FOOTER */}
          {filtered.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: d ? 'rgba(0,0,0,0.2)' : '#fafbfc' }}>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Mono,monospace' }}>
                {selectedEmails.size > 0 ? `${selectedEmails.size} of ${filtered.length} selected` : `${filtered.length} contacts`}
              </span>
              {selectedEmails.size > 0 && (
                <button onClick={loadSelected} className="gbtn"
                  style={{ ...p.btn, fontSize: 12, padding: '6px 16px', background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }}>
                  ↗ Use in Campaign
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

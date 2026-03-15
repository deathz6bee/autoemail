'use client';
import { useEffect, useState } from 'react';
import {
  Recipient, Variant, Campaign, FollowUpRec, View,
  SenderAccount, SenderSplit, ToastItem, CronHealth,
  makeTheme, makeStyles,
} from './components/types';
import { NavBar } from './components/NavBar';
import { StatsBar } from './components/StatsBar';
import { CampaignList } from './components/CampaignList';
import { CreateWizard } from './components/CreateWizard';
import { FollowUpView } from './components/FollowUpView';
import { TestEmailView } from './components/TestEmailView';
import { SendersView } from './components/SendersView';

export default function App() {
  const [dark, setDark] = useState(true);
  const [view, setView] = useState<View>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [fromName, setFromName] = useState('');
  const [notes, setNotes] = useState('');
  const [windowStart, setWindowStart] = useState('20:00');
  const [windowEnd, setWindowEnd] = useState('01:00');
  const [dailyLimit, setDailyLimit] = useState(40);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [safeFilter, setSafeFilter] = useState(true);
  const [filteredCount, setFilteredCount] = useState(0);
  const [csvError, setCsvError] = useState('');
  const [variants, setVariants] = useState<Variant[]>([{ subject: '', body: '' }, { subject: '', body: '' }]);
  const [activeVariant, setActiveVariant] = useState(0);
  const [abEnabled, setAbEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [delaySeconds] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [testBody, setTestBody] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [fuCampaign, setFuCampaign] = useState<Campaign | null>(null);
  const [fuRecs, setFuRecs] = useState<FollowUpRec[]>([]);
  const [fuSearch, setFuSearch] = useState('');
  const [fuSubject, setFuSubject] = useState('');
  const [fuBody, setFuBody] = useState('');
  const [fuSchedule, setFuSchedule] = useState('');
  const [fuSubmitting, setFuSubmitting] = useState(false);
  const [failedMap, setFailedMap] = useState<Record<string, any[]>>({});
  const [openErrors, setOpenErrors] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editFromName, setEditFromName] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [dupSource, setDupSource] = useState<Campaign | null>(null);
  const [dupName, setDupName] = useState('');
  const [dupSubject, setDupSubject] = useState('');
  const [dupBody, setDupBody] = useState('');
  const [dupFromName, setDupFromName] = useState('');
  const [dupScheduledAt, setDupScheduledAt] = useState('');
  const [dupSaving, setDupSaving] = useState(false);
  // Feature state
  const [tags, setTags] = useState<Record<string, string[]>>(() => { try { return JSON.parse(localStorage.getItem('ae_tags') || '{}') } catch { return {} } });
  const [archivedIds, setArchivedIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('ae_archived') || '[]') } catch { return [] } });
  const [showArchived, setShowArchived] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; name: string; subject: string; body: string }[]>(() => { try { return JSON.parse(localStorage.getItem('ae_templates') || '[]') } catch { return [] } });
  const [showTemplates, setShowTemplates] = useState(false);
  const [unsubList, setUnsubList] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('ae_unsub') || '[]') } catch { return [] } });
  const [showUnsub, setShowUnsub] = useState(false);
  const [unsubInput, setUnsubInput] = useState('');
  const [sentMap, setSentMap] = useState<Record<string, any[]>>({});
  const [openSent, setOpenSent] = useState<string | null>(null);
  const [recipSearch, setRecipSearch] = useState('');
  const [showRecipSearch, setShowRecipSearch] = useState(false);
  const [recipResults, setRecipResults] = useState<any[]>([]);
  const [recipSearching, setRecipSearching] = useState(false);
  const [undoQueue, setUndoQueue] = useState<{ id: string; name: string; timer: any } | null>(null);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [tagInput, setTagInput] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'sent'>('date');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteVal, setEditingNoteVal] = useState('');
  // Sender accounts
  const [senderAccounts, setSenderAccounts] = useState<SenderAccount[]>([]);
  const [senderSplits, setSenderSplits] = useState<SenderSplit[]>([]);
  const [newSenderEmail, setNewSenderEmail] = useState('');
  const [newSenderPassword, setNewSenderPassword] = useState('');
  const [newSenderLabel, setNewSenderLabel] = useState('');
  const [senderSaving, setSenderSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // QOL
  const [openRecipients, setOpenRecipients] = useState<string | null>(null);
  const [recipientsMap, setRecipientsMap] = useState<Record<string, any[]>>({});
  const [recipStatusFilter, setRecipStatusFilter] = useState<Record<string, string>>({});
  const [requeueing, setRequeueing] = useState<string | null>(null);
  const [cronHealth, setCronHealth] = useState<CronHealth>({ last: null, status: 'unknown' });

  const d = dark;
  const C = makeTheme(d);
  const { glassCard, lbl, inp, btn, btnGhost } = makeStyles(C, d);

  // ── DATA ────────────────────────────────────────────────────────────
  const fetchCampaigns = async () => {
    try { const r = await fetch('/api/campaigns'); setCampaigns(await r.json()); setLastRefreshed(Date.now()); } catch {}
  };
  useEffect(() => { fetchCampaigns(); const t = setInterval(fetchCampaigns, 30000); return () => clearInterval(t); }, []);

  const fetchSenderAccounts = async () => {
    try { const r = await fetch('/api/sender-accounts'); const data = await r.json(); setSenderAccounts(data || []); } catch {}
  };
  useEffect(() => { fetchSenderAccounts(); }, []);

  const goHome = () => { setView('list'); setStep(1); setError(''); };

  // ── CRON HEALTH ──────────────────────────────────────────────────────
  const checkCronHealth = async () => {
    try {
      const res = await fetch('/api/cron/send');
      const data = await res.json();
      setCronHealth({ last: new Date().toISOString(), status: res.ok ? (data.success ? 'sent' : 'idle') : 'error' });
    } catch { setCronHealth(p => ({ ...p, status: 'error' })); }
  };
  useEffect(() => { const t = setInterval(() => setCronHealth(p => ({ ...p })), 60000); return () => clearInterval(t); }, []);

  // ── RECIPIENTS VIEW ──────────────────────────────────────────────────
  const fetchAllRecipients = async (campaignId: string) => {
    if (openRecipients === campaignId) { setOpenRecipients(null); return; }
    const res = await fetch(`/api/recipients?campaign_id=${campaignId}&status=all`);
    const data = await res.json();
    setRecipientsMap(prev => ({ ...prev, [campaignId]: data || [] }));
    setRecipStatusFilter(prev => ({ ...prev, [campaignId]: 'all' }));
    setOpenRecipients(campaignId);
  };

  // ── RE-QUEUE ─────────────────────────────────────────────────────────
  const requeueFailed = async (campaignId: string) => {
    if (!confirm('Reset all failed recipients back to pending? They will be retried on next send.')) return;
    setRequeueing(campaignId);
    const res = await fetch(`/api/recipients?campaign_id=${campaignId}&status=failed`);
    const failed = await res.json() || [];
    if (!failed.length) { toast('No failed recipients to re-queue', false); setRequeueing(null); return; }
    await fetch('/api/recipients', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaign_id: campaignId, action: 'requeue' }) });
    await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: campaignId, status: 'in_progress' }) });
    setRequeueing(null);
    toast(`${failed.length} recipients re-queued`);
    fetchCampaigns();
    if (openErrors === campaignId) fetchFailed(campaignId);
    if (openRecipients === campaignId) fetchAllRecipients(campaignId);
  };

  // ── TOAST ─────────────────────────────────────────────────────────────
  const toast = (msg: string, ok = true) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  const saveTags = (t: Record<string, string[]>) => { setTags(t); localStorage.setItem('ae_tags', JSON.stringify(t)); };
  const saveArchived = (a: string[]) => { setArchivedIds(a); localStorage.setItem('ae_archived', JSON.stringify(a)); };
  const saveTemplates = (t: typeof templates) => { setTemplates(t); localStorage.setItem('ae_templates', JSON.stringify(t)); };
  const saveUnsub = (u: string[]) => { setUnsubList(u); localStorage.setItem('ae_unsub', JSON.stringify(u)); };

  const archiveCampaign = (id: string) => { saveArchived([...archivedIds, id]); toast('Campaign archived'); };
  const unarchiveCampaign = (id: string) => { saveArchived(archivedIds.filter(x => x !== id)); };

  const addTag = (campaignId: string, tag: string) => {
    if (!tag.trim()) return;
    const t = { ...tags, [campaignId]: [...(tags[campaignId] || []).filter(x => x !== tag.trim()), tag.trim()] };
    saveTags(t); setTagInput(p => ({ ...p, [campaignId]: '' }));
  };
  const removeTag = (campaignId: string, tag: string) => {
    saveTags({ ...tags, [campaignId]: (tags[campaignId] || []).filter(x => x !== tag) });
  };

  const saveTemplate = () => {
    if (!variants[activeVariant].subject || !variants[activeVariant].body) { toast('Fill subject and body first', false); return; }
    const tname = prompt('Template name?'); if (!tname) return;
    saveTemplates([...templates, { id: Date.now().toString(), name: tname, subject: variants[activeVariant].subject, body: variants[activeVariant].body }]);
    toast('Template saved');
  };
  const loadTemplate = (t: { subject: string; body: string }) => {
    updateVariant(activeVariant, 'subject', t.subject);
    updateVariant(activeVariant, 'body', t.body);
    setShowTemplates(false); toast('Template loaded');
  };
  const deleteTemplate = (id: string) => saveTemplates(templates.filter(t => t.id !== id));

  const fetchSent = async (campaignId: string) => {
    if (openSent === campaignId) { setOpenSent(null); return; }
    const res = await fetch(`/api/recipients?campaign_id=${campaignId}&status=sent`);
    const data = await res.json(); setSentMap(prev => ({ ...prev, [campaignId]: data || [] }));
    setOpenSent(campaignId);
  };

  const searchAllRecipients = async () => {
    if (!recipSearch.trim()) return;
    setRecipSearching(true);
    const results: any[] = [];
    for (const c of campaigns) {
      const res = await fetch(`/api/recipients?campaign_id=${c.id}`);
      const data = await res.json() || [];
      data.filter((r: any) => r.email.includes(recipSearch) || ((r.name || '').toLowerCase().includes(recipSearch.toLowerCase())))
        .forEach((r: any) => results.push({ ...r, campaignName: c.name, campaignId: c.id }));
    }
    setRecipResults(results); setRecipSearching(false);
  };

  const exportSentCSV = async (c: Campaign) => {
    const res = await fetch(`/api/recipients?campaign_id=${c.id}&status=sent`);
    const data = await res.json() || [];
    if (!data.length) { toast('No sent recipients yet', false); return; }
    const rows = [['email', 'name', 'sent_at'], ...data.map((r: any) => [r.email, r.name || '', r.sent_at || ''])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${c.name}_sent.csv`; a.click(); toast('CSV downloaded');
  };

  const saveDraftToStorage = () => {
    const d2 = { name, fromName, notes, recipients, variants, scheduledAt, windowStart, windowEnd, dailyLimit, step };
    localStorage.setItem('ae_draft', JSON.stringify(d2)); toast('Draft saved');
  };
  const loadDraftFromStorage = () => {
    try {
      const d2 = JSON.parse(localStorage.getItem('ae_draft') || 'null'); if (!d2) return;
      setName(d2.name || ''); setFromName(d2.fromName || ''); setNotes(d2.notes || '');
      setVariants(d2.variants || [{ subject: '', body: '' }, { subject: '', body: '' }]);
      setScheduledAt(d2.scheduledAt || ''); setWindowStart(d2.windowStart || '20:00');
      setWindowEnd(d2.windowEnd || '01:00'); setDailyLimit(d2.dailyLimit || 40);
      setStep(d2.step || 1); toast('Draft loaded');
    } catch {}
  };

  const softDelete = (id: string, name2: string) => {
    if (undoQueue) { clearTimeout(undoQueue.timer); fetch(`/api/campaigns?id=${undoQueue.id}`, { method: 'DELETE' }); }
    const timer = setTimeout(() => { fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' }); fetchCampaigns(); setUndoQueue(null); }, 5000);
    setUndoQueue({ id, name: name2, timer });
    setCampaigns(p => p.filter(c => c.id !== id));
    toast(`"${name2}" deleted — undo?`);
  };
  const undoDelete = () => {
    if (!undoQueue) return;
    clearTimeout(undoQueue.timer); setUndoQueue(null); fetchCampaigns(); toast('Deletion undone');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' || e.key === 'N') { setView('create'); setStep(1); }
      if (e.key === 'Escape') goHome();
      if (e.key === '/') { setView('list'); setTimeout(() => document.querySelector<HTMLInputElement>('input[placeholder="Search campaigns…"]')?.focus(), 50); e.preventDefault(); }
      if (e.key === '?') setShowHotkeys(p => !p);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCSV = (file: File) => {
    setCsvError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      if (!headers.includes('email')) { setCsvError('CSV must have an "email" column'); return; }
      const all = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: Recipient = { email: '' };
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      }).filter(r => r.email);
      const safe = all.filter(r => !safeFilter || !r.is_safe_to_send || r.is_safe_to_send === 'true' || r.is_safe_to_send === '1');
      setFilteredCount(all.length - safe.length);
      setRecipients(safe);
    };
    reader.readAsText(file);
  };

  const updateVariant = (idx: number, field: 'subject' | 'body', val: string) =>
    setVariants(v => v.map((x, i) => i === idx ? { ...x, [field]: val } : x));

  const preview = (text: string, r?: Recipient) => {
    if (!r) return text;
    return text
      .replace(/{{first_name}}/gi, r.first_name || (r.name || r.business_name || 'there').split(' ')[0])
      .replace(/{{name}}/gi, r.name || r.business_name || '')
      .replace(/{{business_name}}/gi, r.business_name || r.name || '')
      .replace(/{{company}}/gi, r.name || r.business_name || '')
      .replace(/{{city}}/gi, r.city || '')
      .replace(/{{state}}/gi, r.state || '')
      .replace(/{{email}}/gi, r.email || '')
      .replace(/{{phone}}/gi, r.phone || '')
      .replace(/{{website}}/gi, r.website || '')
      .replace(/{{rating}}/gi, r.rating || '');
  };

  const addSenderAccount = async () => {
    if (!newSenderEmail || !newSenderPassword) { toast('Fill email and app password', false); return; }
    setSenderSaving(true);
    const res = await fetch('/api/sender-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newSenderEmail, app_password: newSenderPassword, label: newSenderLabel }) });
    setSenderSaving(false);
    if (res.ok) { setNewSenderEmail(''); setNewSenderPassword(''); setNewSenderLabel(''); fetchSenderAccounts(); toast('Account added'); }
    else { const d2 = await res.json(); toast(d2.error || 'Failed', false); }
  };
  const deleteSenderAccount = async (id: string) => {
    if (!confirm('Remove this sender account?')) return;
    await fetch(`/api/sender-accounts?id=${id}`, { method: 'DELETE' });
    fetchSenderAccounts(); toast('Account removed');
  };
  const toggleSenderAccount = async (id: string, is_active: boolean) => {
    await fetch('/api/sender-accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active }) });
    fetchSenderAccounts();
  };
  const initSplits = (accounts: SenderAccount[]) => {
    const active = accounts.filter(a => a.is_active);
    if (!active.length) { setSenderSplits([]); return; }
    const equal = Math.floor(100 / active.length);
    const splits = active.map((a, i) => ({ email: a.email, pct: i === active.length - 1 ? 100 - equal * (active.length - 1) : equal }));
    setSenderSplits(splits);
  };
  const updateSplit = (email: string, pct: number) => {
    setSenderSplits(prev => prev.map(s => s.email === email ? { ...s, pct } : s));
  };

  const handleSubmit = async () => {
    setError('');
    if (!name || !fromName || !scheduledAt) { setError('Fill name, from name and schedule time'); return; }
    if (scheduledAt && new Date(scheduledAt) < new Date()) { setError('Scheduled time is in the past'); return; }
    if (campaigns.some(c => c.name.toLowerCase() === name.toLowerCase())) { if (!confirm(`A campaign named "${name}" already exists. Continue?`)) return; }
    const [sh2, sm2] = windowStart.split(':').map(Number); const [eh2, em2] = windowEnd.split(':').map(Number);
    const wm2 = (eh2 * 60 + em2) > (sh2 * 60 + sm2) ? (eh2 * 60 + em2) - (sh2 * 60 + sm2) : (24 * 60 - sh2 * 60 - sm2) + eh2 * 60 + em2;
    if (dailyLimit > Math.floor(wm2 / 5)) { if (!confirm('Daily limit exceeds window capacity. Continue anyway?')) return; }
    if (!recipients.length) { setError('Upload a CSV first'); return; }
    if (!variants[0].subject || !variants[0].body) { setError('Fill subject and body'); return; }
    const recs = recipients.map((r, i) => {
      const isB = abEnabled && variants[1].subject && i >= Math.floor(recipients.length / 2);
      return { email: r.email, name: r.first_name || r.name || r.business_name || '', subject_override: isB ? variants[1].subject : null, body_override: isB ? variants[1].body : null, metadata: JSON.stringify(r) };
    });
    setSubmitting(true);
    const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, from_name: fromName, subject: variants[0].subject, body: variants[0].body, scheduled_at: new Date(scheduledAt).toISOString(), delay_seconds: delaySeconds, notes, window_start: windowStart, window_end: windowEnd, daily_limit: dailyLimit, total_count: recipients.length, recipients: recs, sender_splits: senderSplits.length > 0 ? senderSplits : null }) });
    setSubmitting(false);
    if (res.ok) { goHome(); setName(''); setFromName(''); setNotes(''); setRecipients([]); setVariants([{ subject: '', body: '' }, { subject: '', body: '' }]); setScheduledAt(''); fetchCampaigns(); }
    else { const d2 = await res.json(); setError(d2.error || 'Error'); }
  };

  const openEdit = (c: any) => {
    setEditingId(c.id); setEditSubject(c.subject); setEditBody(c.body || ''); setEditFromName(c.from_name || '');
    const local = new Date(c.scheduled_at); const offset = local.getTimezoneOffset();
    setEditScheduledAt(new Date(local.getTime() - offset * 60000).toISOString().slice(0, 16));
  };
  const saveEdit = async () => {
    if (!editingId) return; setEditSaving(true);
    await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, subject: editSubject, body: editBody, from_name: editFromName, scheduled_at: new Date(editScheduledAt).toISOString() }) });
    setEditSaving(false); setEditingId(null); fetchCampaigns();
  };

  const fetchFailed = async (campaignId: string) => {
    if (openErrors === campaignId) { setOpenErrors(null); return; }
    const res = await fetch(`/api/recipients?campaign_id=${campaignId}&status=failed`);
    const data = await res.json();
    setFailedMap(prev => ({ ...prev, [campaignId]: data || [] }));
    setOpenErrors(campaignId);
  };

  const pauseResume = async (c: Campaign) => {
    if (c.status === 'in_progress' && !confirm('Pause this active campaign?')) return;
    const newStatus = c.status === 'paused' ? 'scheduled' : 'paused';
    await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, status: newStatus }) });
    fetchCampaigns();
  };

  const openDuplicate = (c: Campaign) => {
    setDupSource(c); setDupName('Copy of ' + c.name);
    setDupSubject((c as any).subject || ''); setDupBody((c as any).body || ''); setDupFromName((c as any).from_name || '');
    const local = new Date(c.scheduled_at); const offset = local.getTimezoneOffset();
    setDupScheduledAt(new Date(local.getTime() - offset * 60000).toISOString().slice(0, 16));
  };
  const saveDuplicate = async () => {
    if (!dupSource) return; setDupSaving(true);
    await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'duplicate', parent_campaign_id: dupSource.id, name: dupName, subject: dupSubject, body: dupBody, from_name: dupFromName, scheduled_at: new Date(dupScheduledAt).toISOString() }) });
    setDupSaving(false); setDupSource(null); fetchCampaigns();
  };

  const deleteCampaign = (id: string, cname: string) => softDelete(id, cname);
  const bulkDelete = async () => {
    if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} campaigns?`)) return;
    await Promise.all(selectedIds.map(id => fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' })));
    setSelectedIds([]); fetchCampaigns(); toast(`Deleted ${selectedIds.length} campaigns`);
  };

  const saveNote = async (id: string) => {
    await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, notes: editingNoteVal }) });
    setEditingNoteId(null); fetchCampaigns(); toast('Note saved');
  };

  const sendNow = async (c: Campaign) => {
    if (!confirm('Send this campaign now?')) return;
    await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, scheduled_at: new Date().toISOString() }) });
    fetchCampaigns(); toast('Campaign will send on next cron tick');
  };

  const openFollowUp = async (c: Campaign) => {
    setFuCampaign(c); setFuSearch(''); setFuSubject('Re: ' + c.subject); setFuBody(''); setFuSchedule('');
    const res = await fetch(`/api/recipients?campaign_id=${c.id}`);
    setFuRecs((await res.json() || []).map((r: any) => ({ ...r, selected: true })));
    setView('followup');
  };

  const sendFollowUp = async () => {
    const sel = fuRecs.filter(r => r.selected);
    if (!sel.length || !fuSubject || !fuBody || !fuSchedule) return;
    setFuSubmitting(true);
    await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fuCampaign?.name + ' — Follow Up', from_name: fromName || 'Follow Up', subject: fuSubject, body: fuBody, scheduled_at: new Date(fuSchedule).toISOString(), delay_seconds: delaySeconds, window_start: windowStart, window_end: windowEnd, parent_campaign_id: fuCampaign?.id, total_count: sel.length, daily_limit: dailyLimit, recipients: sel.map(r => ({ email: r.email, name: r.name })) }) });
    setFuSubmitting(false); setView('list'); fetchCampaigns();
  };

  const sendTest = async () => {
    if (!testEmail || !testSubject || !testBody) { setTestResult('Fill all fields'); return; }
    setTestSending(true); setTestResult('');
    const res = await fetch('/api/test-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: testEmail, subject: testSubject, body: testBody }) });
    setTestSending(false); setTestResult(res.ok ? '✓ Sent successfully' : '✕ Failed to send');
  };

  // ── SHARED PROPS ─────────────────────────────────────────────────────
  const sharedStyles = { C, d, glassCard, lbl, inp, btn, btnGhost };

  return (
    <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', minHeight: '100vh', background: C.bgGrad, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,textarea,select{font-family:inherit;color-scheme:${d ? 'dark' : 'light'};}
        input[type=range]{accent-color:#2b7fff;}
        input:focus,textarea:focus{
          border-color:rgba(43,127,255,0.6)!important;
          box-shadow:0 0 0 3px rgba(43,127,255,0.15),0 0 16px rgba(43,127,255,0.08)!important;
          outline:none!important;
          background:${d ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.95)'}!important;
        }
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px;}
        .gbtn:hover{opacity:0.82;transform:translateY(-1px);}
        .gbtn:active{transform:translateY(0px);}
        .grow:hover{background:${d ? 'rgba(43,127,255,0.05)' : 'rgba(43,127,255,0.03)'}!important;}
        .gcard:hover{
          border-color:${d ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)'}!important;
          box-shadow:${d ? '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)' : '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)'}!important;
          transform:translateY(-1px);
        }
        .gcard{transition:all 0.2s cubic-bezier(0.4,0,0.2,1);}
        .logo-btn:hover{opacity:0.8;}
        .logo-btn:active{opacity:0.6;}
        .tag-btn:hover{background:rgba(43,127,255,0.15)!important;border-color:rgba(43,127,255,0.4)!important;color:#93c5fd!important;}
        .nav-tab:hover{color:${d ? '#93c5fd' : '#2b7fff'};}
        h2,h3{margin:0;}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.6;transform:scale(0.85);}}
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <NavBar
        view={view}
        setView={(v) => { setView(v); setStep(1); setError(''); }}
        dark={dark}
        setDark={setDark}
        lastRefreshed={lastRefreshed}
        fetchCampaigns={fetchCampaigns}
        cronHealth={cronHealth}
        checkCronHealth={checkCronHealth}
        goHome={goHome}
        C={C}
        btnGhost={btnGhost}
      />

      {/* MAIN CONTENT — all views inside one padded container, fixing the Senders positioning bug */}
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '32px 22px' }}>

        {/* CAMPAIGN LIST */}
        {view === 'list' && (
          <>
            <StatsBar campaigns={campaigns} C={C} glassCard={glassCard} />
            <CampaignList
              campaigns={campaigns}
              {...sharedStyles}
              search={search} setSearch={setSearch}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              sortBy={sortBy} setSortBy={setSortBy}
              showArchived={showArchived} setShowArchived={setShowArchived}
              archivedIds={archivedIds}
              archiveCampaign={archiveCampaign}
              unarchiveCampaign={unarchiveCampaign}
              showUnsub={showUnsub} setShowUnsub={setShowUnsub}
              unsubList={unsubList}
              unsubInput={unsubInput} setUnsubInput={setUnsubInput}
              saveUnsub={saveUnsub}
              toast={toast}
              selectedIds={selectedIds} setSelectedIds={setSelectedIds}
              bulkDelete={bulkDelete}
              showRecipSearch={showRecipSearch} setShowRecipSearch={setShowRecipSearch}
              recipSearch={recipSearch} setRecipSearch={setRecipSearch}
              recipResults={recipResults} recipSearching={recipSearching}
              searchAllRecipients={searchAllRecipients}
              setView={setView} setStep={setStep}
              tags={tags} tagInput={tagInput} setTagInput={setTagInput}
              addTag={addTag} removeTag={removeTag}
              editingNoteId={editingNoteId} setEditingNoteId={setEditingNoteId}
              editingNoteVal={editingNoteVal} setEditingNoteVal={setEditingNoteVal}
              saveNote={saveNote}
              deleteCampaign={deleteCampaign}
              pauseResume={pauseResume}
              openFollowUp={openFollowUp}
              sendNow={sendNow}
              exportSentCSV={exportSentCSV}
              editingId={editingId} openEdit={openEdit}
              editSubject={editSubject} setEditSubject={setEditSubject}
              editBody={editBody} setEditBody={setEditBody}
              editFromName={editFromName} setEditFromName={setEditFromName}
              editScheduledAt={editScheduledAt} setEditScheduledAt={setEditScheduledAt}
              editSaving={editSaving} saveEdit={saveEdit} setEditingId={setEditingId}
              dupSource={dupSource} openDuplicate={openDuplicate}
              dupName={dupName} setDupName={setDupName}
              dupSubject={dupSubject} setDupSubject={setDupSubject}
              dupBody={dupBody} setDupBody={setDupBody}
              dupFromName={dupFromName} setDupFromName={setDupFromName}
              dupScheduledAt={dupScheduledAt} setDupScheduledAt={setDupScheduledAt}
              dupSaving={dupSaving} saveDuplicate={saveDuplicate} setDupSource={setDupSource}
              openSent={openSent} fetchSent={fetchSent} sentMap={sentMap}
              openErrors={openErrors} fetchFailed={fetchFailed} failedMap={failedMap}
              requeueFailed={requeueFailed} requeueing={requeueing}
              openRecipients={openRecipients} fetchAllRecipients={fetchAllRecipients}
              recipientsMap={recipientsMap}
              recipStatusFilter={recipStatusFilter} setRecipStatusFilter={setRecipStatusFilter}
            />
          </>
        )}

        {/* CREATE WIZARD */}
        {view === 'create' && (
          <CreateWizard
            {...sharedStyles}
            step={step} setStep={setStep}
            error={error} setError={setError}
            name={name} setName={setName}
            fromName={fromName} setFromName={setFromName}
            notes={notes} setNotes={setNotes}
            recipients={recipients}
            safeFilter={safeFilter} setSafeFilter={setSafeFilter}
            filteredCount={filteredCount}
            csvError={csvError}
            handleCSV={handleCSV}
            variants={variants}
            activeVariant={activeVariant} setActiveVariant={setActiveVariant}
            abEnabled={abEnabled} setAbEnabled={setAbEnabled}
            updateVariant={updateVariant}
            scheduledAt={scheduledAt} setScheduledAt={setScheduledAt}
            windowStart={windowStart} setWindowStart={setWindowStart}
            windowEnd={windowEnd} setWindowEnd={setWindowEnd}
            dailyLimit={dailyLimit} setDailyLimit={setDailyLimit}
            senderAccounts={senderAccounts}
            senderSplits={senderSplits} setSenderSplits={setSenderSplits}
            initSplits={initSplits} updateSplit={updateSplit}
            submitting={submitting} handleSubmit={handleSubmit}
            preview={preview} toast={toast}
            templates={templates}
            showTemplates={showTemplates} setShowTemplates={setShowTemplates}
            saveTemplate={saveTemplate} loadTemplate={loadTemplate} deleteTemplate={deleteTemplate}
            saveDraftToStorage={saveDraftToStorage} loadDraftFromStorage={loadDraftFromStorage}
            campaigns={campaigns}
          />
        )}

        {/* FOLLOW UP */}
        {view === 'followup' && fuCampaign && (
          <FollowUpView
            {...sharedStyles}
            fuCampaign={fuCampaign}
            fuRecs={fuRecs} setFuRecs={setFuRecs}
            fuSearch={fuSearch} setFuSearch={setFuSearch}
            fuSubject={fuSubject} setFuSubject={setFuSubject}
            fuBody={fuBody} setFuBody={setFuBody}
            fuSchedule={fuSchedule} setFuSchedule={setFuSchedule}
            fuSubmitting={fuSubmitting}
            sendFollowUp={sendFollowUp}
            goBack={() => setView('list')}
          />
        )}

        {/* TEST EMAIL */}
        {view === 'test' && (
          <TestEmailView
            {...sharedStyles}
            testEmail={testEmail} setTestEmail={setTestEmail}
            testSubject={testSubject} setTestSubject={setTestSubject}
            testBody={testBody} setTestBody={setTestBody}
            testSending={testSending} testResult={testResult}
            sendTest={sendTest}
          />
        )}

        {/* SENDERS — now inside the main container (bug fix) */}
        {view === 'senders' && (
          <SendersView
            {...sharedStyles}
            senderAccounts={senderAccounts}
            newSenderEmail={newSenderEmail} setNewSenderEmail={setNewSenderEmail}
            newSenderPassword={newSenderPassword} setNewSenderPassword={setNewSenderPassword}
            newSenderLabel={newSenderLabel} setNewSenderLabel={setNewSenderLabel}
            senderSaving={senderSaving}
            showPassword={showPassword} setShowPassword={setShowPassword}
            addSenderAccount={addSenderAccount}
            deleteSenderAccount={deleteSenderAccount}
            toggleSenderAccount={toggleSenderAccount}
          />
        )}
      </div>

      {/* HOTKEYS MODAL */}
      {showHotkeys && (
        <div onClick={() => setShowHotkeys(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ ...glassCard, padding: 28, minWidth: 300, maxWidth: 400 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 16, fontFamily: 'DM Mono,monospace' }}>KEYBOARD SHORTCUTS</div>
            {[['N', 'New campaign'], ['Esc', 'Back to list'], ['/', 'Focus search'], ['?', 'Toggle this panel']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ fontFamily: 'DM Mono,monospace', background: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', padding: '2px 8px', borderRadius: 5, fontSize: 11, color: C.text }}>{k}</span>
                <span style={{ color: C.muted }}>{v}</span>
              </div>
            ))}
            <button onClick={() => setShowHotkeys(false)} className="gbtn" style={{ ...btnGhost, marginTop: 16, width: '100%', textAlign: 'center' }}>Close</button>
          </div>
        </div>
      )}

      {/* UNDO BANNER */}
      {undoQueue && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: d ? 'rgba(10,16,32,0.95)' : 'rgba(255,255,255,0.97)', border: `1px solid ${C.border2}`, borderRadius: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 14, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
          <span style={{ fontSize: 13, color: C.text }}>"{undoQueue.name}" deleted</span>
          <button onClick={undoDelete} className="gbtn" style={{ ...btn, padding: '5px 14px', fontSize: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 2px 10px rgba(245,158,11,0.3)' }}>Undo</button>
        </div>
      )}

      {/* TOASTS */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 999, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${t.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: t.ok ? '#6ee7b7' : '#fca5a5', backdropFilter: 'blur(16px)', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 500, boxShadow: t.ok ? '0 4px 20px rgba(16,185,129,0.15)' : '0 4px 20px rgba(239,68,68,0.15)', animation: 'slideIn 0.25s ease' }}>
            {t.ok ? '✓' : '✕'} {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
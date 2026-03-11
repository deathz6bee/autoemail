'use client';
import { useEffect, useState, useRef } from 'react';

type Recipient = { email: string; name?: string; first_name?: string; business_name?: string; phone?: string; city?: string; state?: string; overall_score?: string; is_safe_to_send?: string; website?: string; rating?: string; [key: string]: string | undefined };
type Variant = { subject: string; body: string };
type Campaign = { id: string; name: string; subject: string; status: string; scheduled_at: string; notes?: string; sent_count?: number; total_count?: number; recipients: { count: number }[] };
type FollowUpRec = { id: string; email: string; name: string; selected: boolean };
type View = 'list'|'create'|'test'|'followup';

const TAGS = ['{{first_name}}','{{name}}','{{company}}','{{city}}','{{state}}','{{email}}','{{phone}}','{{website}}','{{rating}}'];

const STATUS_META: Record<string,{label:string;dot:string;bg:string;text:string;glow:string}> = {
  scheduled:   {label:'SCHEDULED', dot:'#60a5fa', bg:'rgba(59,130,246,0.12)',  text:'#93c5fd', glow:'rgba(59,130,246,0.3)'},
  sending:     {label:'SENDING',   dot:'#fbbf24', bg:'rgba(245,158,11,0.12)',  text:'#fcd34d', glow:'rgba(245,158,11,0.4)'},
  in_progress: {label:'ACTIVE',    dot:'#fbbf24', bg:'rgba(245,158,11,0.12)',  text:'#fcd34d', glow:'rgba(245,158,11,0.4)'},
  done:        {label:'COMPLETE',  dot:'#34d399', bg:'rgba(16,185,129,0.12)',  text:'#6ee7b7', glow:'rgba(16,185,129,0.3)'},
  failed:      {label:'FAILED',    dot:'#f87171', bg:'rgba(239,68,68,0.12)',   text:'#fca5a5', glow:'rgba(239,68,68,0.3)'},
  paused:      {label:'PAUSED',    dot:'#a78bfa', bg:'rgba(139,92,246,0.12)', text:'#c4b5fd', glow:'rgba(139,92,246,0.3)'},
  draft:       {label:'DRAFT',     dot:'#9ca3af', bg:'rgba(107,114,128,0.12)',text:'#d1d5db', glow:'rgba(107,114,128,0.2)'},
};

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
  const [variants, setVariants] = useState<Variant[]>([{subject:'',body:''},{subject:'',body:''}]);
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
  const [fuCampaign, setFuCampaign] = useState<Campaign|null>(null);
  const [fuRecs, setFuRecs] = useState<FollowUpRec[]>([]);
  const [fuSearch, setFuSearch] = useState('');
  const [fuSubject, setFuSubject] = useState('');
  const [fuBody, setFuBody] = useState('');
  const [fuSchedule, setFuSchedule] = useState('');
  const [fuSubmitting, setFuSubmitting] = useState(false);
  const [failedMap, setFailedMap] = useState<Record<string,any[]>>({});
  const [openErrors, setOpenErrors] = useState<string|null>(null);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editFromName, setEditFromName] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [dupSource, setDupSource] = useState<Campaign|null>(null);
  const [dupName, setDupName] = useState('');
  const [dupSubject, setDupSubject] = useState('');
  const [dupBody, setDupBody] = useState('');
  const [dupFromName, setDupFromName] = useState('');
  const [dupScheduledAt, setDupScheduledAt] = useState('');
  const [dupSaving, setDupSaving] = useState(false);
  // Feature state
  const [tags, setTags] = useState<Record<string,string[]>>(()=>{try{return JSON.parse(localStorage.getItem('ae_tags')||'{}')}catch{return {}}});
  const [archivedIds, setArchivedIds] = useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('ae_archived')||'[]')}catch{return []}});
  const [showArchived, setShowArchived] = useState(false);
  const [templates, setTemplates] = useState<{id:string;name:string;subject:string;body:string}[]>(()=>{try{return JSON.parse(localStorage.getItem('ae_templates')||'[]')}catch{return []}});
  const [showTemplates, setShowTemplates] = useState(false);
  const [unsubList, setUnsubList] = useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('ae_unsub')||'[]')}catch{return []}});
  const [showUnsub, setShowUnsub] = useState(false);
  const [unsubInput, setUnsubInput] = useState('');
  const [sentMap, setSentMap] = useState<Record<string,any[]>>({});
  const [openSent, setOpenSent] = useState<string|null>(null);
  const [recipSearch, setRecipSearch] = useState('');
  const [showRecipSearch, setShowRecipSearch] = useState(false);
  const [recipResults, setRecipResults] = useState<any[]>([]);
  const [recipSearching, setRecipSearching] = useState(false);
  const [undoQueue, setUndoQueue] = useState<{id:string;name:string;timer:any}|null>(null);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [tagInput, setTagInput] = useState<Record<string,string>>({});
  const [draft, setDraft] = useState<any>(null);
  // QOL state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date'|'name'|'sent'>('date');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [toasts, setToasts] = useState<{id:number;msg:string;ok:boolean}[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string|null>(null);
  const [editingNoteVal, setEditingNoteVal] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const d = dark;

  // ── GLASS THEME ──────────────────────────────────────────────────────
  const C = {
    bg:       d ? '#05080f'  : '#eef1f8',
    bgGrad:   d ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(43,127,255,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.07) 0%, transparent 60%), #05080f'
                : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(43,127,255,0.07) 0%, transparent 70%), #eef1f8',
    glass:    d ? 'rgba(13,20,40,0.7)'   : 'rgba(255,255,255,0.75)',
    glassSolid: d ? 'rgba(10,16,32,0.95)' : 'rgba(255,255,255,0.97)',
    glassHover: d ? 'rgba(16,25,50,0.85)' : 'rgba(255,255,255,0.95)',
    border:   d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    border2:  d ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.13)',
    borderFocus: 'rgba(43,127,255,0.6)',
    text:     d ? '#f0f4ff' : '#0f172a',
    muted:    d ? '#4a6080' : '#64748b',
    muted2:   d ? '#6a8090' : '#94a3b8',
    accent:   '#2b7fff',
    accentGlow: 'rgba(43,127,255,0.25)',
    green:    '#10b981',
    greenGlow:'rgba(16,185,129,0.2)',
    amber:    '#f59e0b',
    red:      '#ef4444',
    purple:   '#8b5cf6',
    cyan:     '#0ea5e9',
  };

  const glassCard: React.CSSProperties = {
    background: C.glass,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    boxShadow: d
      ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
  };

  const lbl: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:700,
    letterSpacing:'0.09em', textTransform:'uppercase',
    color:C.muted, marginBottom:7,
  };

  const inp: React.CSSProperties = {
    display:'block', width:'100%',
    border:`1px solid ${C.border2}`,
    borderRadius:10, padding:'10px 14px', fontSize:13,
    color:C.text, outline:'none', boxSizing:'border-box',
    background: d ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.8)',
    backdropFilter:'blur(8px)',
    fontFamily:'inherit', transition:'all 0.2s',
  };

  const btn: React.CSSProperties = {
    background: `linear-gradient(135deg, #2b7fff 0%, #1a5fd6 100%)`,
    color:'#fff', border:'none',
    borderRadius:10, padding:'10px 22px', fontSize:13,
    fontWeight:600, cursor:'pointer', letterSpacing:'0.01em',
    transition:'all 0.2s',
    boxShadow: '0 2px 12px rgba(43,127,255,0.35)',
  };

  const btnGhost: React.CSSProperties = {
    background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    color:C.muted2,
    border:`1px solid ${C.border2}`,
    borderRadius:10, padding:'9px 16px', fontSize:13,
    fontWeight:500, cursor:'pointer', transition:'all 0.2s',
    backdropFilter:'blur(8px)',
  };

  // ── DATA ─────────────────────────────────────────────────────────────
  const fetchCampaigns = async () => { try { const r = await fetch('/api/campaigns'); setCampaigns(await r.json()); setLastRefreshed(Date.now()); } catch {} };
  useEffect(() => { fetchCampaigns(); const t = setInterval(fetchCampaigns, 30000); return () => clearInterval(t); }, []);

  const goHome = () => { setView('list'); setStep(1); setError(''); };

  const toast = (msg:string, ok=true) => {
    const id = Date.now();
    setToasts(t=>[...t,{id,msg,ok}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3000);
  };

  const saveTags = (t: Record<string,string[]>) => { setTags(t); localStorage.setItem('ae_tags',JSON.stringify(t)); };
  const saveArchived = (a: string[]) => { setArchivedIds(a); localStorage.setItem('ae_archived',JSON.stringify(a)); };
  const saveTemplates = (t: typeof templates) => { setTemplates(t); localStorage.setItem('ae_templates',JSON.stringify(t)); };
  const saveUnsub = (u: string[]) => { setUnsubList(u); localStorage.setItem('ae_unsub',JSON.stringify(u)); };

  const archiveCampaign = (id:string) => { saveArchived([...archivedIds,id]); toast('Campaign archived'); };
  const unarchiveCampaign = (id:string) => { saveArchived(archivedIds.filter(x=>x!==id)); };

  const addTag = (campaignId:string, tag:string) => {
    if (!tag.trim()) return;
    const t = {...tags, [campaignId]:[...(tags[campaignId]||[]).filter(x=>x!==tag.trim()), tag.trim()]};
    saveTags(t); setTagInput(p=>({...p,[campaignId]:''}));
  };
  const removeTag = (campaignId:string, tag:string) => {
    saveTags({...tags,[campaignId]:(tags[campaignId]||[]).filter(x=>x!==tag)});
  };

  const saveTemplate = () => {
    if (!variants[activeVariant].subject||!variants[activeVariant].body) { toast('Fill subject and body first',false); return; }
    const tname = prompt('Template name?'); if (!tname) return;
    saveTemplates([...templates,{id:Date.now().toString(),name:tname,subject:variants[activeVariant].subject,body:variants[activeVariant].body}]);
    toast('Template saved');
  };
  const loadTemplate = (t:{subject:string;body:string}) => {
    updateVariant(activeVariant,'subject',t.subject);
    updateVariant(activeVariant,'body',t.body);
    setShowTemplates(false); toast('Template loaded');
  };
  const deleteTemplate = (id:string) => saveTemplates(templates.filter(t=>t.id!==id));

  const fetchSent = async (campaignId:string) => {
    if (openSent===campaignId) { setOpenSent(null); return; }
    const res = await fetch(`/api/recipients?campaign_id=${campaignId}&status=sent`);
    const data = await res.json(); setSentMap(prev=>({...prev,[campaignId]:data||[]}));
    setOpenSent(campaignId);
  };

  const searchAllRecipients = async () => {
    if (!recipSearch.trim()) return;
    setRecipSearching(true);
    const results: any[] = [];
    for (const c of campaigns) {
      const res = await fetch(`/api/recipients?campaign_id=${c.id}`);
      const data = await res.json()||[];
      data.filter((r:any)=>r.email.includes(recipSearch)||((r.name||'').toLowerCase().includes(recipSearch.toLowerCase())))
        .forEach((r:any)=>results.push({...r,campaignName:c.name,campaignId:c.id}));
    }
    setRecipResults(results); setRecipSearching(false);
  };

  const exportSentCSV = async (c: Campaign) => {
    const res = await fetch(`/api/recipients?campaign_id=${c.id}&status=sent`);
    const data = await res.json()||[];
    if (!data.length) { toast('No sent recipients yet',false); return; }
    const rows = [['email','name','sent_at'],...data.map((r:any)=>[r.email,r.name||'',r.sent_at||''])];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download=`${c.name}_sent.csv`; a.click(); toast('CSV downloaded');
  };

  const saveDraftToStorage = () => {
    const d2={name,fromName,notes,recipients,variants,scheduledAt,windowStart,windowEnd,dailyLimit,step};
    localStorage.setItem('ae_draft',JSON.stringify(d2)); toast('Draft saved');
  };
  const loadDraftFromStorage = () => {
    try {
      const d2=JSON.parse(localStorage.getItem('ae_draft')||'null'); if(!d2)return;
      setName(d2.name||''); setFromName(d2.fromName||''); setNotes(d2.notes||'');
      setVariants(d2.variants||[{subject:'',body:''},{subject:'',body:''}]);
      setScheduledAt(d2.scheduledAt||''); setWindowStart(d2.windowStart||'20:00');
      setWindowEnd(d2.windowEnd||'01:00'); setDailyLimit(d2.dailyLimit||40);
      setStep(d2.step||1); toast('Draft loaded');
    } catch {}
  };

  const softDelete = (id:string, name2:string) => {
    if (undoQueue) { clearTimeout(undoQueue.timer); fetch(`/api/campaigns?id=${undoQueue.id}`,{method:'DELETE'}); }
    const timer = setTimeout(()=>{ fetch(`/api/campaigns?id=${id}`,{method:'DELETE'}); fetchCampaigns(); setUndoQueue(null); },5000);
    setUndoQueue({id,name:name2,timer});
    setCampaigns(p=>p.filter(c=>c.id!==id));
    toast(`"${name2}" deleted — undo?`);
  };
  const undoDelete = () => {
    if (!undoQueue) return;
    clearTimeout(undoQueue.timer); setUndoQueue(null); fetchCampaigns(); toast('Deletion undone');
  };

  // Keyboard shortcuts
  useEffect(()=>{
    const handler = (e:KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement) return;
      if (e.key==='n'||e.key==='N') { setView('create'); setStep(1); }
      if (e.key==='Escape') goHome();
      if (e.key==='/') { setView('list'); setTimeout(()=>document.querySelector<HTMLInputElement>('input[placeholder="Search campaigns…"]')?.focus(),50); e.preventDefault(); }
      if (e.key==='?') setShowHotkeys(p=>!p);
    };
    window.addEventListener('keydown',handler);
    return ()=>window.removeEventListener('keydown',handler);
  },[]);

  const handleCSV = (file: File) => {
    setCsvError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/"/g,''));
      if (!headers.includes('email')) { setCsvError('CSV must have an "email" column'); return; }
      const all = lines.slice(1).map(line => {
        const vals = line.split(',').map(v=>v.trim().replace(/"/g,''));
        const obj: Recipient = {email:''};
        headers.forEach((h,i)=>{ obj[h]=vals[i]||''; });
        return obj;
      }).filter(r=>r.email);
      const safe = all.filter(r => !safeFilter || !r.is_safe_to_send || r.is_safe_to_send==='true' || r.is_safe_to_send==='1');
      setFilteredCount(all.length - safe.length);
      setRecipients(safe);
    };
    reader.readAsText(file);
  };

  const insertTag = (tag: string) => {
    const ta = bodyRef.current; if (!ta) return;
    const s = ta.selectionStart, e2 = ta.selectionEnd;
    updateVariant(activeVariant,'body', variants[activeVariant].body.slice(0,s)+tag+variants[activeVariant].body.slice(e2));
    setTimeout(()=>{ ta.selectionStart=ta.selectionEnd=s+tag.length; ta.focus(); },0);
  };

  const updateVariant = (idx:number, field:'subject'|'body', val:string) =>
    setVariants(v=>v.map((x,i)=>i===idx?{...x,[field]:val}:x));

  const preview = (text:string, r?:Recipient) => {
    if (!r) return text;
    return text
      .replace(/{{first_name}}/gi, r.first_name||(r.name||r.business_name||'there').split(' ')[0])
      .replace(/{{name}}/gi, r.name||r.business_name||'')
      .replace(/{{business_name}}/gi, r.business_name||r.name||'')
      .replace(/{{company}}/gi, r.name||r.business_name||'')
      .replace(/{{city}}/gi, r.city||'')
      .replace(/{{state}}/gi, r.state||'')
      .replace(/{{email}}/gi, r.email||'')
      .replace(/{{phone}}/gi, r.phone||'')
      .replace(/{{website}}/gi, r.website||'')
      .replace(/{{rating}}/gi, r.rating||'');
  };

  const handleSubmit = async () => {
    setError('');
    if (!name||!fromName||!scheduledAt) { setError('Fill name, from name and schedule time'); return; }
    if (scheduledAt && new Date(scheduledAt) < new Date()) { setError('Scheduled time is in the past'); return; }
    if (campaigns.some(c=>c.name.toLowerCase()===name.toLowerCase())) { if (!confirm(`A campaign named "${name}" already exists. Continue?`)) return; }
    const [sh2,sm2]=windowStart.split(':').map(Number); const [eh2,em2]=windowEnd.split(':').map(Number);
    const wm2=(eh2*60+em2)>(sh2*60+sm2)?(eh2*60+em2)-(sh2*60+sm2):(24*60-sh2*60-sm2)+eh2*60+em2;
    if (dailyLimit > Math.floor(wm2/5)) { if (!confirm('Daily limit exceeds window capacity. Continue anyway?')) return; }
    if (!recipients.length) { setError('Upload a CSV first'); return; }
    if (!variants[0].subject||!variants[0].body) { setError('Fill subject and body'); return; }
    const recs = recipients.map((r,i) => {
      const isB = abEnabled && variants[1].subject && i >= Math.floor(recipients.length/2);
      return { email:r.email, name:r.first_name||r.name||r.business_name||'',
        subject_override: isB?variants[1].subject:null,
        body_override: isB?variants[1].body:null, metadata:JSON.stringify(r) };
    });
    setSubmitting(true);
    const res = await fetch('/api/campaigns', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, from_name:fromName, subject:variants[0].subject, body:variants[0].body,
        scheduled_at:new Date(scheduledAt).toISOString(), delay_seconds:delaySeconds, notes,
        window_start:windowStart, window_end:windowEnd, daily_limit:dailyLimit,
        total_count:recipients.length, recipients:recs }) });
    setSubmitting(false);
    if (res.ok) {
      goHome(); setName(''); setFromName(''); setNotes('');
      setRecipients([]); setVariants([{subject:'',body:''},{subject:'',body:''}]); setScheduledAt('');
      fetchCampaigns();
    } else { const d2=await res.json(); setError(d2.error||'Error'); }
  };

  const openEdit = (c: any) => {
    setEditingId(c.id); setEditSubject(c.subject); setEditBody(c.body||''); setEditFromName(c.from_name||'');
    const local = new Date(c.scheduled_at); const offset = local.getTimezoneOffset();
    setEditScheduledAt(new Date(local.getTime()-offset*60000).toISOString().slice(0,16));
  };

  const saveEdit = async () => {
    if (!editingId) return; setEditSaving(true);
    await fetch('/api/campaigns', { method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id:editingId, subject:editSubject, body:editBody,
        from_name:editFromName, scheduled_at:new Date(editScheduledAt).toISOString() }) });
    setEditSaving(false); setEditingId(null); fetchCampaigns();
  };

  const fetchFailed = async (campaignId: string) => {
    if (openErrors===campaignId) { setOpenErrors(null); return; }
    const res = await fetch(`/api/recipients?campaign_id=${campaignId}&status=failed`);
    const data = await res.json();
    setFailedMap(prev=>({...prev,[campaignId]:data||[]}));
    setOpenErrors(campaignId);
  };

  const pauseResume = async (c: Campaign) => {
    if (c.status==='in_progress' && !confirm('Pause this active campaign?')) return;
    const newStatus = c.status==='paused'?'scheduled':'paused';
    await fetch('/api/campaigns',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:c.id,status:newStatus})});
    fetchCampaigns();
  };

  const openDuplicate = (c: Campaign) => {
    setDupSource(c); setDupName('Copy of '+c.name);
    setDupSubject((c as any).subject||''); setDupBody((c as any).body||''); setDupFromName((c as any).from_name||'');
    const local = new Date(c.scheduled_at); const offset = local.getTimezoneOffset();
    setDupScheduledAt(new Date(local.getTime()-offset*60000).toISOString().slice(0,16));
  };

  const saveDuplicate = async () => {
    if (!dupSource) return; setDupSaving(true);
    await fetch('/api/campaigns',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'duplicate',parent_campaign_id:dupSource.id,
        name:dupName,subject:dupSubject,body:dupBody,from_name:dupFromName,
        scheduled_at:new Date(dupScheduledAt).toISOString()})});
    setDupSaving(false); setDupSource(null); fetchCampaigns();
  };

  const deleteCampaign = (id:string, cname:string) => softDelete(id, cname);
  const bulkDelete = async () => {
    if (!selectedIds.length||!confirm(`Delete ${selectedIds.length} campaigns?`)) return;
    await Promise.all(selectedIds.map(id=>fetch(`/api/campaigns?id=${id}`,{method:'DELETE'})));
    setSelectedIds([]); fetchCampaigns(); toast(`Deleted ${selectedIds.length} campaigns`);
  };

  const saveNote = async (id:string) => {
    await fetch('/api/campaigns',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,notes:editingNoteVal})});
    setEditingNoteId(null); fetchCampaigns(); toast('Note saved');
  };

  const sendNow = async (c:Campaign) => {
    if (!confirm('Send this campaign now?')) return;
    await fetch('/api/campaigns',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:c.id,scheduled_at:new Date().toISOString()})});
    fetchCampaigns(); toast('Campaign will send on next cron tick');
  };

  const openFollowUp = async (c:Campaign) => {
    setFuCampaign(c); setFuSearch(''); setFuSubject('Re: '+c.subject); setFuBody(''); setFuSchedule('');
    const res = await fetch(`/api/recipients?campaign_id=${c.id}`);
    setFuRecs((await res.json()||[]).map((r:any)=>({...r,selected:true})));
    setView('followup');
  };

  const sendFollowUp = async () => {
    const sel = fuRecs.filter(r=>r.selected);
    if (!sel.length||!fuSubject||!fuBody||!fuSchedule) return;
    setFuSubmitting(true);
    await fetch('/api/campaigns',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:fuCampaign?.name+' — Follow Up',from_name:fromName||'Follow Up',
        subject:fuSubject,body:fuBody,scheduled_at:new Date(fuSchedule).toISOString(),
        delay_seconds:delaySeconds,window_start:windowStart,window_end:windowEnd,
        parent_campaign_id:fuCampaign?.id,total_count:sel.length,daily_limit:dailyLimit,
        recipients:sel.map(r=>({email:r.email,name:r.name}))})});
    setFuSubmitting(false); setView('list'); fetchCampaigns();
  };

  const sendTest = async () => {
    if (!testEmail||!testSubject||!testBody) { setTestResult('Fill all fields'); return; }
    setTestSending(true); setTestResult('');
    const res = await fetch('/api/test-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:testEmail,subject:testSubject,body:testBody})});
    setTestSending(false); setTestResult(res.ok?'✓ Sent successfully':'✕ Failed to send');
  };

  // ── SUBCOMPONENTS ────────────────────────────────────────────────────
  const StatusBadge = ({status}: {status:string}) => {
    const m = STATUS_META[status] || STATUS_META.draft;
    const isPulsing = status==='sending'||status==='in_progress';
    return (
      <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'3px 10px',
        borderRadius:6, background:m.bg, border:`1px solid ${m.glow}`,
        fontSize:10,fontWeight:700,letterSpacing:'0.1em',color:m.text,
        fontFamily:'DM Mono,monospace',
        boxShadow: isPulsing ? `0 0 10px ${m.glow}` : undefined}}>
        <span style={{width:5,height:5,borderRadius:'50%',background:m.dot,flexShrink:0,
          boxShadow: isPulsing ? `0 0 6px ${m.dot}` : undefined}}/>
        {m.label}
      </span>
    );
  };

  const ProgressBar = ({c}: {c:Campaign}) => {
    if (!(c.total_count&&c.total_count>0)) return null;
    if (!['in_progress','sending','done'].includes(c.status)) return null;
    const pct = Math.round(((c.sent_count||0)/(c.total_count||1))*100);
    const color = c.status==='done'?C.green:C.accent;
    return (
      <div style={{marginTop:12}}>
        <div style={{height:3,borderRadius:99,
          background: d?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.08)',
          overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:99,
            background:`linear-gradient(90deg, ${color}, ${color}cc)`,
            width:`${pct}%`,transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: c.status!=='done'?`0 0 8px ${color}88`:undefined}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
          <span style={{fontSize:11,color:C.muted,fontFamily:'DM Mono,monospace'}}>{c.sent_count||0} / {c.total_count}</span>
          <span style={{fontSize:11,color,fontWeight:600,fontFamily:'DM Mono,monospace'}}>{pct}%</span>
        </div>
      </div>
    );
  };

  const Panel = ({title,accent,children,tint}: {title:string;accent:string;children:React.ReactNode;tint:string}) => (
    <div style={{borderTop:`1px solid ${C.border}`,padding:'20px 20px',
      background:tint,backdropFilter:'blur(12px)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18}}>
        <div style={{width:3,height:16,borderRadius:2,
          background:accent,boxShadow:`0 0 8px ${accent}88`,flexShrink:0}}/>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',
          textTransform:'uppercase',color:accent,fontFamily:'DM Mono,monospace'}}>{title}</span>
      </div>
      {children}
    </div>
  );

  const Divider = () => (
    <div style={{height:1,background:`linear-gradient(90deg, transparent, ${C.border2}, transparent)`,margin:'4px 0'}}/>
  );

  return (
    <div style={{fontFamily:'"DM Sans",system-ui,sans-serif',minHeight:'100vh',
      background:C.bgGrad,color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,textarea,select{font-family:inherit;color-scheme:${d?'dark':'light'};}
        input[type=range]{accent-color:#2b7fff;}
        input:focus,textarea:focus{
          border-color:rgba(43,127,255,0.6)!important;
          box-shadow:0 0 0 3px rgba(43,127,255,0.15),0 0 16px rgba(43,127,255,0.08)!important;
          outline:none!important;
          background:${d?'rgba(0,0,0,0.5)':'rgba(255,255,255,0.95)'}!important;
        }
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px;}
        .gbtn:hover{opacity:0.82;transform:translateY(-1px);}
        .gbtn:active{transform:translateY(0px);}
        .grow:hover{background:${d?'rgba(43,127,255,0.05)':'rgba(43,127,255,0.03)'}!important;}
        .gcard:hover{
          border-color:${d?'rgba(255,255,255,0.14)':'rgba(0,0,0,0.14)'}!important;
          box-shadow:${d?'0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)':'0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)'}!important;
          transform:translateY(-1px);
        }
        .gcard{transition:all 0.2s cubic-bezier(0.4,0,0.2,1);}
        .logo-btn:hover{opacity:0.8;}
        .logo-btn:active{opacity:0.6;}
        .tag-btn:hover{
          background:rgba(43,127,255,0.15)!important;
          border-color:rgba(43,127,255,0.4)!important;
          color:#93c5fd!important;
        }
        .nav-tab:hover{color:${d?'#93c5fd':'#2b7fff'};}
        h2,h3{margin:0;}
        @keyframes pulse-dot {
          0%,100%{opacity:1;transform:scale(1);}
          50%{opacity:0.6;transform:scale(0.85);}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        background: d?'rgba(5,8,15,0.8)':'rgba(255,255,255,0.8)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        borderBottom:`1px solid ${C.border}`,
        padding:'0 32px', display:'flex', alignItems:'center', height:52,
        position:'sticky', top:0, zIndex:100,
        boxShadow: d?'0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)':'0 1px 0 rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)',
      }}>
        {/* CLICKABLE LOGO → home */}
        <button onClick={goHome} className="logo-btn"
          style={{display:'flex',alignItems:'center',gap:10,marginRight:40,
            background:'none',border:'none',cursor:'pointer',padding:0,transition:'opacity 0.15s'}}>
          <div style={{
            width:28,height:28,borderRadius:8,
            background:'linear-gradient(135deg,#3b8fff 0%,#1a4fd6 100%)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,
            boxShadow:'0 2px 12px rgba(43,127,255,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}>✉</div>
          <span style={{fontWeight:700,fontSize:15,letterSpacing:'-0.025em',color:C.text}}>AutoEmail</span>
        </button>

        {/* NAV TABS */}
        <div style={{display:'flex',gap:2,flex:1}}>
          {([['list','Campaigns'],['create','New Campaign'],['test','Test Email']] as const).map(([v,label])=>(
            <button key={v} onClick={()=>{setView(v);setStep(1);setError('');}}
              className="nav-tab gbtn"
              style={{padding:'5px 14px',borderRadius:8,border:'none',cursor:'pointer',
                fontSize:13,fontWeight:500,transition:'all 0.15s',
                color: view===v ? C.accent : C.muted,
                background: view===v
                  ? d?'rgba(43,127,255,0.12)':'rgba(43,127,255,0.08)'
                  : 'transparent',
                boxShadow: view===v ? 'inset 0 0 0 1px rgba(43,127,255,0.2)' : undefined,
              } as React.CSSProperties}>
              {label}
            </button>
          ))}
        </div>

        {/* RIGHT */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{fontSize:10,fontFamily:'DM Mono,monospace',color:C.muted,
            background:d?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)',
            padding:'3px 9px',borderRadius:6,
            border:`1px solid ${C.border}`,letterSpacing:'0.07em',cursor:'pointer'}}
            onClick={fetchCampaigns} title="Click to refresh">
            {Math.floor((Date.now()-lastRefreshed)/1000)<5?'✓ LIVE':
             `↻ ${Math.floor((Date.now()-lastRefreshed)/1000)}s ago`}
          </div>
          <button onClick={()=>setDark(!d)} className="gbtn"
            style={{...btnGhost,padding:'5px 12px',fontSize:12,borderRadius:8}}>
            {d?'☀ Light':'☽ Dark'}
          </button>
        </div>
      </nav>

      <div style={{maxWidth:940,margin:'0 auto',padding:'32px 22px'}}>

        {/* ── STATS ── */}
        {view==='list'&&(()=>{
          const totalSent = campaigns.reduce((s,c)=>s+(c.sent_count||0),0);
          const active = campaigns.filter(c=>['in_progress','scheduled','sending'].includes(c.status)).length;
          const done = campaigns.filter(c=>c.status==='done');
          const totalRecips = done.reduce((s,c)=>s+(c.total_count||0),0);
          const successRate = totalRecips>0?Math.round((done.reduce((s,c)=>s+(c.sent_count||0),0)/totalRecips)*100):0;
          const statItems = [
            {label:'Emails Sent',    value:totalSent.toLocaleString(), color:'#60a5fa', glow:'rgba(59,130,246,0.2)'},
            {label:'Active',         value:String(active),             color:'#fcd34d', glow:'rgba(245,158,11,0.2)'},
            {label:'Success Rate',   value:totalRecips>0?`${successRate}%`:'—', color:'#6ee7b7', glow:'rgba(16,185,129,0.2)'},
            {label:'Total Campaigns',value:String(campaigns.length),   color:C.muted2,  glow:'transparent'},
          ];
          const totalFailed = campaigns.reduce((s,c)=>s+((c as any).failed_count||0),0);
          const bounceRate = totalSent>0?Math.round((totalFailed/totalSent)*100):0;
          const todaySent = campaigns.filter(c=>['in_progress','sending'].includes(c.status)).reduce((s,c)=>s+(c.sent_count||0),0);
          const allStats = [
            ...statItems,
            {label:'Bounce Rate', value:totalSent>0?`${bounceRate}%`:'—', color:'#fca5a5', glow:'rgba(239,68,68,0.15)'},
            {label:'Est. Today',  value:String(todaySent), color:'#c4b5fd', glow:'rgba(139,92,246,0.15)'},
          ];
          const _unused = [
          ];
          return (
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:28}}>
              {allStats.map(s=>(
                <div key={s.label} style={{
                  ...glassCard, padding:'16px 18px',
                  boxShadow:`0 4px 20px rgba(0,0,0,${d?0.4:0.06}), inset 0 1px 0 rgba(255,255,255,${d?0.06:0.8})`,
                }}>
                  <div style={{fontSize:26,fontWeight:700,
                    fontFamily:'DM Mono,monospace',color:s.color,
                    letterSpacing:'-0.04em',lineHeight:1,marginBottom:6,
                    textShadow:`0 0 20px ${s.glow}`}}>
                    {s.value}
                  </div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',
                    textTransform:'uppercase',color:C.muted}}>{s.label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── CAMPAIGN LIST ── */}
        {view==='list'&&(
          <div>
            {/* RECIPIENT SEARCH */}
            {showRecipSearch&&(
              <div style={{...glassCard,padding:16,marginBottom:12}}>
                <div style={{display:'flex',gap:8,marginBottom:10}}>
                  <input value={recipSearch} onChange={e=>setRecipSearch(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&searchAllRecipients()}
                    placeholder="Search by email or name across all campaigns…"
                    style={{...inp,flex:1,padding:'7px 12px',fontSize:12}} autoFocus/>
                  <button onClick={searchAllRecipients} style={btn} className="gbtn"
                    disabled={recipSearching}>{recipSearching?'…':'Search'}</button>
                </div>
                {recipResults.length>0&&(
                  <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',maxHeight:200,overflowY:'auto'}}>
                    <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
                      <thead><tr style={{background:d?'rgba(0,0,0,0.4)':'rgba(0,0,0,0.04)'}}>
                        {['Email','Name','Campaign','Status'].map(h=><th key={h} style={{padding:'7px 12px',textAlign:'left',fontSize:10,fontWeight:700,letterSpacing:'0.08em',color:C.muted,textTransform:'uppercase'}}>{h}</th>)}
                      </tr></thead>
                      <tbody>{recipResults.map((r,i)=>(
                        <tr key={i} style={{borderTop:`1px solid ${C.border}`}} className="grow">
                          <td style={{padding:'7px 12px',fontFamily:'DM Mono,monospace'}}>{r.email}</td>
                          <td style={{padding:'7px 12px',color:C.muted}}>{r.name||'—'}</td>
                          <td style={{padding:'7px 12px',color:C.muted,fontSize:11}}>{r.campaignName}</td>
                          <td style={{padding:'7px 12px'}}><StatusBadge status={r.status||'draft'}/></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                {recipResults.length===0&&recipSearch&&!recipSearching&&(
                  <div style={{fontSize:12,color:C.muted,fontFamily:'DM Mono,monospace'}}>No results found.</div>
                )}
              </div>
            )}

            {/* SEARCH + FILTER + SORT */}
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search campaigns…"
                style={{...inp,flex:1,minWidth:180,padding:'7px 12px',fontSize:12}}/>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                style={{...inp,width:'auto',padding:'7px 12px',fontSize:12,cursor:'pointer'}}>
                {['all','scheduled','in_progress','paused','done','failed'].map(v=>(
                  <option key={v} value={v}>{v==='all'?'All Status':v.replace('_',' ')}</option>
                ))}
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
                style={{...inp,width:'auto',padding:'7px 12px',fontSize:12,cursor:'pointer'}}>
                <option value="date">Sort: Date</option>
                <option value="name">Sort: Name</option>
                <option value="sent">Sort: Sent</option>
              </select>
              <button onClick={()=>setShowRecipSearch(p=>!p)} className="gbtn"
                style={{...btnGhost,fontSize:11,padding:'6px 12px',
                  color:showRecipSearch?C.accent:C.muted,
                  borderColor:showRecipSearch?'rgba(43,127,255,0.4)':C.border2}}>
                🔍 Recipients
              </button>
              <button onClick={()=>setShowArchived(p=>!p)} className="gbtn"
                style={{...btnGhost,fontSize:11,padding:'6px 12px',
                  color:showArchived?'#c4b5fd':C.muted,
                  borderColor:showArchived?'rgba(139,92,246,0.4)':C.border2}}>
                {showArchived?'Hide Archived':'Archived'}
                {archivedIds.length>0&&<span style={{marginLeft:5,fontFamily:'DM Mono,monospace',fontSize:10,opacity:0.7}}>{archivedIds.length}</span>}
              </button>
              <button onClick={()=>setShowUnsub(p=>!p)} className="gbtn"
                style={{...btnGhost,fontSize:11,padding:'6px 12px',
                  color:showUnsub?'#fca5a5':C.muted,
                  borderColor:showUnsub?'rgba(239,68,68,0.35)':C.border2}}>
                Unsub {unsubList.length>0&&`(${unsubList.length})`}
              </button>
              {selectedIds.length>0&&(
                <button onClick={bulkDelete} className="gbtn"
                  style={{...btnGhost,fontSize:11,padding:'6px 12px',color:'#fca5a5',borderColor:'rgba(239,68,68,0.35)',background:'rgba(239,68,68,0.08)'}}>
                  Delete {selectedIds.length}
                </button>
              )}
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <span style={{fontSize:13,color:C.muted,fontWeight:500}}>
                {campaigns.length} campaign{campaigns.length!==1?'s':''}
              </span>
              <button onClick={()=>{setView('create');setStep(1);}} style={btn} className="gbtn">
                + New Campaign
              </button>
            </div>

            {/* UNSUB PANEL */}
            {showUnsub&&(
              <div style={{...glassCard,padding:16,marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#fca5a5',marginBottom:10,fontFamily:'DM Mono,monospace'}}>GLOBAL UNSUBSCRIBE LIST</div>
                <div style={{display:'flex',gap:8,marginBottom:10}}>
                  <input value={unsubInput} onChange={e=>setUnsubInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&unsubInput.trim()){saveUnsub([...unsubList,unsubInput.trim()]);setUnsubInput('');toast('Added to unsub list');}}}
                    placeholder="email@example.com — press Enter to add"
                    style={{...inp,flex:1,padding:'7px 12px',fontSize:12}}/>
                </div>
                {unsubList.length>0&&(
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {unsubList.map(e=>(
                      <span key={e} style={{fontSize:11,padding:'3px 9px',borderRadius:5,
                        background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',
                        color:'#fca5a5',fontFamily:'DM Mono,monospace',display:'flex',alignItems:'center',gap:5}}>
                        {e}
                        <span onClick={()=>saveUnsub(unsubList.filter(x=>x!==e))} style={{cursor:'pointer',opacity:0.6}}>×</span>
                      </span>
                    ))}
                  </div>
                )}
                {!unsubList.length&&<div style={{fontSize:12,color:C.muted,fontFamily:'DM Mono,monospace'}}>No emails blocked yet.</div>}
              </div>
            )}

            {campaigns.length===0&&(
              <div style={{...glassCard,padding:64,textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:12,opacity:0.15,filter:'blur(0.5px)'}}>✉</div>
                <div style={{fontSize:14,color:C.muted,fontWeight:500}}>No campaigns yet</div>
                <div style={{fontSize:12,color:C.muted,marginTop:5,opacity:0.6}}>
                  Create your first campaign to get started
                </div>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {campaigns
                .filter(c=>showArchived?archivedIds.includes(c.id):!archivedIds.includes(c.id))
                .filter(c=>(statusFilter==='all'||c.status===statusFilter)&&
                  (search===''||c.name.toLowerCase().includes(search.toLowerCase())||c.subject.toLowerCase().includes(search.toLowerCase())))
                .sort((a,b)=>sortBy==='name'?a.name.localeCompare(b.name):
                  sortBy==='sent'?(b.sent_count||0)-(a.sent_count||0):
                  new Date(b.scheduled_at).getTime()-new Date(a.scheduled_at).getTime())
                .map(c=>(
                <div key={c.id} style={{...glassCard,overflow:'hidden'}} className="gcard">
                  <div style={{padding:'16px 20px'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                      {/* LEFT */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:5,flexWrap:'wrap'}}>
                          <input type="checkbox" checked={selectedIds.includes(c.id)}
                            onChange={e=>setSelectedIds(p=>e.target.checked?[...p,c.id]:p.filter(x=>x!==c.id))}
                            onClick={e=>e.stopPropagation()} style={{accentColor:C.accent,width:13,height:13}}/>
                          <span style={{fontWeight:700,fontSize:14,letterSpacing:'-0.015em',color:C.text}}>{c.name}</span>
                          <StatusBadge status={c.status}/>
                          {(c as any).failed_count>0&&(
                            <span style={{fontSize:10,fontFamily:'DM Mono,monospace',fontWeight:700,
                              color:'#fca5a5',background:'rgba(239,68,68,0.15)',
                              border:'1px solid rgba(239,68,68,0.3)',
                              padding:'1px 6px',borderRadius:4}}>
                              {(c as any).failed_count} failed
                            </span>
                          )}
                        </div>
                        <div style={{fontSize:12,color:C.muted,fontFamily:'DM Mono,monospace',
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                          maxWidth:460,marginBottom:7,opacity:0.85}}>
                          {c.subject}
                        </div>
                        <div style={{display:'flex',gap:14,fontSize:11,color:C.muted,flexWrap:'wrap',alignItems:'center'}}>
                          <span style={{fontFamily:'DM Mono,monospace',
                            background:d?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)',
                            padding:'2px 7px',borderRadius:4,border:`1px solid ${C.border}`}}>
                            {c.recipients?.[0]?.count??0} recipients
                          </span>
                          <span style={{opacity:0.4}}>·</span>
                          <span>{new Date(c.scheduled_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} IST</span>
                          {(c as any).from_name&&<>
                            <span style={{opacity:0.4}}>·</span>
                            <span style={{fontFamily:'DM Mono,monospace',fontSize:10,opacity:0.7}}>from: {(c as any).from_name}</span>
                          </>}
                          {c.status==='in_progress'&&c.total_count&&c.sent_count!==undefined&&(()=>{
                            const remaining=(c.total_count||0)-(c.sent_count||0);
                            return remaining>0?<><span style={{opacity:0.4}}>·</span><span style={{color:C.amber,fontSize:11}}>~{remaining} left</span></>:null;
                          })()}
                          {c.notes&&<>
                            <span style={{opacity:0.4}}>·</span>
                            <span style={{fontStyle:'italic',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',opacity:0.75}}
                              onDoubleClick={e=>{e.stopPropagation();setEditingNoteId(c.id);setEditingNoteVal(c.notes||'');}}>
                              {editingNoteId===c.id
                                ?<input autoFocus value={editingNoteVal} onChange={e=>setEditingNoteVal(e.target.value)}
                                  onBlur={()=>saveNote(c.id)} onKeyDown={e=>e.key==='Enter'&&saveNote(c.id)}
                                  style={{...inp,display:'inline',width:160,padding:'1px 6px',fontSize:11}} onClick={e=>e.stopPropagation()}/>
                                :c.notes}
                            </span>
                          </>}
                        </div>
                        {/* TAGS */}
                        <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:8,alignItems:'center'}}>
                          {(tags[c.id]||[]).map(tag=>(
                            <span key={tag} style={{fontSize:10,padding:'2px 8px',borderRadius:4,
                              background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.25)',
                              color:'#c4b5fd',fontFamily:'DM Mono,monospace',display:'flex',alignItems:'center',gap:4}}>
                              {tag}
                              <span onClick={()=>removeTag(c.id,tag)} style={{cursor:'pointer',opacity:0.6,fontSize:11}}>×</span>
                            </span>
                          ))}
                          <input value={tagInput[c.id]||''} onChange={e=>setTagInput(p=>({...p,[c.id]:e.target.value}))}
                            onKeyDown={e=>e.key==='Enter'&&addTag(c.id,tagInput[c.id]||'')}
                            placeholder="+ tag" style={{fontSize:10,padding:'2px 7px',borderRadius:4,
                              border:`1px solid ${C.border}`,background:'transparent',color:C.muted,
                              width:50,outline:'none',fontFamily:'DM Mono,monospace'}}/>
                        </div>
                        <ProgressBar c={c}/>
                      </div>

                      {/* RIGHT — ACTIONS */}
                      <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
                        {c.status==='done'&&(
                          <button onClick={()=>openFollowUp(c)} className="gbtn"
                            style={{...btnGhost,fontSize:11,padding:'5px 11px',
                              color:'#c4b5fd',borderColor:'rgba(139,92,246,0.35)',
                              background:'rgba(139,92,246,0.08)'}}>
                            Follow Up
                          </button>
                        )}
                        {c.status==='scheduled'&&(
                          <button onClick={()=>sendNow(c)} className="gbtn"
                            style={{...btnGhost,fontSize:11,padding:'5px 11px',
                              color:'#fcd34d',borderColor:'rgba(245,158,11,0.35)',
                              background:'rgba(245,158,11,0.08)'}}>
                            ▶ Now
                          </button>
                        )}
                        {c.status==='scheduled'&&(
                          <button onClick={()=>openEdit(c as any)} className="gbtn"
                            style={{...btnGhost,fontSize:11,padding:'5px 11px',
                              color:'#6ee7b7',borderColor:'rgba(16,185,129,0.35)',
                              background:'rgba(16,185,129,0.08)'}}>
                            Edit
                          </button>
                        )}
                        {['scheduled','in_progress','paused'].includes(c.status)&&(
                          <button onClick={()=>pauseResume(c)} className="gbtn"
                            style={{...btnGhost,fontSize:11,padding:'5px 11px',
                              color:c.status==='paused'?'#6ee7b7':'#fcd34d',
                              borderColor:c.status==='paused'?'rgba(16,185,129,0.35)':'rgba(245,158,11,0.35)',
                              background:c.status==='paused'?'rgba(16,185,129,0.08)':'rgba(245,158,11,0.08)'}}>
                            {c.status==='paused'?'▶ Resume':'⏸ Pause'}
                          </button>
                        )}
                        <button onClick={()=>fetchFailed(c.id)} className="gbtn"
                          style={{...btnGhost,fontSize:11,padding:'5px 11px',
                            color:openErrors===c.id?'#fca5a5':C.muted,
                            borderColor:openErrors===c.id?'rgba(239,68,68,0.4)':C.border2,
                            background:openErrors===c.id?'rgba(239,68,68,0.08)':'transparent'}}>
                          Errors
                        </button>
                        <button onClick={()=>openDuplicate(c)} className="gbtn"
                          style={{...btnGhost,fontSize:11,padding:'5px 11px'}}>
                          Clone
                        </button>
                        <button onClick={()=>fetchSent(c.id)} className="gbtn"
                          style={{...btnGhost,fontSize:11,padding:'5px 11px',
                            color:openSent===c.id?'#93c5fd':C.muted,
                            borderColor:openSent===c.id?'rgba(59,130,246,0.4)':C.border2,
                            background:openSent===c.id?'rgba(59,130,246,0.08)':'transparent'}}>
                          Sent
                        </button>
                        <button onClick={()=>exportSentCSV(c)} className="gbtn"
                          style={{...btnGhost,fontSize:11,padding:'5px 11px'}}>
                          ↓ CSV
                        </button>
                        {!archivedIds.includes(c.id)
                          ?<button onClick={()=>archiveCampaign(c.id)} className="gbtn"
                            style={{...btnGhost,fontSize:11,padding:'5px 11px'}}>Archive</button>
                          :<button onClick={()=>unarchiveCampaign(c.id)} className="gbtn"
                            style={{...btnGhost,fontSize:11,padding:'5px 11px',color:'#6ee7b7'}}>Unarchive</button>
                        }
                        <button onClick={()=>deleteCampaign(c.id, c.name)} className="gbtn"
                          style={{background:'none',border:'none',cursor:'pointer',
                            fontSize:20,color:C.muted,padding:'3px 6px',
                            lineHeight:1,opacity:0.4,transition:'opacity 0.15s'}}>
                          ×
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EDIT PANEL */}
                  {editingId===c.id&&(
                    <Panel title="Edit Campaign" accent={C.green}
                      tint={d?'rgba(16,185,129,0.04)':'rgba(16,185,129,0.02)'}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                        <div><label style={lbl}>From Name</label><input style={inp} value={editFromName} onChange={e=>setEditFromName(e.target.value)}/></div>
                        <div><label style={lbl}>Schedule Time</label><input type="datetime-local" style={inp} value={editScheduledAt} onChange={e=>setEditScheduledAt(e.target.value)}/></div>
                      </div>
                      <div style={{marginBottom:12}}><label style={lbl}>Subject</label><input style={inp} value={editSubject} onChange={e=>setEditSubject(e.target.value)}/></div>
                      <div style={{marginBottom:16}}><label style={lbl}>Body</label><textarea style={{...inp,height:110,resize:'vertical'}} value={editBody} onChange={e=>setEditBody(e.target.value)}/></div>
                      <div style={{display:'flex',gap:8}}>
                        <button style={{...btn,background:editSaving?'rgba(255,255,255,0.1)':'linear-gradient(135deg,#10b981,#059669)',boxShadow:'0 2px 12px rgba(16,185,129,0.3)',padding:'8px 18px',fontSize:12}} disabled={editSaving} onClick={saveEdit} className="gbtn">{editSaving?'Saving…':'Save Changes'}</button>
                        <button style={{...btnGhost,padding:'8px 14px',fontSize:12}} onClick={()=>setEditingId(null)} className="gbtn">Cancel</button>
                      </div>
                    </Panel>
                  )}

                  {/* CLONE PANEL */}
                  {dupSource?.id===c.id&&(
                    <Panel title="Clone Campaign" accent={C.cyan}
                      tint={d?'rgba(14,165,233,0.04)':'rgba(14,165,233,0.02)'}>
                      <div style={{marginBottom:12}}><label style={lbl}>Campaign Name</label><input style={inp} value={dupName} onChange={e=>setDupName(e.target.value)}/></div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                        <div><label style={lbl}>From Name</label><input style={inp} value={dupFromName} onChange={e=>setDupFromName(e.target.value)}/></div>
                        <div><label style={lbl}>Schedule Time</label><input type="datetime-local" style={inp} value={dupScheduledAt} onChange={e=>setDupScheduledAt(e.target.value)}/></div>
                      </div>
                      <div style={{marginBottom:12}}><label style={lbl}>Subject</label><input style={inp} value={dupSubject} onChange={e=>setDupSubject(e.target.value)}/></div>
                      <div style={{marginBottom:16}}><label style={lbl}>Body</label><textarea style={{...inp,height:110,resize:'vertical'}} value={dupBody} onChange={e=>setDupBody(e.target.value)}/></div>
                      <div style={{display:'flex',gap:8}}>
                        <button style={{...btn,background:dupSaving?'rgba(255,255,255,0.1)':`linear-gradient(135deg,${C.cyan},#0284c7)`,boxShadow:`0 2px 12px rgba(14,165,233,0.3)`,padding:'8px 18px',fontSize:12}} disabled={dupSaving} onClick={saveDuplicate} className="gbtn">{dupSaving?'Creating…':'Create Clone'}</button>
                        <button style={{...btnGhost,padding:'8px 14px',fontSize:12}} onClick={()=>setDupSource(null)} className="gbtn">Cancel</button>
                      </div>
                    </Panel>
                  )}

                  {/* SENT PANEL */}
                  {openSent===c.id&&(
                    <Panel title={`Sent Recipients${sentMap[c.id]?.length?` · ${sentMap[c.id].length}`:''}`}
                      accent={C.accent} tint={d?'rgba(43,127,255,0.04)':'rgba(43,127,255,0.02)'}>
                      {!sentMap[c.id]?.length
                        ?<div style={{fontSize:12,color:C.muted,fontFamily:'DM Mono,monospace'}}>No sent recipients yet.</div>
                        :<div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',maxHeight:200,overflowY:'auto'}}>
                          <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
                            <thead><tr style={{background:d?'rgba(0,0,0,0.4)':'rgba(0,0,0,0.04)'}}>
                              {['Email','Name','Sent At'].map(h=><th key={h} style={{padding:'7px 12px',textAlign:'left',fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.muted}}>{h}</th>)}
                            </tr></thead>
                            <tbody>{sentMap[c.id].map((r:any,i:number)=>(
                              <tr key={i} style={{borderTop:`1px solid ${C.border}`}} className="grow">
                                <td style={{padding:'7px 12px',fontFamily:'DM Mono,monospace',fontSize:11}}>{r.email}</td>
                                <td style={{padding:'7px 12px',color:C.muted}}>{r.name||'—'}</td>
                                <td style={{padding:'7px 12px',color:C.muted,fontFamily:'DM Mono,monospace',fontSize:10}}>{r.sent_at?new Date(r.sent_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      }
                    </Panel>
                  )}

                  {/* ERRORS PANEL */}
                  {openErrors===c.id&&(
                    <Panel title={`Failed Recipients${failedMap[c.id]?.length?` · ${failedMap[c.id].length}`:''}`}
                      accent={C.red} tint={d?'rgba(239,68,68,0.04)':'rgba(239,68,68,0.02)'}>
                      {!failedMap[c.id]?.length
                        ? <div style={{fontSize:12,color:C.muted,padding:'4px 0',fontFamily:'DM Mono,monospace',opacity:0.8}}>No failed recipients. ✓</div>
                        : <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                            <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
                              <thead>
                                <tr style={{background:d?'rgba(0,0,0,0.4)':'rgba(0,0,0,0.04)'}}>
                                  {['Email','Error Message','Retried'].map(h=>(
                                    <th key={h} style={{padding:'8px 13px',textAlign:'left',fontSize:10,
                                      fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.muted}}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {failedMap[c.id].map((r:any,i:number)=>(
                                  <tr key={i} style={{borderTop:`1px solid ${C.border}`}} className="grow">
                                    <td style={{padding:'8px 13px',fontFamily:'DM Mono,monospace',color:C.text,fontSize:11}}>{r.email}</td>
                                    <td style={{padding:'8px 13px',color:'#fca5a5',maxWidth:280,fontSize:11}}>{r.error||'Unknown error'}</td>
                                    <td style={{padding:'8px 13px',color:C.muted,fontFamily:'DM Mono,monospace',fontSize:11}}>{r.retry_attempted?'YES':'—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                      }
                    </Panel>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CREATE WIZARD ── */}
        {view==='create'&&(
          <div>
            {/* Stepper */}
            <div style={{display:'flex',alignItems:'center',marginBottom:28}}>
              {['Details','Recipients','Compose','Schedule'].map((s,i)=>(
                <div key={s} style={{display:'flex',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:9,cursor:i+1<step?'pointer':'default'}}
                    onClick={()=>i+1<step&&setStep(i+1)}>
                    <div style={{
                      width:24,height:24,borderRadius:'50%',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:10,fontWeight:700,fontFamily:'DM Mono,monospace',
                      transition:'all 0.25s',
                      background: step===i+1
                        ? 'linear-gradient(135deg,#3b8fff,#1a4fd6)'
                        : step>i+1
                          ? 'linear-gradient(135deg,#10b981,#059669)'
                          : d?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.08)',
                      color: step>=i+1?'#fff':C.muted,
                      boxShadow: step===i+1
                        ? '0 0 16px rgba(43,127,255,0.5)'
                        : step>i+1?'0 0 10px rgba(16,185,129,0.4)':undefined,
                    }}>
                      {step>i+1?'✓':i+1}
                    </div>
                    <span style={{fontSize:12,fontWeight:step===i+1?600:400,
                      color:step===i+1?C.accent:step>i+1?C.green:C.muted,
                      letterSpacing:'0.01em'}}>
                      {s}
                    </span>
                  </div>
                  {i<3&&(
                    <div style={{width:32,height:1,margin:'0 10px',
                      background:step>i+1
                        ?'linear-gradient(90deg,#10b981,#059669)'
                        :`linear-gradient(90deg,${C.border2},${C.border})`,
                      transition:'background 0.4s'}}/>
                  )}
                </div>
              ))}
            </div>

            <div style={{...glassCard,padding:30}}>
              {error&&(
                <div style={{background:'rgba(239,68,68,0.1)',
                  border:'1px solid rgba(239,68,68,0.3)',
                  color:'#fca5a5',borderRadius:10,padding:'10px 16px',
                  marginBottom:18,fontSize:13,
                  boxShadow:'0 0 16px rgba(239,68,68,0.1)'}}>
                  {error}
                </div>
              )}

              {/* STEP 1 */}
              {step===1&&(
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:22,letterSpacing:'-0.01em'}}>Campaign Details</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                    <div><label style={lbl}>Campaign Name</label><input style={inp} placeholder="SEO Outreach Q1" value={name} onChange={e=>setName(e.target.value)}/></div>
                    <div><label style={lbl}>From Name</label><input style={inp} placeholder="Aftab from DigiXFlyy" value={fromName} onChange={e=>setFromName(e.target.value)}/></div>
                  </div>
                  <div style={{marginBottom:22}}>
                    <label style={lbl}>Internal Notes <span style={{fontSize:10,fontWeight:400,textTransform:'none',opacity:0.6}}>(optional)</span></label>
                    <textarea style={{...inp,height:72,resize:'vertical'}} placeholder="e.g. Fitness leads from Google Maps" value={notes} onChange={e=>setNotes(e.target.value)}/>
                  </div>
                  <button style={btn} className="gbtn" onClick={()=>{if(!name||!fromName){setError('Fill both fields');return;}setError('');setStep(2);}}>Continue →</button>
                </div>
              )}

              {/* STEP 2 */}
              {step===2&&(
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <h3 style={{fontWeight:700,fontSize:16,letterSpacing:'-0.01em'}}>Upload Recipients</h3>
                    <button className="gbtn" onClick={()=>{
                      const h='email,name,first_name,city,state,phone,website,rating,is_safe_to_send';
                      const ex='john@example.com,John Smith,John,New York,NY,+1234567890,example.com,4.5,true';
                      const blob=new Blob([h+'\n'+ex],{type:'text/csv'});
                      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='recipients_template.csv';a.click();
                    }} style={{...btnGhost,fontSize:11,padding:'5px 12px'}}>↓ Template</button>
                  </div>
                  <p style={{fontSize:11,color:C.muted,marginBottom:14,fontFamily:'DM Mono,monospace',lineHeight:1.7,opacity:0.8}}>
                    email · name · first_name · city · state · phone · website · rating · is_safe_to_send
                  </p>
                  <label style={{display:'flex',alignItems:'center',gap:9,marginBottom:16,cursor:'pointer',fontSize:12,color:C.muted}}>
                    <input type="checkbox" checked={safeFilter} onChange={e=>setSafeFilter(e.target.checked)} style={{accentColor:C.accent,width:14,height:14}}/>
                    Filter unsafe contacts <span style={{fontFamily:'DM Mono,monospace',fontSize:10,opacity:0.7,marginLeft:4}}>(is_safe_to_send = false)</span>
                  </label>
                  {csvError&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5',borderRadius:10,padding:'10px 14px',marginBottom:12,fontSize:13}}>{csvError}</div>}
                  <label style={{
                    display:'block',border:`1px dashed ${C.border2}`,borderRadius:12,
                    padding:32,textAlign:'center',cursor:'pointer',marginBottom:16,
                    background:d?'rgba(43,127,255,0.02)':'rgba(43,127,255,0.01)',
                    transition:'all 0.2s',
                  }}>
                    <input type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files?.[0]&&handleCSV(e.target.files[0])}/>
                    <div style={{fontSize:22,marginBottom:9,opacity:0.3}}>↑</div>
                    <div style={{fontWeight:600,fontSize:13,color:C.muted}}>Click to upload CSV</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:4,opacity:0.55}}>or drag and drop</div>
                  </label>
                  {recipients.length>0&&(
                    <>
                      <div style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',
                        borderRadius:10,padding:'10px 16px',fontSize:12,color:'#6ee7b7',marginBottom:12,
                        fontWeight:600,boxShadow:'0 0 16px rgba(16,185,129,0.08)'}}>
                        ✓ {recipients.length} recipients loaded{filteredCount>0&&` · ${filteredCount} filtered out`}
                      </div>
                      <div style={{maxHeight:130,overflowY:'auto',border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                        <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
                          <thead><tr style={{background:d?'rgba(0,0,0,0.35)':'rgba(0,0,0,0.03)'}}>
                            {['Email','Name','City','Safe'].map(h=><th key={h} style={{padding:'7px 12px',textAlign:'left',fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.muted}}>{h}</th>)}
                          </tr></thead>
                          <tbody>{recipients.slice(0,4).map((r,i)=>(
                            <tr key={i} style={{borderTop:`1px solid ${C.border}`}} className="grow">
                              <td style={{padding:'7px 12px',fontFamily:'DM Mono,monospace',fontSize:11,color:C.text}}>{r.email}</td>
                              <td style={{padding:'7px 12px',color:C.muted}}>{r.first_name||r.name||r.business_name||'—'}</td>
                              <td style={{padding:'7px 12px',color:C.muted}}>{r.city||'—'}</td>
                              <td style={{padding:'7px 12px',color:r.is_safe_to_send==='true'||r.is_safe_to_send==='1'?'#6ee7b7':C.muted,fontFamily:'DM Mono,monospace'}}>
                                {r.is_safe_to_send==='true'||r.is_safe_to_send==='1'?'✓':'—'}
                              </td>
                            </tr>
                          ))}</tbody>
                        </table>
                        {recipients.length>4&&<div style={{padding:'6px 12px',fontSize:11,color:C.muted,fontFamily:'DM Mono,monospace',opacity:0.7}}>+{recipients.length-4} more</div>}
                      </div>
                    </>
                  )}
                  <div style={{display:'flex',gap:8,marginTop:18}}>
                    <button style={btnGhost} className="gbtn" onClick={()=>setStep(1)}>← Back</button>
                    <button style={btn} className="gbtn" onClick={()=>{if(!recipients.length){setError('Upload CSV first');return;}setError('');setStep(3);}}>Continue →</button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step===3&&(
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
                    <h3 style={{fontWeight:700,fontSize:16,letterSpacing:'-0.01em'}}>Compose Email</h3>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:12,color:C.muted}}>A/B Test</span>
                      <div onClick={()=>setAbEnabled(!abEnabled)}
                        style={{width:36,height:20,borderRadius:10,cursor:'pointer',
                          background:abEnabled?'linear-gradient(135deg,#3b8fff,#1a4fd6)':d?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.15)',
                          position:'relative',transition:'all 0.2s',
                          boxShadow:abEnabled?'0 0 10px rgba(43,127,255,0.4)':undefined}}>
                        <div style={{position:'absolute',top:2,left:abEnabled?18:2,
                          width:16,height:16,borderRadius:'50%',background:'#fff',
                          transition:'left 0.2s',
                          boxShadow:'0 1px 4px rgba(0,0,0,0.4)'}}/>
                      </div>
                    </div>
                  </div>
                  {/* TEMPLATE PANEL */}
                  <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
                    <button onClick={()=>setShowTemplates(p=>!p)} className="gbtn"
                      style={{...btnGhost,fontSize:11,padding:'5px 12px',
                        color:showTemplates?C.accent:C.muted}}>
                      📄 Templates {templates.length>0&&`(${templates.length})`}
                    </button>
                    <button onClick={saveTemplate} className="gbtn"
                      style={{...btnGhost,fontSize:11,padding:'5px 12px'}}>Save as Template</button>
                    <button onClick={saveDraftToStorage} className="gbtn"
                      style={{...btnGhost,fontSize:11,padding:'5px 12px'}}>💾 Save Draft</button>
                    <button onClick={loadDraftFromStorage} className="gbtn"
                      style={{...btnGhost,fontSize:11,padding:'5px 12px',color:'#fcd34d',borderColor:'rgba(245,158,11,0.3)'}}>Load Draft</button>
                  </div>
                  {showTemplates&&templates.length>0&&(
                    <div style={{...glassCard,padding:12,marginBottom:14}}>
                      {templates.map(t=>(
                        <div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                          padding:'8px 10px',borderBottom:`1px solid ${C.border}`,gap:8}}>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:C.text}}>{t.name}</div>
                            <div style={{fontSize:11,color:C.muted,fontFamily:'DM Mono,monospace',marginTop:2,opacity:0.8}}>{t.subject.slice(0,50)}</div>
                          </div>
                          <div style={{display:'flex',gap:6}}>
                            <button onClick={()=>loadTemplate(t)} className="gbtn"
                              style={{...btn,fontSize:10,padding:'4px 10px'}}>Load</button>
                            <button onClick={()=>deleteTemplate(t.id)} className="gbtn"
                              style={{...btnGhost,fontSize:10,padding:'4px 8px',color:'#fca5a5'}}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {abEnabled&&(
                    <div style={{display:'flex',gap:6,marginBottom:16}}>
                      {[0,1].map(i=>(
                        <button key={i} onClick={()=>setActiveVariant(i)} className="gbtn"
                          style={{padding:'6px 16px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',
                            border:`1px solid ${activeVariant===i?'rgba(43,127,255,0.5)':C.border2}`,
                            background:activeVariant===i
                              ?d?'rgba(43,127,255,0.14)':'rgba(43,127,255,0.09)'
                              :'transparent',
                            color:activeVariant===i?C.accent:C.muted,
                            boxShadow:activeVariant===i?'0 0 12px rgba(43,127,255,0.15)':undefined}}>
                          Variant {String.fromCharCode(65+i)}
                          <span style={{marginLeft:5,fontSize:10,opacity:0.5,fontFamily:'DM Mono,monospace'}}>50%</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:7}}>
                      <label style={{...lbl,marginBottom:0}}>Subject Line</label>
                      <span style={{fontSize:10,fontFamily:'DM Mono,monospace',
                        color:variants[activeVariant].subject.length>60?C.red:C.muted,
                        opacity:0.8}}>{variants[activeVariant].subject.length}/60</span>
                    </div>
                    <input style={inp} placeholder="Quick question for {{name}}" value={variants[activeVariant].subject} onChange={e=>updateVariant(activeVariant,'subject',e.target.value)}/>
                    {variants[activeVariant].subject.length>60&&<div style={{fontSize:11,color:C.red,marginTop:4,fontFamily:'DM Mono,monospace'}}>Subject may be truncated by email clients</div>}
                  </div>
                  <div style={{marginBottom:10}}>
                    <label style={lbl}>Insert Tag</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                      {TAGS.map(t=>(
                        <button key={t} onClick={()=>insertTag(t)} className="tag-btn gbtn"
                          style={{fontSize:10,padding:'4px 9px',borderRadius:6,cursor:'pointer',
                            fontFamily:'DM Mono,monospace',border:`1px solid ${C.border2}`,
                            background:d?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)',
                            color:C.muted2,transition:'all 0.15s'}}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{fontSize:10,color:C.muted,fontFamily:'DM Mono,monospace',marginBottom:6,opacity:0.75}}>
                    Spintax: <span style={{color:'#c4b5fd'}}>{"{Hi|Hello|Hey}"} {"{{first_name}}"}</span> — randomizes per recipient
                  </div>
                  <textarea ref={bodyRef} style={{...inp,height:188,resize:'vertical',marginTop:10,marginBottom:14}}
                    placeholder={'Hi {{first_name}},\n\nI came across {{name}} in {{city}}...'}
                    value={variants[activeVariant].body} onChange={e=>updateVariant(activeVariant,'body',e.target.value)}/>
                  {recipients.length>0&&variants[activeVariant].subject&&(
                    <div style={{
                      border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:16,
                      background:d?'rgba(0,0,0,0.3)':'rgba(0,0,0,0.015)',
                      backdropFilter:'blur(8px)',
                    }}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',
                        textTransform:'uppercase',color:C.muted,marginBottom:10,
                        fontFamily:'DM Mono,monospace',opacity:0.8}}>
                        PREVIEW — {recipients[0].email}
                      </div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:9,color:C.text}}>
                        {preview(variants[activeVariant].subject,recipients[0])}
                      </div>
                      <div style={{fontSize:12,color:C.muted,whiteSpace:'pre-wrap',lineHeight:1.75}}>
                        {preview(variants[activeVariant].body,recipients[0])}
                      </div>
                    </div>
                  )}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button style={btnGhost} className="gbtn" onClick={()=>setStep(2)}>← Back</button>
                    <button style={btn} className="gbtn" onClick={()=>{if(!variants[0].subject||!variants[0].body){setError('Fill subject and body');return;}setError('');setStep(4);}}>Continue →</button>
                    <button className="gbtn" onClick={()=>{navigator.clipboard.writeText(variants[activeVariant].subject);toast('Subject copied');}}
                      style={{...btnGhost,fontSize:11,padding:'6px 12px',marginLeft:'auto'}}>Copy Subject</button>
                    <button className="gbtn" onClick={()=>{navigator.clipboard.writeText(variants[activeVariant].body);toast('Body copied');}}
                      style={{...btnGhost,fontSize:11,padding:'6px 12px'}}>Copy Body</button>
                    <button className="gbtn" onClick={()=>{if(confirm('Clear subject and body?'))updateVariant(activeVariant,'subject',''),updateVariant(activeVariant,'body','');}}
                      style={{...btnGhost,fontSize:11,padding:'6px 12px',color:'#fca5a5',borderColor:'rgba(239,68,68,0.3)'}}>Clear</button>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step===4&&(
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:22,letterSpacing:'-0.01em'}}>Schedule</h3>
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Start Sending At <span style={{fontSize:10,fontWeight:400,textTransform:'none',opacity:0.6}}>(local time)</span></label>
                    <input type="datetime-local" style={inp} value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/>
                  </div>
                  <div style={{marginBottom:18}}>
                    <label style={lbl}>Daily Send Window (IST)</label>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:7}}>
                      <div><label style={{...lbl,opacity:0.65}}>Start</label><input type="time" style={inp} value={windowStart} onChange={e=>setWindowStart(e.target.value)}/></div>
                      <div><label style={{...lbl,opacity:0.65}}>End</label><input type="time" style={inp} value={windowEnd} onChange={e=>setWindowEnd(e.target.value)}/></div>
                    </div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:'DM Mono,monospace',opacity:0.75}}>
                      e.g. 20:00–01:00 IST = US daytime · overnight windows work automatically
                    </div>
                  </div>
                  {(()=>{
                    const [sh,sm]=windowStart.split(':').map(Number);
                    const [eh,em]=windowEnd.split(':').map(Number);
                    const startMin=sh*60+sm, endMin=eh*60+em;
                    const windowMins=endMin>startMin?endMin-startMin:(24*60-startMin)+endMin;
                    const maxEmails=Math.floor(windowMins/5);
                    const cappedLimit=Math.min(dailyLimit,maxEmails);
                    const gap=Math.max(5,Math.floor(windowMins/cappedLimit));
                    const daysToComplete=Math.ceil(recipients.length/cappedLimit);
                    return (
                      <>
                        <div style={{background:'rgba(16,185,129,0.09)',
                          border:'1px solid rgba(16,185,129,0.25)',
                          borderRadius:10,padding:'9px 14px',fontSize:11,
                          color:'#6ee7b7',marginBottom:18,fontFamily:'DM Mono,monospace',
                          boxShadow:'0 0 16px rgba(16,185,129,0.06)'}}>
                          ✓ {windowMins}min window · max {maxEmails} emails/day at 5min intervals
                        </div>
                        <div style={{marginBottom:18}}>
                          <label style={lbl}>
                            Emails Per Day
                            <span style={{fontFamily:'DM Mono,monospace',fontWeight:500,
                              textTransform:'none',marginLeft:8,color:'#93c5fd',fontSize:13}}>
                              {cappedLimit}{dailyLimit>maxEmails?' (capped)':''}
                            </span>
                          </label>
                          <input type="range" min={5} max={maxEmails} step={5} style={{width:'100%',marginTop:8,height:4}} value={cappedLimit} onChange={e=>setDailyLimit(Number(e.target.value))}/>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.muted,marginTop:5,fontFamily:'DM Mono,monospace',opacity:0.7}}>
                            <span>5</span><span>{Math.floor(maxEmails/2)}</span><span>{maxEmails}</span>
                          </div>
                          <div style={{fontSize:11,color:C.muted,marginTop:10,fontFamily:'DM Mono,monospace',opacity:0.8}}>
                            1 email every {gap} min within window
                          </div>
                        </div>
                        {/* SUMMARY CARD */}
                        <div style={{
                          background:d?'rgba(43,127,255,0.06)':'rgba(43,127,255,0.035)',
                          border:'1px solid rgba(43,127,255,0.2)',
                          borderRadius:12,padding:18,marginBottom:24,
                          boxShadow:'0 0 24px rgba(43,127,255,0.07)',
                          backdropFilter:'blur(12px)',
                        }}>
                          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',
                            color:'#93c5fd',marginBottom:14,fontFamily:'DM Mono,monospace'}}>SEND SUMMARY</div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
                            {[
                              ['Recipients',   `${recipients.length}`],
                              ['Daily limit',  `${cappedLimit} emails`],
                              ['Interval',     `${gap} min`],
                              ['Est. duration',`~${daysToComplete} day${daysToComplete!==1?'s':''}`],
                              ['Window',       `${windowStart}–${windowEnd} IST`],
                              ['Starts', scheduledAt
                                ?new Date(scheduledAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})+' IST'
                                :'Not set'],
                            ].map(([k,v])=>(
                              <div key={k} style={{display:'flex',justifyContent:'space-between',
                                fontSize:11,padding:'7px 0',
                                borderBottom:`1px solid ${C.border}`,gap:8}}>
                                <span style={{color:C.muted}}>{k}</span>
                                <span style={{fontFamily:'DM Mono,monospace',color:C.text,fontWeight:500,textAlign:'right'}}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                  <div style={{display:'flex',gap:8}}>
                    <button style={btnGhost} className="gbtn" onClick={()=>setStep(3)}>← Back</button>
                    <button style={{...btn,
                      background:submitting?'rgba(255,255,255,0.1)':'linear-gradient(135deg,#10b981,#059669)',
                      boxShadow:submitting?'none':'0 2px 16px rgba(16,185,129,0.4)'}}
                      disabled={submitting} onClick={handleSubmit} className="gbtn">
                      {submitting?'Scheduling…':'↑ Schedule Campaign'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FOLLOW UP ── */}
        {view==='followup'&&fuCampaign&&(
          <div>
            <button onClick={()=>setView('list')} className="gbtn"
              style={{...btnGhost,padding:'6px 14px',fontSize:12,marginBottom:22}}>← Back</button>
            <h2 style={{fontSize:16,fontWeight:700,marginBottom:5,letterSpacing:'-0.015em'}}>
              Follow Up
              <span style={{fontWeight:400,color:C.muted,marginLeft:10}}>{fuCampaign.name}</span>
            </h2>
            <p style={{fontSize:12,color:C.muted,marginBottom:20,lineHeight:1.5}}>
              Uncheck anyone who replied — we'll only follow up the rest.
            </p>
            <div style={{...glassCard,padding:18,marginBottom:14}}>
              <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
                <input style={{...inp,flex:1,minWidth:160}} placeholder="Search…" value={fuSearch} onChange={e=>setFuSearch(e.target.value)}/>
                <span style={{fontSize:11,fontFamily:'DM Mono,monospace',color:C.muted,
                  background:d?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)',
                  padding:'4px 10px',borderRadius:6,border:`1px solid ${C.border}`,whiteSpace:'nowrap'}}>
                  {fuRecs.filter(r=>r.selected).length} / {fuRecs.length}
                </span>
                <button onClick={()=>setFuRecs(r=>r.map(x=>({...x,selected:false})))} className="gbtn" style={{...btnGhost,fontSize:11,padding:'6px 12px'}}>None</button>
                <button onClick={()=>setFuRecs(r=>r.map(x=>({...x,selected:true})))} className="gbtn" style={{...btn,fontSize:11,padding:'6px 12px'}}>All</button>
              </div>
              <div style={{maxHeight:230,overflowY:'auto',border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                {fuRecs.filter(r=>r.email.includes(fuSearch)||r.name.toLowerCase().includes(fuSearch.toLowerCase())).map(r=>(
                  <div key={r.id} onClick={()=>setFuRecs(prev=>prev.map(x=>x.id===r.id?{...x,selected:!x.selected}:x))}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',
                      borderBottom:`1px solid ${C.border}`,cursor:'pointer',
                      background:r.selected?'transparent':d?'rgba(239,68,68,0.06)':'rgba(239,68,68,0.025)',
                      transition:'background 0.15s'}}
                    className="grow">
                    <input type="checkbox" checked={r.selected} onChange={()=>{}} onClick={e=>e.stopPropagation()} style={{accentColor:C.accent,width:14,height:14}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontFamily:'DM Mono,monospace',color:C.text}}>{r.email}</div>
                      {r.name&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{r.name}</div>}
                    </div>
                    {!r.selected&&<span style={{fontSize:9,color:'#fca5a5',fontFamily:'DM Mono,monospace',fontWeight:700,letterSpacing:'0.1em'}}>SKIP</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{...glassCard,padding:24}}>
              <h3 style={{fontWeight:700,fontSize:14,marginBottom:16}}>Compose Follow-Up</h3>
              <div style={{marginBottom:12}}><label style={lbl}>Subject</label><input style={inp} value={fuSubject} onChange={e=>setFuSubject(e.target.value)}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Body</label><textarea style={{...inp,height:120,resize:'vertical'}} value={fuBody} onChange={e=>setFuBody(e.target.value)}/></div>
              <div style={{marginBottom:20}}><label style={lbl}>Schedule At</label><input type="datetime-local" style={inp} value={fuSchedule} onChange={e=>setFuSchedule(e.target.value)}/></div>
              <button style={{...btn,
                background:fuSubmitting?'rgba(255,255,255,0.1)':`linear-gradient(135deg,${C.purple},#7c3aed)`,
                boxShadow:fuSubmitting?'none':'0 2px 14px rgba(139,92,246,0.4)'}}
                disabled={fuSubmitting} onClick={sendFollowUp} className="gbtn">
                {fuSubmitting?'Scheduling…':`↑ Follow Up ${fuRecs.filter(r=>r.selected).length} people`}
              </button>
            </div>
          </div>
        )}

        {/* ── TEST EMAIL ── */}
        {view==='test'&&(
          <div style={{maxWidth:500}}>
            <h2 style={{fontSize:16,fontWeight:700,marginBottom:20,letterSpacing:'-0.015em'}}>Test Email</h2>
            <div style={{...glassCard,padding:28}}>
              <div style={{marginBottom:14}}><label style={lbl}>To</label><input style={inp} placeholder="your@email.com" value={testEmail} onChange={e=>setTestEmail(e.target.value)}/></div>
              <div style={{marginBottom:14}}><label style={lbl}>Subject</label><input style={inp} value={testSubject} onChange={e=>setTestSubject(e.target.value)}/></div>
              <div style={{marginBottom:20}}><label style={lbl}>Body</label><textarea style={{...inp,height:140,resize:'vertical'}} value={testBody} onChange={e=>setTestBody(e.target.value)}/></div>
              {testResult&&(
                <div style={{borderRadius:10,padding:'10px 16px',marginBottom:16,
                  fontSize:12,fontFamily:'DM Mono,monospace',letterSpacing:'0.02em',
                  background:testResult.includes('✓')?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)',
                  color:testResult.includes('✓')?'#6ee7b7':'#fca5a5',
                  border:`1px solid ${testResult.includes('✓')?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`,
                  boxShadow:testResult.includes('✓')?'0 0 16px rgba(16,185,129,0.08)':'0 0 16px rgba(239,68,68,0.08)'}}>
                  {testResult}
                </div>
              )}
              <button style={{...btn,background:testSending?'rgba(255,255,255,0.1)':btn.background as string}}
                disabled={testSending} onClick={sendTest} className="gbtn">
                {testSending?'Sending…':'↑ Send Test Email'}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* WORD COUNT hint for body — inject via existing char count area already done for subject */}

      {/* HOTKEYS MODAL */}
      {showHotkeys&&(
        <div onClick={()=>setShowHotkeys(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',
          backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div onClick={e=>e.stopPropagation()} style={{...glassCard,padding:28,minWidth:300,maxWidth:400}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
              color:C.muted,marginBottom:16,fontFamily:'DM Mono,monospace'}}>KEYBOARD SHORTCUTS</div>
            {[['N','New campaign'],['Esc','Back to list'],['/','Focus search'],['?','Toggle this panel']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',
                borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                <span style={{fontFamily:'DM Mono,monospace',background:d?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.07)',
                  padding:'2px 8px',borderRadius:5,fontSize:11,color:C.text}}>{k}</span>
                <span style={{color:C.muted}}>{v}</span>
              </div>
            ))}
            <button onClick={()=>setShowHotkeys(false)} className="gbtn"
              style={{...btnGhost,marginTop:16,width:'100%',textAlign:'center'}}>Close</button>
          </div>
        </div>
      )}

      {/* UNDO BANNER */}
      {undoQueue&&(
        <div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',
          background:d?'rgba(10,16,32,0.95)':'rgba(255,255,255,0.97)',
          border:`1px solid ${C.border2}`,borderRadius:12,padding:'10px 20px',
          display:'flex',alignItems:'center',gap:14,zIndex:200,
          boxShadow:'0 8px 32px rgba(0,0,0,0.3)',backdropFilter:'blur(20px)'}}>
          <span style={{fontSize:13,color:C.text}}>"{undoQueue.name}" deleted</span>
          <button onClick={undoDelete} className="gbtn"
            style={{...btn,padding:'5px 14px',fontSize:12,background:'linear-gradient(135deg,#f59e0b,#d97706)',
              boxShadow:'0 2px 10px rgba(245,158,11,0.3)'}}>Undo</button>
        </div>
      )}

      {/* TOASTS */}
      <div style={{position:'fixed',bottom:24,right:24,display:'flex',flexDirection:'column',gap:8,zIndex:999,pointerEvents:'none'}}>
        {toasts.map(t=>(
          <div key={t.id} style={{
            background:t.ok?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)',
            border:`1px solid ${t.ok?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'}`,
            color:t.ok?'#6ee7b7':'#fca5a5',
            backdropFilter:'blur(16px)',borderRadius:10,padding:'10px 16px',
            fontSize:12,fontWeight:500,
            boxShadow:t.ok?'0 4px 20px rgba(16,185,129,0.15)':'0 4px 20px rgba(239,68,68,0.15)',
            animation:'slideIn 0.25s ease',
          }}>
            {t.ok?'✓':'✕'} {t.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
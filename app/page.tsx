'use client';
import { useEffect, useState, useRef } from 'react';

type Recipient = { email: string; name?: string; first_name?: string; business_name?: string; phone?: string; city?: string; state?: string; overall_score?: string; is_safe_to_send?: string; website?: string; rating?: string; [key: string]: string | undefined };
type Variant = { subject: string; body: string };
type Campaign = { id: string; name: string; subject: string; status: string; scheduled_at: string; notes?: string; sent_count?: number; total_count?: number; recipients: { count: number }[] };
type FollowUpRec = { id: string; email: string; name: string; selected: boolean };
type View = 'list'|'create'|'test'|'followup';

const TAGS = ['{{first_name}}','{{name}}','{{company}}','{{city}}','{{state}}','{{email}}','{{phone}}','{{website}}','{{rating}}'];

const STATUS_META: Record<string,{label:string;dot:string;bg:string;text:string}> = {
  scheduled:   {label:'SCHEDULED', dot:'#3b82f6', bg:'rgba(59,130,246,0.1)',  text:'#60a5fa'},
  sending:     {label:'SENDING',   dot:'#f59e0b', bg:'rgba(245,158,11,0.1)',  text:'#fbbf24'},
  in_progress: {label:'SENDING',   dot:'#f59e0b', bg:'rgba(245,158,11,0.1)',  text:'#fbbf24'},
  done:        {label:'COMPLETE',  dot:'#10b981', bg:'rgba(16,185,129,0.1)',  text:'#34d399'},
  failed:      {label:'FAILED',    dot:'#ef4444', bg:'rgba(239,68,68,0.1)',   text:'#f87171'},
  paused:      {label:'PAUSED',    dot:'#8b5cf6', bg:'rgba(139,92,246,0.1)', text:'#a78bfa'},
  draft:       {label:'DRAFT',     dot:'#6b7280', bg:'rgba(107,114,128,0.1)',text:'#9ca3af'},
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
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // ── THEME ────────────────────────────────────────────────────────────
  const d = dark;
  const C = {
    bg:      d ? '#080c14' : '#f0f2f7',
    card:    d ? '#0d1220' : '#ffffff',
    border:  d ? '#1a2640' : '#dde1ea',
    border2: d ? '#1e2d45' : '#c8cdd8',
    text:    d ? '#e2e8f0' : '#111827',
    muted:   d ? '#4b6280' : '#64748b',
    muted2:  d ? '#6b82a0' : '#94a3b8',
    accent:  '#2b7fff',
    green:   '#10b981',
    amber:   '#f59e0b',
    red:     '#ef4444',
    purple:  '#8b5cf6',
    cyan:    '#0ea5e9',
  };

  const glassCard: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
  };

  const lbl: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:700,
    letterSpacing:'0.08em', textTransform:'uppercase',
    color:C.muted, marginBottom:6,
  };

  const inp: React.CSSProperties = {
    display:'block', width:'100%',
    border:`1px solid ${C.border2}`,
    borderRadius:8, padding:'9px 12px', fontSize:13,
    color:C.text, outline:'none', boxSizing:'border-box',
    background: d ? '#080c14' : '#f8fafc',
    fontFamily:'inherit', transition:'border-color 0.15s',
  };

  const btn: React.CSSProperties = {
    background: C.accent, color:'#fff', border:'none',
    borderRadius:8, padding:'9px 20px', fontSize:13,
    fontWeight:600, cursor:'pointer', letterSpacing:'0.01em',
    transition:'opacity 0.15s',
  };

  const btnGhost: React.CSSProperties = {
    background:'transparent', color:C.muted2,
    border:`1px solid ${C.border2}`,
    borderRadius:8, padding:'8px 16px', fontSize:13,
    fontWeight:500, cursor:'pointer', transition:'border-color 0.15s',
  };

  // ── DATA ─────────────────────────────────────────────────────────────
  const fetchCampaigns = async () => { try { const r = await fetch('/api/campaigns'); setCampaigns(await r.json()); } catch {} };
  useEffect(() => { fetchCampaigns(); const t = setInterval(fetchCampaigns, 30000); return () => clearInterval(t); }, []);

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
      setView('list'); setStep(1); setName(''); setFromName(''); setNotes('');
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

  const deleteCampaign = async (id:string) => {
    if (!confirm('Delete this campaign?')) return;
    await fetch(`/api/campaigns?id=${id}`,{method:'DELETE'}); fetchCampaigns();
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

  // ── SUBCOMPONENTS ─────────────────────────────────────────────────────
  const StatusBadge = ({status}: {status:string}) => {
    const m = STATUS_META[status] || STATUS_META.draft;
    return (
      <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 8px',
        borderRadius:4,background:m.bg,fontSize:10,fontWeight:700,
        letterSpacing:'0.1em',color:m.text,fontFamily:'DM Mono,monospace'}}>
        <span style={{width:5,height:5,borderRadius:'50%',background:m.dot,flexShrink:0,
          boxShadow:(status==='sending'||status==='in_progress')?`0 0 6px ${m.dot}`:undefined}}/>
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
      <div style={{marginTop:10}}>
        <div style={{height:2,borderRadius:99,background:C.border,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:99,background:color,width:`${pct}%`,
            transition:'width 0.6s cubic-bezier(0.4,0,0.2,1)',
            boxShadow:c.status!=='done'?`0 0 8px ${color}88`:undefined}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
          <span style={{fontSize:11,color:C.muted,fontFamily:'DM Mono,monospace'}}>{c.sent_count||0} / {c.total_count}</span>
          <span style={{fontSize:11,color,fontWeight:600,fontFamily:'DM Mono,monospace'}}>{pct}%</span>
        </div>
      </div>
    );
  };

  const Panel = ({title,accent,children,tint}: {title:string;accent:string;children:React.ReactNode;tint:string}) => (
    <div style={{borderTop:`1px solid ${C.border}`,padding:'18px 20px',background:tint}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <div style={{width:2,height:14,borderRadius:2,background:accent,flexShrink:0}}/>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',
          textTransform:'uppercase',color:accent,fontFamily:'DM Mono,monospace'}}>{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{fontFamily:'"DM Sans",system-ui,sans-serif',minHeight:'100vh',background:C.bg,color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,textarea{font-family:inherit;color-scheme:${d?'dark':'light'};}
        input[type=range]{accent-color:${C.accent};}
        input:focus,textarea:focus{border-color:${C.accent}!important;box-shadow:0 0 0 3px ${C.accent}22!important;outline:none!important;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:3px;}
        .hov-btn:hover{opacity:0.85;}
        .hov-row:hover{background:${d?'rgba(43,127,255,0.04)':'rgba(43,127,255,0.03)'}!important;}
        .hov-card:hover{border-color:${C.border2}!important;}
        h2,h3{margin:0;}
      `}</style>

      {/* NAV */}
      <nav style={{background:d?'rgba(8,12,20,0.96)':'rgba(255,255,255,0.96)',
        backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',
        borderBottom:`1px solid ${C.border}`,
        padding:'0 28px',display:'flex',alignItems:'center',height:50,
        position:'sticky',top:0,zIndex:100}}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:9,marginRight:36}}>
          <div style={{width:26,height:26,borderRadius:7,
            background:'linear-gradient(135deg,#2b7fff 0%,#1a4fd6 100%)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:13,boxShadow:'0 2px 8px #2b7fff44'}}>✉</div>
          <span style={{fontWeight:700,fontSize:14,letterSpacing:'-0.02em',color:C.text}}>AutoEmail</span>
        </div>

        {/* Nav tabs */}
        <div style={{display:'flex',gap:2,flex:1}}>
          {([['list','Campaigns'],['create','New Campaign'],['test','Test Email']] as const).map(([v,label])=>(
            <button key={v} onClick={()=>{setView(v);setStep(1);setError('');}}
              className="hov-btn"
              style={{padding:'5px 13px',borderRadius:6,border:'none',cursor:'pointer',
                fontSize:13,fontWeight:500,transition:'all 0.15s',
                background:view===v?d?'rgba(43,127,255,0.14)':'rgba(43,127,255,0.09)':'transparent',
                color:view===v?C.accent:C.muted}}>
              {label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:10,fontFamily:'DM Mono,monospace',color:C.muted,
            background:d?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)',
            padding:'3px 8px',borderRadius:4,border:`1px solid ${C.border}`,letterSpacing:'0.06em'}}>
            SYNC 30s
          </span>
          <button onClick={()=>setDark(!d)} className="hov-btn"
            style={{...btnGhost,padding:'4px 10px',fontSize:12,lineHeight:1.4}}>
            {d?'Light':'Dark'}
          </button>
        </div>
      </nav>

      <div style={{maxWidth:920,margin:'0 auto',padding:'28px 20px'}}>

        {/* ── STATS ── */}
        {view==='list'&&(()=>{
          const totalSent = campaigns.reduce((s,c)=>s+(c.sent_count||0),0);
          const active = campaigns.filter(c=>['in_progress','scheduled','sending'].includes(c.status)).length;
          const done = campaigns.filter(c=>c.status==='done');
          const totalRecips = done.reduce((s,c)=>s+(c.total_count||0),0);
          const successRate = totalRecips>0?Math.round((done.reduce((s,c)=>s+(c.sent_count||0),0)/totalRecips)*100):0;
          return (
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:24}}>
              {([
                ['Emails Sent', totalSent.toLocaleString(), C.accent],
                ['Active',      String(active),             C.amber],
                ['Success Rate',totalRecips>0?`${successRate}%`:'—', C.green],
                ['Total',       String(campaigns.length),   C.muted2],
              ] as const).map(([label,value,color])=>(
                <div key={label} style={{...glassCard,padding:'14px 16px'}} className="hov-card">
                  <div style={{fontSize:24,fontWeight:700,fontFamily:'DM Mono,monospace',
                    color,letterSpacing:'-0.04em',lineHeight:1,marginBottom:5}}>{value}</div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',
                    textTransform:'uppercase',color:C.muted}}>{label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── CAMPAIGN LIST ── */}
        {view==='list'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <span style={{fontSize:13,fontWeight:600,color:C.muted2,letterSpacing:'0.02em'}}>
                {campaigns.length} campaign{campaigns.length!==1?'s':''}
              </span>
              <button onClick={()=>{setView('create');setStep(1);}} style={{...btn,padding:'7px 16px',fontSize:12}} className="hov-btn">
                + New Campaign
              </button>
            </div>

            {campaigns.length===0&&(
              <div style={{...glassCard,padding:56,textAlign:'center'}}>
                <div style={{fontSize:28,marginBottom:10,opacity:0.2}}>✉</div>
                <div style={{fontSize:14,color:C.muted,fontWeight:500}}>No campaigns yet</div>
                <div style={{fontSize:12,color:C.muted,marginTop:4,opacity:0.6}}>Create your first campaign to get started</div>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {campaigns.map(c=>(
                <div key={c.id} style={{...glassCard,overflow:'hidden'}} className="hov-card">
                  <div style={{padding:'14px 18px'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                          <span style={{fontWeight:600,fontSize:14,letterSpacing:'-0.01em',color:C.text}}>{c.name}</span>
                          <StatusBadge status={c.status}/>
                        </div>
                        <div style={{fontSize:12,color:C.muted,fontFamily:'DM Mono,monospace',
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:480,marginBottom:6}}>
                          {c.subject}
                        </div>
                        <div style={{display:'flex',gap:14,fontSize:11,color:C.muted,flexWrap:'wrap'}}>
                          <span style={{fontFamily:'DM Mono,monospace'}}>{c.recipients?.[0]?.count??0} recipients</span>
                          <span style={{color:C.border}}>·</span>
                          <span>{new Date(c.scheduled_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} IST</span>
                          {c.notes&&<><span style={{color:C.border}}>·</span><span style={{fontStyle:'italic',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.notes}</span></>}
                        </div>
                        <ProgressBar c={c}/>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div style={{display:'flex',gap:5,flexShrink:0,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end',maxWidth:280}}>
                        {c.status==='done'&&(
                          <button onClick={()=>openFollowUp(c)} className="hov-btn"
                            style={{...btnGhost,fontSize:11,padding:'4px 10px',color:C.purple,borderColor:C.purple+'44'}}>
                            Follow Up
                          </button>
                        )}
                        {c.status==='scheduled'&&(
                          <button onClick={()=>openEdit(c as any)} className="hov-btn"
                            style={{...btnGhost,fontSize:11,padding:'4px 10px',color:C.green,borderColor:C.green+'44'}}>
                            Edit
                          </button>
                        )}
                        {['scheduled','in_progress','paused'].includes(c.status)&&(
                          <button onClick={()=>pauseResume(c)} className="hov-btn"
                            style={{...btnGhost,fontSize:11,padding:'4px 10px',
                              color:c.status==='paused'?C.green:C.amber,
                              borderColor:(c.status==='paused'?C.green:C.amber)+'44'}}>
                            {c.status==='paused'?'Resume':'Pause'}
                          </button>
                        )}
                        <button onClick={()=>fetchFailed(c.id)} className="hov-btn"
                          style={{...btnGhost,fontSize:11,padding:'4px 10px',
                            color:openErrors===c.id?C.red:C.muted,
                            borderColor:openErrors===c.id?C.red+'55':C.border2}}>
                          Errors
                        </button>
                        <button onClick={()=>openDuplicate(c)} className="hov-btn"
                          style={{...btnGhost,fontSize:11,padding:'4px 10px'}}>
                          Clone
                        </button>
                        <button onClick={()=>deleteCampaign(c.id)}
                          style={{background:'none',border:'none',cursor:'pointer',
                            fontSize:18,color:C.muted,padding:'2px 4px',lineHeight:1,opacity:0.5}}>
                          ×
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EDIT PANEL */}
                  {editingId===c.id&&(
                    <Panel title="Edit Campaign" accent={C.green} tint={d?'rgba(16,185,129,0.03)':'rgba(16,185,129,0.015)'}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                        <div><label style={lbl}>From Name</label><input style={inp} value={editFromName} onChange={e=>setEditFromName(e.target.value)}/></div>
                        <div><label style={lbl}>Schedule Time</label><input type="datetime-local" style={inp} value={editScheduledAt} onChange={e=>setEditScheduledAt(e.target.value)}/></div>
                      </div>
                      <div style={{marginBottom:12}}><label style={lbl}>Subject</label><input style={inp} value={editSubject} onChange={e=>setEditSubject(e.target.value)}/></div>
                      <div style={{marginBottom:14}}><label style={lbl}>Body</label><textarea style={{...inp,height:110,resize:'vertical'}} value={editBody} onChange={e=>setEditBody(e.target.value)}/></div>
                      <div style={{display:'flex',gap:8}}>
                        <button style={{...btn,background:editSaving?C.muted:C.green,padding:'7px 16px',fontSize:12}} disabled={editSaving} onClick={saveEdit} className="hov-btn">{editSaving?'Saving…':'Save Changes'}</button>
                        <button style={{...btnGhost,padding:'7px 14px',fontSize:12}} onClick={()=>setEditingId(null)} className="hov-btn">Cancel</button>
                      </div>
                    </Panel>
                  )}

                  {/* CLONE PANEL */}
                  {dupSource?.id===c.id&&(
                    <Panel title="Clone Campaign" accent={C.cyan} tint={d?'rgba(14,165,233,0.03)':'rgba(14,165,233,0.015)'}>
                      <div style={{marginBottom:12}}><label style={lbl}>Campaign Name</label><input style={inp} value={dupName} onChange={e=>setDupName(e.target.value)}/></div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                        <div><label style={lbl}>From Name</label><input style={inp} value={dupFromName} onChange={e=>setDupFromName(e.target.value)}/></div>
                        <div><label style={lbl}>Schedule Time</label><input type="datetime-local" style={inp} value={dupScheduledAt} onChange={e=>setDupScheduledAt(e.target.value)}/></div>
                      </div>
                      <div style={{marginBottom:12}}><label style={lbl}>Subject</label><input style={inp} value={dupSubject} onChange={e=>setDupSubject(e.target.value)}/></div>
                      <div style={{marginBottom:14}}><label style={lbl}>Body</label><textarea style={{...inp,height:110,resize:'vertical'}} value={dupBody} onChange={e=>setDupBody(e.target.value)}/></div>
                      <div style={{display:'flex',gap:8}}>
                        <button style={{...btn,background:dupSaving?C.muted:C.cyan,padding:'7px 16px',fontSize:12}} disabled={dupSaving} onClick={saveDuplicate} className="hov-btn">{dupSaving?'Creating…':'Create Clone'}</button>
                        <button style={{...btnGhost,padding:'7px 14px',fontSize:12}} onClick={()=>setDupSource(null)} className="hov-btn">Cancel</button>
                      </div>
                    </Panel>
                  )}

                  {/* ERRORS PANEL */}
                  {openErrors===c.id&&(
                    <Panel title={`Failed Recipients${failedMap[c.id]?.length?` · ${failedMap[c.id].length}`:''}`} accent={C.red} tint={d?'rgba(239,68,68,0.03)':'rgba(239,68,68,0.015)'}>
                      {!failedMap[c.id]?.length
                        ? <div style={{fontSize:12,color:C.muted,padding:'4px 0',fontFamily:'DM Mono,monospace'}}>No failed recipients.</div>
                        : <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden'}}>
                            <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
                              <thead>
                                <tr style={{background:d?'rgba(0,0,0,0.4)':'rgba(0,0,0,0.04)'}}>
                                  {['Email','Error Message','Retried'].map(h=>(
                                    <th key={h} style={{padding:'7px 12px',textAlign:'left',fontSize:10,
                                      fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.muted}}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {failedMap[c.id].map((r:any,i:number)=>(
                                  <tr key={i} style={{borderTop:`1px solid ${C.border}`}} className="hov-row">
                                    <td style={{padding:'7px 12px',fontFamily:'DM Mono,monospace',color:C.text}}>{r.email}</td>
                                    <td style={{padding:'7px 12px',color:C.red,maxWidth:300}}>{r.error||'Unknown error'}</td>
                                    <td style={{padding:'7px 12px',color:C.muted,fontFamily:'DM Mono,monospace'}}>{r.retry_attempted?'YES':'—'}</td>
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
            <div style={{display:'flex',alignItems:'center',marginBottom:24}}>
              {['Details','Recipients','Compose','Schedule'].map((s,i)=>(
                <div key={s} style={{display:'flex',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,cursor:i+1<step?'pointer':'default'}}
                    onClick={()=>i+1<step&&setStep(i+1)}>
                    <div style={{width:22,height:22,borderRadius:'50%',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:10,fontWeight:700,fontFamily:'DM Mono,monospace',
                      transition:'all 0.2s',
                      background:step===i+1?C.accent:step>i+1?C.green:C.border,
                      color:step>=i+1?'#fff':C.muted,
                      boxShadow:step===i+1?`0 0 10px ${C.accent}66`:undefined}}>
                      {step>i+1?'✓':i+1}
                    </div>
                    <span style={{fontSize:12,fontWeight:step===i+1?600:400,letterSpacing:'0.01em',
                      color:step===i+1?C.accent:step>i+1?C.green:C.muted}}>{s}</span>
                  </div>
                  {i<3&&<div style={{width:28,height:1,margin:'0 10px',
                    background:step>i+1?C.green:C.border,transition:'background 0.3s'}}/>}
                </div>
              ))}
            </div>

            <div style={{...glassCard,padding:28}}>
              {error&&(
                <div style={{background:'rgba(239,68,68,0.09)',border:'1px solid rgba(239,68,68,0.25)',
                  color:'#f87171',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13}}>
                  {error}
                </div>
              )}

              {step===1&&(
                <div>
                  <h3 style={{fontWeight:700,fontSize:15,marginBottom:20}}>Campaign Details</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                    <div><label style={lbl}>Campaign Name</label><input style={inp} placeholder="SEO Outreach Q1" value={name} onChange={e=>setName(e.target.value)}/></div>
                    <div><label style={lbl}>From Name</label><input style={inp} placeholder="Aftab from DigiXFlyy" value={fromName} onChange={e=>setFromName(e.target.value)}/></div>
                  </div>
                  <div style={{marginBottom:20}}>
                    <label style={lbl}>Internal Notes <span style={{fontSize:10,fontWeight:400,textTransform:'none',opacity:0.7}}>(optional)</span></label>
                    <textarea style={{...inp,height:72,resize:'vertical'}} placeholder="e.g. Fitness leads from Google Maps" value={notes} onChange={e=>setNotes(e.target.value)}/>
                  </div>
                  <button style={btn} className="hov-btn" onClick={()=>{if(!name||!fromName){setError('Fill both fields');return;}setError('');setStep(2);}}>Continue →</button>
                </div>
              )}

              {step===2&&(
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                    <h3 style={{fontWeight:700,fontSize:15}}>Upload Recipients</h3>
                    <button className="hov-btn" onClick={()=>{
                      const h='email,name,first_name,city,state,phone,website,rating,is_safe_to_send';
                      const ex='john@example.com,John Smith,John,New York,NY,+1234567890,example.com,4.5,true';
                      const blob=new Blob([h+'\n'+ex],{type:'text/csv'});
                      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='recipients_template.csv';a.click();
                    }} style={{...btnGhost,fontSize:11,padding:'5px 12px'}}>↓ Template</button>
                  </div>
                  <p style={{fontSize:11,color:C.muted,marginBottom:14,fontFamily:'DM Mono,monospace',lineHeight:1.6}}>
                    email, name, first_name, city, state, phone, website, rating, is_safe_to_send
                  </p>
                  <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,cursor:'pointer',fontSize:12,color:C.muted}}>
                    <input type="checkbox" checked={safeFilter} onChange={e=>setSafeFilter(e.target.checked)} style={{accentColor:C.accent}}/>
                    Filter out unsafe contacts <span style={{fontFamily:'DM Mono,monospace',fontSize:10,opacity:0.8}}>(is_safe_to_send = false)</span>
                  </label>
                  {csvError&&<div style={{background:'rgba(239,68,68,0.09)',border:'1px solid rgba(239,68,68,0.25)',color:'#f87171',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13}}>{csvError}</div>}
                  <label style={{display:'block',border:`1px dashed ${C.border2}`,borderRadius:10,
                    padding:28,textAlign:'center',cursor:'pointer',marginBottom:14,
                    background:d?'rgba(43,127,255,0.015)':'transparent',transition:'border-color 0.2s'}}>
                    <input type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files?.[0]&&handleCSV(e.target.files[0])}/>
                    <div style={{fontSize:20,marginBottom:8,opacity:0.35}}>↑</div>
                    <div style={{fontWeight:600,fontSize:13,color:C.muted}}>Click to upload CSV</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:3,opacity:0.6}}>or drag and drop</div>
                  </label>
                  {recipients.length>0&&(
                    <>
                      <div style={{background:'rgba(16,185,129,0.09)',border:'1px solid rgba(16,185,129,0.25)',
                        borderRadius:8,padding:'9px 14px',fontSize:12,color:C.green,marginBottom:10,fontWeight:500}}>
                        ✓ {recipients.length} recipients loaded{filteredCount>0&&` · ${filteredCount} filtered`}
                      </div>
                      <div style={{maxHeight:130,overflowY:'auto',border:`1px solid ${C.border}`,borderRadius:8}}>
                        <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
                          <thead><tr style={{background:d?'rgba(0,0,0,0.3)':'rgba(0,0,0,0.03)'}}>
                            {['Email','Name','City','Safe'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',fontSize:10,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:C.muted}}>{h}</th>)}
                          </tr></thead>
                          <tbody>{recipients.slice(0,4).map((r,i)=>(
                            <tr key={i} style={{borderTop:`1px solid ${C.border}`}} className="hov-row">
                              <td style={{padding:'6px 10px',fontFamily:'DM Mono,monospace',fontSize:11}}>{r.email}</td>
                              <td style={{padding:'6px 10px',color:C.muted}}>{r.first_name||r.name||r.business_name||'—'}</td>
                              <td style={{padding:'6px 10px',color:C.muted}}>{r.city||'—'}</td>
                              <td style={{padding:'6px 10px',color:r.is_safe_to_send==='true'||r.is_safe_to_send==='1'?C.green:C.muted,fontFamily:'DM Mono,monospace'}}>
                                {r.is_safe_to_send==='true'||r.is_safe_to_send==='1'?'✓':'—'}
                              </td>
                            </tr>
                          ))}</tbody>
                        </table>
                        {recipients.length>4&&<div style={{padding:'5px 10px',fontSize:11,color:C.muted,fontFamily:'DM Mono,monospace'}}>+{recipients.length-4} more</div>}
                      </div>
                    </>
                  )}
                  <div style={{display:'flex',gap:8,marginTop:16}}>
                    <button style={btnGhost} className="hov-btn" onClick={()=>setStep(1)}>← Back</button>
                    <button style={btn} className="hov-btn" onClick={()=>{if(!recipients.length){setError('Upload CSV first');return;}setError('');setStep(3);}}>Continue →</button>
                  </div>
                </div>
              )}

              {step===3&&(
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <h3 style={{fontWeight:700,fontSize:15}}>Compose Email</h3>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:12,color:C.muted}}>A/B Test</span>
                      <div onClick={()=>setAbEnabled(!abEnabled)}
                        style={{width:34,height:18,borderRadius:9,cursor:'pointer',
                          background:abEnabled?C.accent:C.border2,position:'relative',transition:'background 0.2s'}}>
                        <div style={{position:'absolute',top:2,left:abEnabled?16:2,
                          width:14,height:14,borderRadius:'50%',background:'#fff',
                          transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.4)'}}/>
                      </div>
                    </div>
                  </div>
                  {abEnabled&&(
                    <div style={{display:'flex',gap:6,marginBottom:14}}>
                      {[0,1].map(i=>(
                        <button key={i} onClick={()=>setActiveVariant(i)} className="hov-btn"
                          style={{padding:'5px 14px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',
                            border:`1px solid ${activeVariant===i?C.accent:C.border2}`,
                            background:activeVariant===i?d?'rgba(43,127,255,0.12)':'rgba(43,127,255,0.07)':'transparent',
                            color:activeVariant===i?C.accent:C.muted}}>
                          Variant {String.fromCharCode(65+i)}
                          <span style={{marginLeft:5,fontSize:10,opacity:0.6,fontFamily:'DM Mono,monospace'}}>50%</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Subject Line</label>
                    <input style={inp} placeholder="Quick question for {{name}}" value={variants[activeVariant].subject} onChange={e=>updateVariant(activeVariant,'subject',e.target.value)}/>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={lbl}>Insert Tag</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {TAGS.map(t=>(
                        <button key={t} onClick={()=>insertTag(t)} className="hov-btn"
                          style={{fontSize:10,padding:'3px 8px',borderRadius:4,cursor:'pointer',
                            fontFamily:'DM Mono,monospace',border:`1px solid ${C.border2}`,
                            background:'transparent',color:C.muted2,transition:'all 0.1s'}}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea ref={bodyRef} style={{...inp,height:180,resize:'vertical',marginTop:8,marginBottom:12}}
                    placeholder={'Hi {{first_name}},\n\nI came across {{name}} in {{city}}...'}
                    value={variants[activeVariant].body} onChange={e=>updateVariant(activeVariant,'body',e.target.value)}/>
                  {recipients.length>0&&variants[activeVariant].subject&&(
                    <div style={{border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14,
                      background:d?'rgba(0,0,0,0.25)':'rgba(0,0,0,0.015)'}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
                        color:C.muted,marginBottom:10,fontFamily:'DM Mono,monospace'}}>
                        PREVIEW — {recipients[0].email}
                      </div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:8,color:C.text}}>
                        {preview(variants[activeVariant].subject,recipients[0])}
                      </div>
                      <div style={{fontSize:12,color:C.muted,whiteSpace:'pre-wrap',lineHeight:1.7}}>
                        {preview(variants[activeVariant].body,recipients[0])}
                      </div>
                    </div>
                  )}
                  <div style={{display:'flex',gap:8}}>
                    <button style={btnGhost} className="hov-btn" onClick={()=>setStep(2)}>← Back</button>
                    <button style={btn} className="hov-btn" onClick={()=>{if(!variants[0].subject||!variants[0].body){setError('Fill subject and body');return;}setError('');setStep(4);}}>Continue →</button>
                  </div>
                </div>
              )}

              {step===4&&(
                <div>
                  <h3 style={{fontWeight:700,fontSize:15,marginBottom:20}}>Schedule</h3>
                  <div style={{marginBottom:14}}>
                    <label style={lbl}>Start Sending At <span style={{fontSize:10,fontWeight:400,textTransform:'none',opacity:0.7}}>(local time)</span></label>
                    <input type="datetime-local" style={inp} value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Daily Send Window (IST)</label>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:6}}>
                      <div><label style={{...lbl,opacity:0.7}}>Start</label><input type="time" style={inp} value={windowStart} onChange={e=>setWindowStart(e.target.value)}/></div>
                      <div><label style={{...lbl,opacity:0.7}}>End</label><input type="time" style={inp} value={windowEnd} onChange={e=>setWindowEnd(e.target.value)}/></div>
                    </div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:'DM Mono,monospace'}}>
                      e.g. 20:00–01:00 IST = US daytime · overnight windows supported
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
                        <div style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',
                          borderRadius:8,padding:'8px 12px',fontSize:11,color:C.green,
                          marginBottom:16,fontFamily:'DM Mono,monospace'}}>
                          ✓ {windowMins}min window · max {maxEmails} emails/day
                        </div>
                        <div style={{marginBottom:16}}>
                          <label style={lbl}>
                            Emails Per Day
                            <span style={{fontFamily:'DM Mono,monospace',fontWeight:500,textTransform:'none',
                              marginLeft:8,color:C.accent,fontSize:12}}>{cappedLimit}{dailyLimit>maxEmails?' (capped)':''}</span>
                          </label>
                          <input type="range" min={5} max={maxEmails} step={5} style={{width:'100%',marginTop:6}} value={cappedLimit} onChange={e=>setDailyLimit(Number(e.target.value))}/>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.muted,marginTop:4,fontFamily:'DM Mono,monospace'}}>
                            <span>5</span><span>{Math.floor(maxEmails/2)}</span><span>{maxEmails}</span>
                          </div>
                          <div style={{fontSize:11,color:C.muted,marginTop:8,fontFamily:'DM Mono,monospace'}}>
                            1 email every {gap} min
                          </div>
                        </div>
                        <div style={{...glassCard,padding:16,marginBottom:22,
                          background:d?'rgba(43,127,255,0.04)':'rgba(43,127,255,0.025)',
                          borderColor:'rgba(43,127,255,0.18)'}}>
                          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',
                            color:C.accent,marginBottom:12,fontFamily:'DM Mono,monospace'}}>SEND SUMMARY</div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
                            {[
                              ['Recipients',  `${recipients.length}`],
                              ['Daily limit',  `${cappedLimit} emails`],
                              ['Interval',     `${gap} min`],
                              ['Est. duration',`~${daysToComplete} day${daysToComplete!==1?'s':''}`],
                              ['Window',       `${windowStart}–${windowEnd} IST`],
                              ['Starts', scheduledAt?new Date(scheduledAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})+' IST':'—'],
                            ].map(([k,v])=>(
                              <div key={k} style={{display:'flex',justifyContent:'space-between',
                                fontSize:11,padding:'6px 0',borderBottom:`1px solid ${C.border}`,gap:8}}>
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
                    <button style={btnGhost} className="hov-btn" onClick={()=>setStep(3)}>← Back</button>
                    <button style={{...btn,background:submitting?C.muted:C.green}} disabled={submitting} onClick={handleSubmit} className="hov-btn">
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
            <button onClick={()=>setView('list')} className="hov-btn"
              style={{...btnGhost,padding:'5px 12px',fontSize:12,marginBottom:20}}>← Back</button>
            <h2 style={{fontSize:15,fontWeight:700,marginBottom:4,letterSpacing:'-0.01em'}}>
              Follow Up
              <span style={{fontWeight:400,color:C.muted,marginLeft:8}}>{fuCampaign.name}</span>
            </h2>
            <p style={{fontSize:12,color:C.muted,marginBottom:18}}>Uncheck anyone who replied — we'll only follow up the rest.</p>
            <div style={{...glassCard,padding:16,marginBottom:14}}>
              <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
                <input style={{...inp,flex:1,minWidth:160}} placeholder="Search…" value={fuSearch} onChange={e=>setFuSearch(e.target.value)}/>
                <span style={{fontSize:11,fontFamily:'DM Mono,monospace',color:C.muted,whiteSpace:'nowrap'}}>
                  {fuRecs.filter(r=>r.selected).length}/{fuRecs.length}
                </span>
                <button onClick={()=>setFuRecs(r=>r.map(x=>({...x,selected:false})))} className="hov-btn" style={{...btnGhost,fontSize:11,padding:'5px 10px'}}>None</button>
                <button onClick={()=>setFuRecs(r=>r.map(x=>({...x,selected:true})))} className="hov-btn" style={{...btn,fontSize:11,padding:'5px 10px'}}>All</button>
              </div>
              <div style={{maxHeight:220,overflowY:'auto',border:`1px solid ${C.border}`,borderRadius:8}}>
                {fuRecs.filter(r=>r.email.includes(fuSearch)||r.name.toLowerCase().includes(fuSearch.toLowerCase())).map(r=>(
                  <div key={r.id} onClick={()=>setFuRecs(prev=>prev.map(x=>x.id===r.id?{...x,selected:!x.selected}:x))}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',
                      borderBottom:`1px solid ${C.border}`,cursor:'pointer',
                      background:r.selected?'transparent':d?'rgba(239,68,68,0.06)':'rgba(239,68,68,0.025)'}}
                    className="hov-row">
                    <input type="checkbox" checked={r.selected} onChange={()=>{}} onClick={e=>e.stopPropagation()} style={{accentColor:C.accent}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontFamily:'DM Mono,monospace',color:C.text}}>{r.email}</div>
                      {r.name&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>{r.name}</div>}
                    </div>
                    {!r.selected&&<span style={{fontSize:9,color:C.red,fontFamily:'DM Mono,monospace',fontWeight:700,letterSpacing:'0.08em'}}>SKIP</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{...glassCard,padding:22}}>
              <h3 style={{fontWeight:700,fontSize:14,marginBottom:14}}>Compose Follow-Up</h3>
              <div style={{marginBottom:12}}><label style={lbl}>Subject</label><input style={inp} value={fuSubject} onChange={e=>setFuSubject(e.target.value)}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Body</label><textarea style={{...inp,height:120,resize:'vertical'}} value={fuBody} onChange={e=>setFuBody(e.target.value)}/></div>
              <div style={{marginBottom:18}}><label style={lbl}>Schedule At</label><input type="datetime-local" style={inp} value={fuSchedule} onChange={e=>setFuSchedule(e.target.value)}/></div>
              <button style={{...btn,background:fuSubmitting?C.muted:C.purple}} disabled={fuSubmitting} onClick={sendFollowUp} className="hov-btn">
                {fuSubmitting?'Scheduling…':`↑ Follow Up ${fuRecs.filter(r=>r.selected).length} people`}
              </button>
            </div>
          </div>
        )}

        {/* ── TEST EMAIL ── */}
        {view==='test'&&(
          <div style={{maxWidth:500}}>
            <h2 style={{fontSize:15,fontWeight:700,marginBottom:18,letterSpacing:'-0.01em'}}>Test Email</h2>
            <div style={{...glassCard,padding:26}}>
              <div style={{marginBottom:12}}><label style={lbl}>To</label><input style={inp} placeholder="your@email.com" value={testEmail} onChange={e=>setTestEmail(e.target.value)}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Subject</label><input style={inp} value={testSubject} onChange={e=>setTestSubject(e.target.value)}/></div>
              <div style={{marginBottom:18}}><label style={lbl}>Body</label><textarea style={{...inp,height:130,resize:'vertical'}} value={testBody} onChange={e=>setTestBody(e.target.value)}/></div>
              {testResult&&(
                <div style={{borderRadius:8,padding:'9px 14px',marginBottom:14,fontSize:12,
                  fontFamily:'DM Mono,monospace',letterSpacing:'0.02em',
                  background:testResult.includes('✓')?'rgba(16,185,129,0.09)':'rgba(239,68,68,0.09)',
                  color:testResult.includes('✓')?C.green:C.red,
                  border:`1px solid ${testResult.includes('✓')?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`}}>
                  {testResult}
                </div>
              )}
              <button style={{...btn,background:testSending?C.muted:C.accent}} disabled={testSending} onClick={sendTest} className="hov-btn">
                {testSending?'Sending…':'↑ Send Test Email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
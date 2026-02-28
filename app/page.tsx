'use client';
import { useEffect, useState, useRef } from 'react';

type Recipient = { email: string; business_name?: string; phone?: string; city?: string; state?: string; status?: string; overall_score?: string; is_safe_to_send?: string; first_name?: string; company?: string; [key: string]: string | undefined };
type Variant = { subject: string; body: string };
type Campaign = { id: string; name: string; subject: string; status: string; scheduled_at: string; notes?: string; recipients: { count: number }[] };
type FollowUpRec = { id: string; email: string; name: string; selected: boolean };

const TAGS = ['{{first_name}}','{{business_name}}','{{company}}','{{city}}','{{state}}','{{email}}'];

export default function App() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<'list'|'create'|'test'|'followup'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [fromName, setFromName] = useState('');
  const [notes, setNotes] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredCount, setFilteredCount] = useState(0);
  const [safeFilter, setSafeFilter] = useState(true);
  const [csvError, setCsvError] = useState('');
  const [variants, setVariants] = useState<Variant[]>([{subject:'',body:''},{subject:'',body:''}]);
  const [activeVariant, setActiveVariant] = useState(0);
  const [abEnabled, setAbEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [testBody, setTestBody] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState('');
  // Follow-up state
  const [fuCampaign, setFuCampaign] = useState<Campaign|null>(null);
  const [fuRecs, setFuRecs] = useState<FollowUpRec[]>([]);
  const [fuSearch, setFuSearch] = useState('');
  const [fuSubject, setFuSubject] = useState('');
  const [fuBody, setFuBody] = useState('');
  const [fuSchedule, setFuSchedule] = useState('');
  const [fuSubmitting, setFuSubmitting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const d = dark;
  const bg = d?'#0f172a':'#f8fafc';
  const card = d?'#1e293b':'#fff';
  const border = d?'#334155':'#e2e8f0';
  const text = d?'#f1f5f9':'#1e293b';
  const muted = d?'#94a3b8':'#64748b';

  const fetchCampaigns = async () => {
    try { const r = await fetch('/api/campaigns'); setCampaigns(await r.json()); } catch {}
  };
  useEffect(() => { fetchCampaigns(); }, []);

  const handleCSV = (file: File) => {
    setCsvError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g,''));
      if (!headers.includes('email')) { setCsvError('CSV must have an "email" column'); return; }
      const all = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g,''));
        const obj: Recipient = {email:''};
        headers.forEach((h,i) => { obj[h] = vals[i]||''; });
        return obj;
      }).filter(r => r.email);
      const safe = all.filter(r => !safeFilter || r.is_safe_to_send==='true' || r.is_safe_to_send==='1' || !r.is_safe_to_send);
      setFilteredCount(all.length - safe.length);
      setRecipients(safe);
    };
    reader.readAsText(file);
  };

  const insertTag = (tag: string) => {
    const ta = bodyRef.current; if (!ta) return;
    const s = ta.selectionStart, e2 = ta.selectionEnd;
    const nb = variants[activeVariant].body.slice(0,s)+tag+variants[activeVariant].body.slice(e2);
    updateVariant(activeVariant,'body',nb);
    setTimeout(()=>{ ta.selectionStart=ta.selectionEnd=s+tag.length; ta.focus(); },0);
  };

  const updateVariant = (idx: number, field: 'subject'|'body', val: string) =>
    setVariants(v => v.map((x,i) => i===idx?{...x,[field]:val}:x));

  const preview = (text: string, r?: Recipient) => {
    if (!r) return text;
    return text
      .replace(/{{first_name}}/gi, r.first_name||r.business_name?.split(' ')[0]||'there')
      .replace(/{{business_name}}/gi, r.business_name||'')
      .replace(/{{company}}/gi, r.company||r.business_name||'')
      .replace(/{{city}}/gi, r.city||'')
      .replace(/{{state}}/gi, r.state||'')
      .replace(/{{email}}/gi, r.email||'');
  };

  const handleSubmit = async () => {
    setError('');
    if (!name||!fromName||!scheduledAt) { setError('Fill campaign name, from name and schedule time'); return; }
    if (!recipients.length) { setError('Upload a CSV with recipients'); return; }
    if (!variants[0].subject||!variants[0].body) { setError('Fill subject and body for Variant A'); return; }
    const recs = recipients.map((r,i) => {
      const isB = abEnabled && variants[1].subject && i >= Math.floor(recipients.length/2);
      return { email: r.email, name: r.first_name||r.business_name||'',
        subject_override: isB ? variants[1].subject : null,
        body_override: isB ? variants[1].body : null,
        metadata: JSON.stringify(r) };
    });
    setSubmitting(true);
    const res = await fetch('/api/campaigns', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, from_name:fromName, subject:variants[0].subject, body:variants[0].body,
        scheduled_at: new Date(scheduledAt).toISOString(), delay_seconds:delaySeconds, notes, recipients:recs }) });
    setSubmitting(false);
    if (res.ok) {
      setView('list'); setStep(1); setName(''); setFromName(''); setNotes('');
      setRecipients([]); setVariants([{subject:'',body:''},{subject:'',body:''}]); setScheduledAt('');
      fetchCampaigns();
    } else { const d2=await res.json(); setError(d2.error||'Error'); }
  };

  const duplicate = async (id: string) => {
    await fetch('/api/campaigns', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'duplicate', parent_campaign_id:id }) });
    fetchCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete?')) return;
    await fetch(`/api/campaigns?id=${id}`, { method:'DELETE' });
    fetchCampaigns();
  };

  const openFollowUp = async (c: Campaign) => {
    setFuCampaign(c); setFuSearch(''); setFuSubject('Re: '+c.name); setFuBody(''); setFuSchedule('');
    const res = await fetch(`/api/recipients?campaign_id=${c.id}`);
    const data = await res.json();
    setFuRecs((data||[]).map((r: any) => ({...r, selected:true})));
    setView('followup');
  };

  const sendFollowUp = async () => {
    const selected = fuRecs.filter(r => r.selected);
    if (!selected.length||!fuSubject||!fuBody||!fuSchedule) return;
    setFuSubmitting(true);
    await fetch('/api/campaigns', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: fuCampaign?.name+' — Follow Up', from_name:'Follow Up',
        subject:fuSubject, body:fuBody, scheduled_at:new Date(fuSchedule).toISOString(),
        delay_seconds:delaySeconds, parent_campaign_id:fuCampaign?.id,
        recipients: selected.map(r=>({email:r.email,name:r.name})) }) });
    setFuSubmitting(false); setView('list'); fetchCampaigns();
  };

  const sendTest = async () => {
    if (!testEmail||!testSubject||!testBody) { setTestResult('Fill all fields'); return; }
    setTestSending(true); setTestResult('');
    const res = await fetch('/api/test-email', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ to:testEmail, subject:testSubject, body:testBody }) });
    setTestSending(false);
    setTestResult(res.ok?'✅ Sent! Check your inbox.':'❌ Failed. Check env vars.');
  };

  const STATUS_STYLE: Record<string,React.CSSProperties> = {
    scheduled:{background:'#dbeafe',color:'#1d4ed8'}, sending:{background:'#fef9c3',color:'#a16207'},
    done:{background:'#dcfce7',color:'#15803d'}, failed:{background:'#fee2e2',color:'#dc2626'},
    draft:{background:'#f1f5f9',color:'#64748b'}
  };

  const lbl: React.CSSProperties = {display:'block',fontSize:13,fontWeight:600,color:muted,marginBottom:4};
  const inp: React.CSSProperties = {display:'block',width:'100%',border:`1px solid ${border}`,borderRadius:8,padding:'8px 12px',fontSize:14,color:text,outline:'none',boxSizing:'border-box',background:card};
  const btn: React.CSSProperties = {background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontSize:14,fontWeight:600,cursor:'pointer'};

  const fuFiltered = fuRecs.filter(r => r.email.includes(fuSearch)||r.name.toLowerCase().includes(fuSearch.toLowerCase()));

  return (
    <div style={{fontFamily:'system-ui,sans-serif',minHeight:'100vh',background:bg,color:text,transition:'background 0.2s'}}>
      <nav style={{background:card,borderBottom:`1px solid ${border}`,padding:'0 24px',display:'flex',alignItems:'center',height:56}}>
        <span style={{fontWeight:700,fontSize:16}}>✉️ AutoEmail</span>
        <div style={{display:'flex',gap:4,marginLeft:'auto',alignItems:'center'}}>
          {(['list','create','test'] as const).map(v=>(
            <button key={v} onClick={()=>{setView(v);setStep(1);}}
              style={{padding:'6px 14px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:500,fontSize:13,
                background:view===v?'#2563eb':'transparent',color:view===v?'#fff':muted}}>
              {v==='list'?'Campaigns':v==='create'?'+ New':'Quick Test'}
            </button>
          ))}
          <button onClick={()=>setDark(!d)} style={{marginLeft:8,background:'none',border:`1px solid ${border}`,borderRadius:8,padding:'5px 10px',cursor:'pointer',fontSize:15}}>
            {d?'☀️':'🌙'}
          </button>
        </div>
      </nav>

      <div style={{maxWidth:860,margin:'32px auto',padding:'0 16px'}}>

        {/* CAMPAIGN LIST */}
        {view==='list' && (
          <div>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>Campaigns</h2>
            {campaigns.length===0 && <div style={{textAlign:'center',padding:48,color:muted}}>No campaigns yet.</div>}
            {campaigns.map(c=>(
              <div key={c.id} style={{background:card,borderRadius:12,border:`1px solid ${border}`,padding:'14px 18px',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontWeight:600}}>{c.name}</span>
                      <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600,...(STATUS_STYLE[c.status]||{})}}>{c.status}</span>
                    </div>
                    <div style={{fontSize:13,color:muted,marginTop:2}}>
                      {c.subject} · {c.recipients?.[0]?.count??0} recipients · {new Date(c.scheduled_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST
                    </div>
                    {c.notes && <div style={{fontSize:12,color:muted,marginTop:4,fontStyle:'italic'}}>📝 {c.notes}</div>}
                  </div>
                  <div style={{display:'flex',gap:8,flexShrink:0,marginLeft:12}}>
                    {c.status==='done' && (
                      <button onClick={()=>openFollowUp(c)} style={{...btn,padding:'5px 12px',fontSize:12,background:'#7c3aed'}}>Follow Up</button>
                    )}
                    <button onClick={()=>duplicate(c.id)} style={{...btn,padding:'5px 12px',fontSize:12,background:'#0891b2'}}>Duplicate</button>
                    <button onClick={()=>deleteCampaign(c.id)} style={{color:'#ef4444',background:'none',border:'none',cursor:'pointer',fontSize:13}}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CREATE */}
        {view==='create' && (
          <div>
            <div style={{display:'flex',gap:0,marginBottom:28}}>
              {['Details','Recipients','Compose','Schedule'].map((s,i)=>(
                <div key={s} style={{display:'flex',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}} onClick={()=>i+1<step&&setStep(i+1)}>
                    <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,
                      background:step===i+1?'#2563eb':step>i+1?'#22c55e':'#e2e8f0',color:step>=i+1?'#fff':'#94a3b8'}}>{step>i+1?'✓':i+1}</div>
                    <span style={{fontSize:13,fontWeight:600,color:step===i+1?'#2563eb':muted}}>{s}</span>
                  </div>
                  {i<3&&<div style={{width:32,height:2,background:border,margin:'0 8px'}}/>}
                </div>
              ))}
            </div>
            <div style={{background:card,borderRadius:16,border:`1px solid ${border}`,padding:28}}>
              {error&&<div style={{background:'#fee2e2',color:'#dc2626',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13}}>{error}</div>}

              {step===1&&(
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:20}}>Campaign Details</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                    <div><label style={lbl}>Campaign Name</label><input style={inp} placeholder="Q1 Outreach" value={name} onChange={e=>setName(e.target.value)}/></div>
                    <div><label style={lbl}>From Name</label><input style={inp} placeholder="Aftab from DigiXFlyy" value={fromName} onChange={e=>setFromName(e.target.value)}/></div>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Internal Notes (optional)</label>
                    <textarea style={{...inp,height:72,resize:'vertical'}} placeholder="e.g. Leads from Google Maps scrape, fitness niche" value={notes} onChange={e=>setNotes(e.target.value)}/>
                  </div>
                  <button style={btn} onClick={()=>{if(!name||!fromName){setError('Fill both fields');return;}setError('');setStep(2);}}>Next →</button>
                </div>
              )}

              {step===2&&(
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:8}}>Upload Recipients CSV</h3>
                  <p style={{fontSize:13,color:muted,marginBottom:12}}>Columns: <code>email, business_name, phone, city, state, status, overall_score, is_safe_to_send</code></p>
                  <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,cursor:'pointer'}}>
                    <input type="checkbox" checked={safeFilter} onChange={e=>setSafeFilter(e.target.checked)}/>
                    <span style={{fontSize:13,color:muted}}>Auto-remove unsafe recipients (<code>is_safe_to_send = false</code>)</span>
                  </label>
                  {csvError&&<div style={{background:'#fee2e2',color:'#dc2626',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13}}>{csvError}</div>}
                  <label style={{display:'block',border:`2px dashed ${border}`,borderRadius:12,padding:32,textAlign:'center',cursor:'pointer',marginBottom:12}}>
                    <input type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files?.[0]&&handleCSV(e.target.files[0])}/>
                    <div style={{fontSize:32,marginBottom:8}}>📂</div>
                    <div style={{fontWeight:600,color:muted}}>Click to upload CSV</div>
                  </label>
                  {recipients.length>0&&(
                    <div>
                      <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#15803d',marginBottom:8}}>
                        ✅ {recipients.length} recipients loaded{filteredCount>0&&` · ${filteredCount} unsafe removed`}
                      </div>
                      <div style={{maxHeight:140,overflowY:'auto',border:`1px solid ${border}`,borderRadius:8}}>
                        <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
                          <thead><tr style={{background:d?'#0f172a':'#f8fafc'}}>
                            {['Email','Business','City','State','Safe?'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',color:muted,fontWeight:600}}>{h}</th>)}
                          </tr></thead>
                          <tbody>{recipients.slice(0,5).map((r,i)=>(
                            <tr key={i} style={{borderTop:`1px solid ${border}`}}>
                              <td style={{padding:'6px 10px'}}>{r.email}</td>
                              <td style={{padding:'6px 10px',color:muted}}>{r.business_name||'-'}</td>
                              <td style={{padding:'6px 10px',color:muted}}>{r.city||'-'}</td>
                              <td style={{padding:'6px 10px',color:muted}}>{r.state||'-'}</td>
                              <td style={{padding:'6px 10px',color:r.is_safe_to_send==='true'||r.is_safe_to_send==='1'?'#22c55e':'#ef4444'}}>
                                {r.is_safe_to_send==='true'||r.is_safe_to_send==='1'?'✅':'❌'}
                              </td>
                            </tr>
                          ))}</tbody>
                        </table>
                        {recipients.length>5&&<div style={{padding:'6px 10px',fontSize:12,color:muted}}>+{recipients.length-5} more</div>}
                      </div>
                    </div>
                  )}
                  <div style={{display:'flex',gap:10,marginTop:16}}>
                    <button style={{...btn,background:'#f1f5f9',color:'#475569'}} onClick={()=>setStep(1)}>← Back</button>
                    <button style={btn} onClick={()=>{if(!recipients.length){setError('Upload CSV first');return;}setError('');setStep(3);}}>Next →</button>
                  </div>
                </div>
              )}

              {step===3&&(
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <h3 style={{fontWeight:700,fontSize:16}}>Compose Email</h3>
                    <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer'}}>
                      <div onClick={()=>setAbEnabled(!abEnabled)} style={{width:36,height:20,borderRadius:10,background:abEnabled?'#2563eb':'#cbd5e1',position:'relative',cursor:'pointer'}}>
                        <div style={{position:'absolute',top:2,left:abEnabled?18:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}}/>
                      </div>
                      <span style={{fontWeight:600,color:abEnabled?'#2563eb':muted}}>A/B Test</span>
                    </label>
                  </div>
                  <div style={{display:'flex',gap:6,marginBottom:16}}>
                    {(abEnabled?[0,1]:[0]).map(i=>(
                      <button key={i} onClick={()=>setActiveVariant(i)}
                        style={{padding:'6px 16px',borderRadius:8,border:`2px solid ${activeVariant===i?'#2563eb':border}`,
                          background:activeVariant===i?'#eff6ff':card,color:activeVariant===i?'#2563eb':muted,fontWeight:600,fontSize:13,cursor:'pointer'}}>
                        Variant {String.fromCharCode(65+i)}{abEnabled&&<span style={{fontSize:11,marginLeft:6,color:muted}}>50%</span>}
                      </button>
                    ))}
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Subject Line</label>
                    <input style={inp} placeholder="Quick question for {{business_name}}" value={variants[activeVariant].subject} onChange={e=>updateVariant(activeVariant,'subject',e.target.value)}/>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={lbl}>Tags — click to insert at cursor</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                      {TAGS.map(t=><button key={t} onClick={()=>insertTag(t)} style={{fontSize:11,padding:'3px 8px',borderRadius:6,border:`1px solid ${border}`,background:d?'#0f172a':'#f8fafc',color:muted,cursor:'pointer',fontFamily:'monospace'}}>{t}</button>)}
                    </div>
                    <textarea ref={activeVariant===0?bodyRef:undefined} style={{...inp,height:180,resize:'vertical'}}
                      placeholder={`Hi {{first_name}},\n\nI came across {{business_name}} in {{city}}...`}
                      value={variants[activeVariant].body} onChange={e=>updateVariant(activeVariant,'body',e.target.value)}/>
                  </div>
                  {recipients.length>0&&variants[activeVariant].subject&&(
                    <div style={{background:d?'#0f172a':'#f8fafc',border:`1px solid ${border}`,borderRadius:10,padding:14,marginTop:8}}>
                      <div style={{fontSize:11,fontWeight:700,color:muted,marginBottom:6,letterSpacing:1}}>PREVIEW — {recipients[0].email}</div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Subject: {preview(variants[activeVariant].subject,recipients[0])}</div>
                      <div style={{fontSize:13,color:muted,whiteSpace:'pre-wrap'}}>{preview(variants[activeVariant].body,recipients[0])}</div>
                    </div>
                  )}
                  <div style={{display:'flex',gap:10,marginTop:16}}>
                    <button style={{...btn,background:'#f1f5f9',color:'#475569'}} onClick={()=>setStep(2)}>← Back</button>
                    <button style={btn} onClick={()=>{if(!variants[0].subject||!variants[0].body){setError('Fill subject and body');return;}setError('');setStep(4);}}>Next →</button>
                  </div>
                </div>
              )}

              {step===4&&(
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:20}}>Schedule</h3>
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Send At (local time)</label>
                    <input type="datetime-local" style={inp} value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/>
                    <div style={{fontSize:12,color:muted,marginTop:4}}>⏰ Sends between 8pm–1am IST only (best for USA open rates)</div>
                  </div>
                  <div style={{marginBottom:20}}>
                    <label style={lbl}>Delay Between Emails — {delaySeconds}s ({Math.floor(delaySeconds/60)}m {delaySeconds%60}s)</label>
                    <input type="range" min={60} max={300} step={10} style={{width:'100%',marginTop:4}} value={delaySeconds} onChange={e=>setDelaySeconds(Number(e.target.value))}/>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:muted,marginTop:2}}><span>1 min</span><span>2.5 min</span><span>5 min</span></div>
                  </div>
                  <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:14,marginBottom:20,fontSize:13}}>
                    <div style={{fontWeight:700,color:'#1d4ed8',marginBottom:6}}>Summary</div>
                    <div style={{color:'#1e40af'}}>📧 {recipients.length} recipients{abEnabled?' (50/50 A/B)':''}</div>
                    <div style={{color:'#1e40af'}}>⏱ ~{Math.round(recipients.length*delaySeconds/60)} min total</div>
                    <div style={{color:'#1e40af'}}>📅 {scheduledAt?new Date(scheduledAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST':'Not set'}</div>
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <button style={{...btn,background:'#f1f5f9',color:'#475569'}} onClick={()=>setStep(3)}>← Back</button>
                    <button style={{...btn,background:submitting?'#94a3b8':'#16a34a'}} disabled={submitting} onClick={handleSubmit}>{submitting?'Scheduling...':'🚀 Schedule'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOLLOW UP */}
        {view==='followup'&&fuCampaign&&(
          <div>
            <button onClick={()=>setView('list')} style={{background:'none',border:'none',color:muted,cursor:'pointer',fontSize:13,marginBottom:16}}>← Back to Campaigns</button>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Follow Up: {fuCampaign.name}</h2>
            <p style={{fontSize:13,color:muted,marginBottom:20}}>Uncheck anyone who already replied. We'll only follow up with the rest.</p>
            <div style={{background:card,borderRadius:16,border:`1px solid ${border}`,padding:24,marginBottom:20}}>
              <div style={{display:'flex',gap:12,marginBottom:12,alignItems:'center'}}>
                <input style={{...inp,flex:1}} placeholder="Search by email or name..." value={fuSearch} onChange={e=>setFuSearch(e.target.value)}/>
                <span style={{fontSize:13,color:muted,whiteSpace:'nowrap'}}>{fuRecs.filter(r=>r.selected).length} selected</span>
                <button onClick={()=>setFuRecs(r=>r.map(x=>({...x,selected:false})))} style={{...btn,background:'#f1f5f9',color:'#475569',padding:'8px 14px',fontSize:12}}>Deselect All</button>
                <button onClick={()=>setFuRecs(r=>r.map(x=>({...x,selected:true})))} style={{...btn,padding:'8px 14px',fontSize:12}}>Select All</button>
              </div>
              <div style={{maxHeight:280,overflowY:'auto',border:`1px solid ${border}`,borderRadius:8}}>
                {fuFiltered.map(r=>(
                  <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderBottom:`1px solid ${border}`,
                    background:r.selected?card:d?'#1a1a2e':'#fff5f5'}}>
                    <input type="checkbox" checked={r.selected} onChange={e=>setFuRecs(prev=>prev.map(x=>x.id===r.id?{...x,selected:e.target.checked}:x))}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{r.email}</div>
                      {r.name&&<div style={{fontSize:11,color:muted}}>{r.name}</div>}
                    </div>
                    {!r.selected&&<span style={{marginLeft:'auto',fontSize:11,color:'#ef4444'}}>excluded</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:card,borderRadius:16,border:`1px solid ${border}`,padding:24}}>
              <h3 style={{fontWeight:700,fontSize:15,marginBottom:16}}>Compose Follow-Up</h3>
              <div style={{marginBottom:12}}>
                <label style={lbl}>Subject</label>
                <input style={inp} value={fuSubject} onChange={e=>setFuSubject(e.target.value)}/>
              </div>
              <div style={{marginBottom:12}}>
                <label style={lbl}>Body</label>
                <textarea style={{...inp,height:140,resize:'vertical'}} placeholder="Just following up on my previous email..." value={fuBody} onChange={e=>setFuBody(e.target.value)}/>
              </div>
              <div style={{marginBottom:16}}>
                <label style={lbl}>Schedule At</label>
                <input type="datetime-local" style={inp} value={fuSchedule} onChange={e=>setFuSchedule(e.target.value)}/>
              </div>
              <button style={{...btn,background:fuSubmitting?'#94a3b8':'#7c3aed'}} disabled={fuSubmitting} onClick={sendFollowUp}>
                {fuSubmitting?'Scheduling...`':'🚀 Schedule Follow-Up to '+fuRecs.filter(r=>r.selected).length+' people'}
              </button>
            </div>
          </div>
        )}

        {/* QUICK TEST */}
        {view==='test'&&(
          <div style={{background:card,borderRadius:16,border:`1px solid ${border}`,padding:28,maxWidth:560}}>
            <h3 style={{fontWeight:700,fontSize:16,marginBottom:20}}>Quick Test Email</h3>
            <div style={{marginBottom:12}}><label style={lbl}>To</label><input style={inp} placeholder="your@email.com" value={testEmail} onChange={e=>setTestEmail(e.target.value)}/></div>
            <div style={{marginBottom:12}}><label style={lbl}>Subject</label><input style={inp} value={testSubject} onChange={e=>setTestSubject(e.target.value)}/></div>
            <div style={{marginBottom:16}}><label style={lbl}>Body</label><textarea style={{...inp,height:140,resize:'vertical'}} value={testBody} onChange={e=>setTestBody(e.target.value)}/></div>
            {testResult&&<div style={{background:testResult.includes('✅')?'#f0fdf4':'#fee2e2',color:testResult.includes('✅')?'#15803d':'#dc2626',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13}}>{testResult}</div>}
            <button style={{...btn,background:testSending?'#94a3b8':'#2563eb'}} disabled={testSending} onClick={sendTest}>{testSending?'Sending...':'✉️ Send Test'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
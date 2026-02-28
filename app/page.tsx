'use client';
import { useEffect, useState, useRef } from 'react';

type Recipient = { email: string; first_name?: string; business_name?: string; phone?: string; city?: string; state?: string; overall_score?: string; is_safe_to_send?: string; [key: string]: string | undefined };
type Variant = { subject: string; body: string };
type Campaign = { id: string; name: string; subject: string; status: string; scheduled_at: string; notes?: string; sent_count?: number; total_count?: number; recipients: { count: number }[] };
type FollowUpRec = { id: string; email: string; name: string; selected: boolean };

const TAGS = ['{{first_name}}','{{business_name}}','{{company}}','{{city}}','{{state}}','{{email}}'];
type View = 'list'|'create'|'test'|'followup';

export default function App() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<'list'|'create'|'test'|'followup'>('list');
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
  const [delaySeconds, setDelaySeconds] = useState(60);
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
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const d = dark;
  const bg = d?'#0f172a':'#f8fafc', card = d?'#1e293b':'#fff';
  const border = d?'#334155':'#e2e8f0', text = d?'#f1f5f9':'#1e293b', muted = d?'#94a3b8':'#64748b';
  const lbl: React.CSSProperties = {display:'block',fontSize:13,fontWeight:600,color:muted,marginBottom:4};
  const inp: React.CSSProperties = {display:'block',width:'100%',border:`1px solid ${border}`,borderRadius:8,padding:'8px 12px',fontSize:14,color:text,outline:'none',boxSizing:'border-box',background:card};
  const btn: React.CSSProperties = {background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontSize:14,fontWeight:600,cursor:'pointer'};

  const fetchCampaigns = async () => { try { const r = await fetch('/api/campaigns'); setCampaigns(await r.json()); } catch {} };
  useEffect(() => { fetchCampaigns(); }, []);

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

  const updateVariant = (idx: number, field: 'subject'|'body', val: string) =>
    setVariants(v=>v.map((x,i)=>i===idx?{...x,[field]:val}:x));

  const preview = (text: string, r?: Recipient) => {
    if (!r) return text;
    return text
      .replace(/{{first_name}}/gi, r.first_name||r.business_name?.split(' ')[0]||'there')
      .replace(/{{business_name}}/gi, r.business_name||'')
      .replace(/{{company}}/gi, r.business_name||'')
      .replace(/{{city}}/gi, r.city||'')
      .replace(/{{state}}/gi, r.state||'')
      .replace(/{{email}}/gi, r.email||'');
  };

  const handleSubmit = async () => {
    setError('');
    if (!name||!fromName||!scheduledAt) { setError('Fill name, from name and schedule time'); return; }
    if (!recipients.length) { setError('Upload a CSV first'); return; }
    if (!variants[0].subject||!variants[0].body) { setError('Fill subject and body'); return; }
    const recs = recipients.map((r,i) => {
      const isB = abEnabled && variants[1].subject && i >= Math.floor(recipients.length/2);
      return { email:r.email, name:r.first_name||r.business_name||'',
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

  const duplicate = async (id: string) => {
    await fetch('/api/campaigns', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'duplicate',parent_campaign_id:id}) });
    fetchCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete?')) return;
    await fetch(`/api/campaigns?id=${id}`, {method:'DELETE'});
    fetchCampaigns();
  };

  const openFollowUp = async (c: Campaign) => {
    setFuCampaign(c); setFuSearch(''); setFuSubject('Re: '+c.subject); setFuBody(''); setFuSchedule('');
    const res = await fetch(`/api/recipients?campaign_id=${c.id}`);
    setFuRecs((await res.json()||[]).map((r:any)=>({...r,selected:true})));
    setView('followup');
  };

  const sendFollowUp = async () => {
    const sel = fuRecs.filter(r=>r.selected);
    if (!sel.length||!fuSubject||!fuBody||!fuSchedule) return;
    setFuSubmitting(true);
    await fetch('/api/campaigns', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name:fuCampaign?.name+' — Follow Up', from_name:fromName||'Follow Up',
        subject:fuSubject, body:fuBody, scheduled_at:new Date(fuSchedule).toISOString(),
        delay_seconds:delaySeconds, window_start:windowStart, window_end:windowEnd,
        parent_campaign_id:fuCampaign?.id, total_count:sel.length, daily_limit:dailyLimit,
        recipients:sel.map(r=>({email:r.email,name:r.name})) }) });
    setFuSubmitting(false); setView('list'); fetchCampaigns();
  };

  const sendTest = async () => {
    if (!testEmail||!testSubject||!testBody) { setTestResult('Fill all fields'); return; }
    setTestSending(true); setTestResult('');
    const res = await fetch('/api/test-email', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({to:testEmail,subject:testSubject,body:testBody}) });
    setTestSending(false); setTestResult(res.ok?'✅ Sent!':'❌ Failed.');
  };

  const STATUS_S: Record<string,React.CSSProperties> = {
    scheduled:{background:'#dbeafe',color:'#1d4ed8'}, sending:{background:'#fef9c3',color:'#a16207'},
    in_progress:{background:'#ffedd5',color:'#c2410c'}, done:{background:'#dcfce7',color:'#15803d'},
    failed:{background:'#fee2e2',color:'#dc2626'}, draft:{background:'#f1f5f9',color:'#64748b'}
  };

  const navItems: {v:View,label:string}[] = [{v:'list',label:'Campaigns'},{v:'create',label:'+ New'},{v:'test',label:'Test Email'}];
  return (
    <div style={{fontFamily:'system-ui,sans-serif',minHeight:'100vh',background:bg,color:text,transition:'background 0.2s'}}>
      <nav style={{background:card,borderBottom:`1px solid ${border}`,padding:'0 24px',display:'flex',alignItems:'center',height:56}}>
        <span style={{fontWeight:700,fontSize:16}}>✉️ AutoEmail</span>
        <div style={{display:'flex',gap:4,marginLeft:'auto',alignItems:'center'}}>
          {navItems.map(({v,label})=>(
            <button key={v} onClick={()=>{setView(v);setStep(1);setError('');}}
              style={{padding:'6px 14px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:500,fontSize:13,
                background:view===v?'#2563eb':'transparent',color:view===v?'#fff':muted}}>
              {label}
            </button>
          ))}
          <button onClick={()=>setDark(!d)} style={{marginLeft:8,background:'none',border:`1px solid ${border}`,borderRadius:8,padding:'5px 10px',cursor:'pointer',fontSize:15}}>
            {d?'☀️':'🌙'}
          </button>
        </div>
      </nav>

      <div style={{maxWidth:900,margin:'32px auto',padding:'0 16px'}}>

        {/* CAMPAIGNS LIST */}
        {view==='list'&&(
          <div>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>Campaigns</h2>
            {campaigns.length===0&&<div style={{textAlign:'center',padding:48,color:muted}}>No campaigns yet.</div>}
            {campaigns.map(c=>(
              <div key={c.id} style={{background:card,borderRadius:12,border:`1px solid ${border}`,padding:'14px 18px',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontWeight:600}}>{c.name}</span>
                      <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600,...(STATUS_S[c.status]||{})}}>{c.status}</span>
                      {c.status==='in_progress'&&<span style={{fontSize:11,color:'#c2410c'}}>({c.sent_count||0}/{c.total_count||'?'} sent)</span>}
                    </div>
                    <div style={{fontSize:13,color:muted,marginTop:2}}>
                      {c.subject} · {c.recipients?.[0]?.count??0} recipients · {new Date(c.scheduled_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST
                    </div>
                    {c.notes&&<div style={{fontSize:12,color:muted,marginTop:3,fontStyle:'italic'}}>📝 {c.notes}</div>}
                  </div>
                  <div style={{display:'flex',gap:6,marginLeft:12,flexShrink:0}}>
                    {c.status==='done'&&<button onClick={()=>openFollowUp(c)} style={{...btn,padding:'5px 10px',fontSize:12,background:'#7c3aed'}}>Follow Up</button>}
                    <button onClick={()=>duplicate(c.id)} style={{...btn,padding:'5px 10px',fontSize:12,background:'#0891b2'}}>Duplicate</button>
                    <button onClick={()=>deleteCampaign(c.id)} style={{color:'#ef4444',background:'none',border:'none',cursor:'pointer',fontSize:13}}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


        {/* CREATE CAMPAIGN */}
        {view==='create'&&(
          <div>
            <div style={{display:'flex',gap:0,marginBottom:24}}>
              {['Details','Select Contacts','Compose','Schedule'].map((s,i)=>(
                <div key={s} style={{display:'flex',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer'}} onClick={()=>i+1<step&&setStep(i+1)}>
                    <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,
                      background:step===i+1?'#2563eb':step>i+1?'#22c55e':'#e2e8f0',color:step>=i+1?'#fff':'#94a3b8'}}>{step>i+1?'✓':i+1}</div>
                    <span style={{fontSize:12,fontWeight:600,color:step===i+1?'#2563eb':muted}}>{s}</span>
                  </div>
                  {i<3&&<div style={{width:24,height:2,background:border,margin:'0 6px'}}/>}
                </div>
              ))}
            </div>

            <div style={{background:card,borderRadius:16,border:`1px solid ${border}`,padding:28}}>
              {error&&<div style={{background:'#fee2e2',color:'#dc2626',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13}}>{error}</div>}

              {/* STEP 1 — Details */}
              {step===1&&(
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:20}}>Campaign Details</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                    <div><label style={lbl}>Campaign Name</label><input style={inp} placeholder="Q1 Outreach" value={name} onChange={e=>setName(e.target.value)}/></div>
                    <div><label style={lbl}>From Name</label><input style={inp} placeholder="Aftab from DigiXFlyy" value={fromName} onChange={e=>setFromName(e.target.value)}/></div>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Internal Notes (optional)</label>
                    <textarea style={{...inp,height:72,resize:'vertical'}} placeholder="e.g. Fitness leads from Google Maps" value={notes} onChange={e=>setNotes(e.target.value)}/>
                  </div>
                  <button style={btn} onClick={()=>{if(!name||!fromName){setError('Fill both fields');return;}setError('');setStep(2);}}>Next →</button>
                </div>
              )}

              {/* STEP 2 — Select Contacts */}
              {step===2&&(
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:4}}>Select Contacts</h3>
                  <p style={{fontSize:13,color:muted,marginBottom:12}}>Green = fresh (never used). Yellow = already used in another campaign.</p>
                  <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
                    <input style={{...inp,flex:1,minWidth:180}} placeholder="Search email, name, business..." value={contactSearch} onChange={e=>setContactSearch(e.target.value)}/>
                    <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer',whiteSpace:'nowrap'}}>
                      <input type="checkbox" checked={showUsed} onChange={e=>setShowUsed(e.target.checked)}/> Show used
                    </label>
                    <button onClick={()=>selectAll(filteredContacts.map(c=>c.id))} style={{...btn,padding:'6px 12px',fontSize:12}}>Select All ({filteredContacts.length})</button>
                    <button onClick={clearAll} style={{...btn,padding:'6px 12px',fontSize:12,background:'#f1f5f9',color:'#475569'}}>Clear</button>
                  </div>
                  {contactsLoading?<div style={{textAlign:'center',padding:32,color:muted}}>Loading contacts...</div>:(
                    <div style={{maxHeight:320,overflowY:'auto',border:`1px solid ${border}`,borderRadius:8,marginBottom:12}}>
                      {filteredContacts.length===0&&<div style={{padding:24,textAlign:'center',color:muted}}>No contacts found. <button onClick={()=>setView('contacts')} style={{color:'#2563eb',background:'none',border:'none',cursor:'pointer'}}>Upload contacts first →</button></div>}
                      {filteredContacts.map(c=>(
                        <div key={c.id} onClick={()=>toggleContact(c.id)}
                          style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderBottom:`1px solid ${border}`,cursor:'pointer',
                            background:selectedIds.has(c.id)?(d?'#1e3a5f':'#eff6ff'):card}}>
                          <input type="checkbox" checked={selectedIds.has(c.id)} onChange={()=>toggleContact(c.id)} onClick={e=>e.stopPropagation()}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:500}}>{c.email}</div>
                            <div style={{fontSize:11,color:muted}}>{[c.first_name,c.business_name,c.city,c.state].filter(Boolean).join(' · ')}</div>
                          </div>
                          <span style={{fontSize:11,padding:'2px 6px',borderRadius:4,background:c.contact_campaign_map?.length?'#fef3c7':'#dcfce7',color:c.contact_campaign_map?.length?'#92400e':'#15803d'}}>
                            {c.contact_campaign_map?.length?'used':'fresh'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{fontSize:13,color:muted,marginBottom:12}}>{selectedIds.size} contacts selected</div>
                  <div style={{display:'flex',gap:10}}>
                    <button style={{...btn,background:'#f1f5f9',color:'#475569'}} onClick={()=>setStep(1)}>← Back</button>
                    <button style={btn} onClick={()=>{if(!selectedIds.size){setError('Select at least one contact');return;}setError('');setStep(3);}}>Next →</button>
                  </div>
                </div>
              )}

              {/* STEP 3 — Compose */}
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
                        style={{padding:'6px 14px',borderRadius:8,border:`2px solid ${activeVariant===i?'#2563eb':border}`,
                          background:activeVariant===i?'#eff6ff':card,color:activeVariant===i?'#2563eb':muted,fontWeight:600,fontSize:13,cursor:'pointer'}}>
                        Variant {String.fromCharCode(65+i)}{abEnabled&&<span style={{fontSize:11,marginLeft:4,color:muted}}>50%</span>}
                      </button>
                    ))}
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Subject</label>
                    <input style={inp} placeholder="Quick question for {{business_name}}" value={variants[activeVariant].subject} onChange={e=>updateVariant(activeVariant,'subject',e.target.value)}/>
                  </div>
                  <label style={lbl}>Tags — click to insert</label>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                    {TAGS.map(t=><button key={t} onClick={()=>insertTag(t)} style={{fontSize:11,padding:'3px 8px',borderRadius:6,border:`1px solid ${border}`,background:d?'#0f172a':'#f8fafc',color:muted,cursor:'pointer',fontFamily:'monospace'}}>{t}</button>)}
                  </div>
                  <textarea ref={activeVariant===0?bodyRef:undefined} style={{...inp,height:180,resize:'vertical'}}
                    placeholder={`Hi {{first_name}},\n\nI came across {{business_name}} in {{city}}...`}
                    value={variants[activeVariant].body} onChange={e=>updateVariant(activeVariant,'body',e.target.value)}/>
                  {selectedContacts.length>0&&variants[activeVariant].subject&&(
                    <div style={{background:d?'#0f172a':'#f8fafc',border:`1px solid ${border}`,borderRadius:10,padding:14,marginTop:10}}>
                      <div style={{fontSize:11,fontWeight:700,color:muted,marginBottom:6,letterSpacing:1}}>PREVIEW — {selectedContacts[0].email}</div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Subject: {preview(variants[activeVariant].subject,selectedContacts[0])}</div>
                      <div style={{fontSize:13,color:muted,whiteSpace:'pre-wrap'}}>{preview(variants[activeVariant].body,selectedContacts[0])}</div>
                    </div>
                  )}
                  <div style={{display:'flex',gap:10,marginTop:16}}>
                    <button style={{...btn,background:'#f1f5f9',color:'#475569'}} onClick={()=>setStep(2)}>← Back</button>
                    <button style={btn} onClick={()=>{if(!variants[0].subject||!variants[0].body){setError('Fill subject and body');return;}setError('');setStep(4);}}>Next →</button>
                  </div>
                </div>
              )}

              {/* STEP 4 — Schedule */}
              {step===4&&(
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:20}}>Schedule</h3>
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Send At (your local time)</label>
                    <input type="datetime-local" style={inp} value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Send Window (IST) — emails only go out during this time each day</label>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div><label style={{...lbl,fontWeight:400}}>Start</label><input type="time" style={inp} value={windowStart} onChange={e=>setWindowStart(e.target.value)}/></div>
                      <div><label style={{...lbl,fontWeight:400}}>End</label><input type="time" style={inp} value={windowEnd} onChange={e=>setWindowEnd(e.target.value)}/></div>
                    </div>
                    <div style={{fontSize:12,color:muted,marginTop:4}}>Default 8pm–1am IST hits US morning inboxes. Overnight windows work automatically.</div>
                  </div>
                  <div style={{marginBottom:20}}>
                    <label style={lbl}>Delay Between Emails — {delaySeconds}s ({Math.floor(delaySeconds/60)}m {delaySeconds%60}s)</label>
                    <input type="range" min={60} max={300} step={10} style={{width:'100%',marginTop:4}} value={delaySeconds} onChange={e=>setDelaySeconds(Number(e.target.value))}/>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:muted,marginTop:2}}><span>1 min</span><span>2.5 min</span><span>5 min</span></div>
                  </div>
                  <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:14,marginBottom:20,fontSize:13}}>
                    <div style={{fontWeight:700,color:'#1d4ed8',marginBottom:6}}>Summary</div>
                    <div style={{color:'#1e40af'}}>📧 {selectedIds.size} contacts{abEnabled?' (50/50 A/B)':''}</div>
                    <div style={{color:'#1e40af'}}>⏱ ~{Math.round(selectedIds.size*delaySeconds/60)} min total send time</div>
                    <div style={{color:'#1e40af'}}>🕗 Window: {windowStart}–{windowEnd} IST daily</div>
                    <div style={{color:'#1e40af'}}>📅 Starts: {scheduledAt?new Date(scheduledAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST':'Not set'}</div>
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <button style={{...btn,background:'#f1f5f9',color:'#475569'}} onClick={()=>setStep(3)}>← Back</button>
                    <button style={{...btn,background:submitting?'#94a3b8':'#16a34a'}} disabled={submitting} onClick={handleSubmit}>{submitting?'Scheduling...':'🚀 Schedule Campaign'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOLLOW UP */}
        {view==='followup'&&fuCampaign&&(
          <div>
            <button onClick={()=>setView('list')} style={{background:'none',border:'none',color:muted,cursor:'pointer',fontSize:13,marginBottom:16}}>← Back</button>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Follow Up: {fuCampaign.name}</h2>
            <p style={{fontSize:13,color:muted,marginBottom:16}}>Uncheck anyone who replied. We'll only follow up with the rest.</p>
            <div style={{background:card,borderRadius:16,border:`1px solid ${border}`,padding:20,marginBottom:16}}>
              <div style={{display:'flex',gap:10,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
                <input style={{...inp,flex:1,minWidth:160}} placeholder="Search..." value={fuSearch} onChange={e=>setFuSearch(e.target.value)}/>
                <span style={{fontSize:13,color:muted,whiteSpace:'nowrap'}}>{fuRecs.filter(r=>r.selected).length}/{fuRecs.length} selected</span>
                <button onClick={()=>setFuRecs(r=>r.map(x=>({...x,selected:false})))} style={{...btn,background:'#f1f5f9',color:'#475569',padding:'7px 12px',fontSize:12}}>Deselect All</button>
                <button onClick={()=>setFuRecs(r=>r.map(x=>({...x,selected:true})))} style={{...btn,padding:'7px 12px',fontSize:12}}>Select All</button>
              </div>
              <div style={{maxHeight:260,overflowY:'auto',border:`1px solid ${border}`,borderRadius:8}}>
                {fuRecs.filter(r=>r.email.includes(fuSearch)||r.name.toLowerCase().includes(fuSearch.toLowerCase())).map(r=>(
                  <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderBottom:`1px solid ${border}`,
                    background:r.selected?card:d?'#2d1515':'#fff5f5',cursor:'pointer'}} onClick={()=>setFuRecs(prev=>prev.map(x=>x.id===r.id?{...x,selected:!x.selected}:x))}>
                    <input type="checkbox" checked={r.selected} onChange={()=>{}} onClick={e=>e.stopPropagation()}/>
                    <div><div style={{fontSize:13}}>{r.email}</div>{r.name&&<div style={{fontSize:11,color:muted}}>{r.name}</div>}</div>
                    {!r.selected&&<span style={{marginLeft:'auto',fontSize:11,color:'#ef4444'}}>excluded (replied)</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:card,borderRadius:16,border:`1px solid ${border}`,padding:24}}>
              <h3 style={{fontWeight:700,fontSize:15,marginBottom:14}}>Compose Follow-Up</h3>
              <div style={{marginBottom:12}}><label style={lbl}>Subject</label><input style={inp} value={fuSubject} onChange={e=>setFuSubject(e.target.value)}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Body</label><textarea style={{...inp,height:130,resize:'vertical'}} value={fuBody} onChange={e=>setFuBody(e.target.value)}/></div>
              <div style={{marginBottom:16}}><label style={lbl}>Schedule At</label><input type="datetime-local" style={inp} value={fuSchedule} onChange={e=>setFuSchedule(e.target.value)}/></div>
              <button style={{...btn,background:fuSubmitting?'#94a3b8':'#7c3aed'}} disabled={fuSubmitting} onClick={sendFollowUp}>
                {fuSubmitting?'Scheduling...':'🚀 Follow Up '+fuRecs.filter(r=>r.selected).length+' people'}
              </button>
            </div>
          </div>
        )}

        {/* TEST EMAIL */}
        {view==='test'&&(
          <div style={{background:card,borderRadius:16,border:`1px solid ${border}`,padding:28,maxWidth:520}}>
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

// Manual paste sub-component
function ManualPaste({onSave,inp,btn,muted}:{onSave:(t:string)=>void,inp:React.CSSProperties,btn:React.CSSProperties,muted:string}) {
  const [text,setText]=useState('');
  return (
    <div>
      <textarea style={{...inp,height:80,resize:'vertical',fontFamily:'monospace',fontSize:12}} placeholder={"John Doe <john@acme.com>\njane@startup.io"} value={text} onChange={e=>setText(e.target.value)}/>
      <div style={{fontSize:11,color:muted,marginTop:4,marginBottom:8}}>{text.split('\n').filter(Boolean).length} emails detected</div>
      <button style={{...btn,padding:'7px 16px',fontSize:13}} onClick={()=>{onSave(text);setText('');}}>Save Contacts</button>
    </div>
  );
}
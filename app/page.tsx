'use client';
import { useEffect, useState, useRef } from 'react';

type Recipient = { email: string; business_name?: string; phone?: string; city?: string; state?: string; status?: string; overall_score?: string; is_safe_to_send?: string; first_name?: string; company?: string; [key: string]: string | undefined };
type Variant = { subject: string; body: string };
type Campaign = { id: string; name: string; subject: string; status: string; scheduled_at: string; recipients: { count: number }[] };

const TAGS = ['{{first_name}}','{{business_name}}','{{company}}','{{city}}','{{state}}','{{email}}'];

export default function App() {
  const [view, setView] = useState<'list'|'create'|'test'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [step, setStep] = useState(1); // 1=details, 2=recipients, 3=compose, 4=schedule
  const [name, setName] = useState('');
  const [fromName, setFromName] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
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
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const fetchCampaigns = async () => {
    try { const r = await fetch('/api/campaigns'); setCampaigns(await r.json()); } catch {}
  };

  useEffect(() => { fetchCampaigns(); }, []);

  // Parse CSV
  const handleCSV = (file: File) => {
    setCsvError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      if (!headers.includes('email')) { setCsvError('CSV must have an "email" column'); return; }
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: Recipient = { email: '' };
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      }).filter(r => r.email);
      setRecipients(rows);
    };
    reader.readAsText(file);
  };

  // Insert tag at cursor
  const insertTag = (tag: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const newBody = variants[activeVariant].body.slice(0, start) + tag + variants[activeVariant].body.slice(end);
    updateVariant(activeVariant, 'body', newBody);
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + tag.length; ta.focus(); }, 0);
  };

  const updateVariant = (idx: number, field: 'subject'|'body', val: string) => {
    setVariants(v => v.map((x, i) => i === idx ? {...x, [field]: val} : x));
  };

  // Personalize preview
  const preview = (text: string, r?: Recipient) => {
    if (!r) return text;
    return text
      .replace(/{{first_name}}/gi, r.first_name || r.business_name?.split(' ')[0] || 'there')
      .replace(/{{business_name}}/gi, r.business_name || '')
      .replace(/{{company}}/gi, r.company || r.business_name || '')
      .replace(/{{city}}/gi, r.city || '')
      .replace(/{{state}}/gi, r.state || '')
      .replace(/{{email}}/gi, r.email || '');
  };

  const handleSubmit = async () => {
    setError('');
    if (!name || !fromName || !scheduledAt) { setError('Fill campaign name, from name and schedule time'); return; }
    if (!recipients.length) { setError('Upload a CSV with recipients'); return; }
    if (!variants[0].subject || !variants[0].body) { setError('Fill in subject and body for Variant A'); return; }

    // Split recipients for A/B
    let recs = recipients;
    if (abEnabled && variants[1].subject && variants[1].body) {
      const half = Math.floor(recipients.length / 2);
      recs = recipients.map((r, i) => ({
        ...r,
        _variant: i < half ? 'A' : 'B',
        _subject: i < half ? variants[0].subject : variants[1].subject,
        _body: i < half ? variants[0].body : variants[1].body,
      }));
    }

    setSubmitting(true);
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, from_name: fromName,
        subject: variants[0].subject,
        body: variants[0].body,
        scheduled_at: new Date(scheduledAt).toISOString(),
        delay_seconds: delaySeconds,
        recipients: recs.map(r => ({
          email: r.email,
          name: r.first_name || r.business_name || '',
          subject_override: (r as any)._subject,
          body_override: (r as any)._body,
          metadata: JSON.stringify(r),
        })),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setView('list'); setStep(1); setName(''); setFromName(''); setRecipients([]);
      setVariants([{subject:'',body:''},{subject:'',body:''}]); setScheduledAt('');
      fetchCampaigns();
    } else {
      const d = await res.json(); setError(d.error || 'Error saving campaign');
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testSubject || !testBody) { setTestResult('Fill all fields'); return; }
    setTestSending(true); setTestResult('');
    const res = await fetch('/api/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: testEmail, subject: testSubject, body: testBody }),
    });
    setTestSending(false);
    setTestResult(res.ok ? '✅ Sent! Check your inbox.' : '❌ Failed. Check env vars.');
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete?')) return;
    await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
    fetchCampaigns();
  };

  const STATUS: Record<string,string> = {
    scheduled:'bg-blue-100 text-blue-700', sending:'bg-yellow-100 text-yellow-700',
    done:'bg-green-100 text-green-700', failed:'bg-red-100 text-red-700', draft:'bg-gray-100 text-gray-600'
  };

  return (
    <div style={{fontFamily:'system-ui,sans-serif',minHeight:'100vh',background:'#f8fafc'}}>
      {/* Nav */}
      <nav style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',display:'flex',alignItems:'center',gap:24,height:56}}>
        <span style={{fontWeight:700,fontSize:16,color:'#1e293b'}}>✉️ AutoEmail</span>
        <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
          {(['list','create','test'] as const).map(v => (
            <button key={v} onClick={() => { setView(v); setStep(1); }}
              style={{padding:'6px 14px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:500,fontSize:13,
                background: view===v ? '#2563eb' : 'transparent', color: view===v ? '#fff' : '#64748b'}}>
              {v==='list'?'Campaigns':v==='create'?'+ New Campaign':'Quick Test'}
            </button>
          ))}
        </div>
      </nav>

      <div style={{maxWidth:860,margin:'32px auto',padding:'0 16px'}}>

        {/* CAMPAIGN LIST */}
        {view==='list' && (
          <div>
            <h2 style={{fontSize:20,fontWeight:700,color:'#1e293b',marginBottom:16}}>Campaigns</h2>
            {campaigns.length===0 && <div style={{textAlign:'center',padding:48,color:'#94a3b8'}}>No campaigns yet. Create one!</div>}
            {campaigns.map(c => (
              <div key={c.id} style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:'14px 18px',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontWeight:600,color:'#1e293b'}}>{c.name}</span>
                    <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600,...(STATUS[c.status]?.split(' ').reduce((a,cls)=>{
                      if(cls.startsWith('bg-blue')) return {...a,background:'#dbeafe',color:'#1d4ed8'};
                      if(cls.startsWith('bg-green')) return {...a,background:'#dcfce7',color:'#15803d'};
                      if(cls.startsWith('bg-yellow')) return {...a,background:'#fef9c3',color:'#a16207'};
                      if(cls.startsWith('bg-red')) return {...a,background:'#fee2e2',color:'#dc2626'};
                      return {...a,background:'#f1f5f9',color:'#64748b'};
                    },{}))}}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{fontSize:13,color:'#64748b',marginTop:2}}>
                    {c.subject} · {c.recipients?.[0]?.count ?? 0} recipients · {new Date(c.scheduled_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST
                  </div>
                </div>
                {c.status==='scheduled' && (
                  <button onClick={() => deleteCampaign(c.id)} style={{color:'#ef4444',background:'none',border:'none',cursor:'pointer',fontSize:13}}>Delete</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CREATE CAMPAIGN */}
        {view==='create' && (
          <div>
            {/* Steps */}
            <div style={{display:'flex',gap:0,marginBottom:28}}>
              {['Details','Recipients','Compose','Schedule'].map((s,i) => (
                <div key={s} style={{display:'flex',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}} onClick={() => i+1 < step && setStep(i+1)}>
                    <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,
                      background: step===i+1?'#2563eb':step>i+1?'#22c55e':'#e2e8f0',
                      color: step>=i+1?'#fff':'#94a3b8'}}>
                      {step>i+1?'✓':i+1}
                    </div>
                    <span style={{fontSize:13,fontWeight:600,color:step===i+1?'#2563eb':'#94a3b8'}}>{s}</span>
                  </div>
                  {i<3 && <div style={{width:32,height:2,background:'#e2e8f0',margin:'0 8px'}}/>}
                </div>
              ))}
            </div>

            <div style={{background:'#fff',borderRadius:16,border:'1px solid #e2e8f0',padding:28}}>
              {error && <div style={{background:'#fee2e2',color:'#dc2626',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13}}>{error}</div>}

              {/* STEP 1 */}
              {step===1 && (
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:20,color:'#1e293b'}}>Campaign Details</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                    <div>
                      <label style={lbl}>Campaign Name</label>
                      <input style={inp} placeholder="Q1 Outreach" value={name} onChange={e=>setName(e.target.value)}/>
                    </div>
                    <div>
                      <label style={lbl}>From Name</label>
                      <input style={inp} placeholder="Aftab from DigiXFlyy" value={fromName} onChange={e=>setFromName(e.target.value)}/>
                    </div>
                  </div>
                  <button style={btn} onClick={() => { if(!name||!fromName){setError('Fill both fields');return;} setError(''); setStep(2); }}>Next →</button>
                </div>
              )}

              {/* STEP 2 */}
              {step===2 && (
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:8,color:'#1e293b'}}>Upload Recipients CSV</h3>
                  <p style={{fontSize:13,color:'#64748b',marginBottom:16}}>CSV must have: <code>email, business_name, phone, city, state, status, overall_score, is_safe_to_send</code></p>
                  {csvError && <div style={{background:'#fee2e2',color:'#dc2626',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13}}>{csvError}</div>}
                  <label style={{display:'block',border:'2px dashed #cbd5e1',borderRadius:12,padding:'32px',textAlign:'center',cursor:'pointer',marginBottom:16}}>
                    <input type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files?.[0]&&handleCSV(e.target.files[0])}/>
                    <div style={{fontSize:32,marginBottom:8}}>📂</div>
                    <div style={{fontWeight:600,color:'#475569'}}>Click to upload CSV</div>
                    <div style={{fontSize:12,color:'#94a3b8',marginTop:4}}>or drag and drop</div>
                  </label>
                  {recipients.length>0 && (
                    <div>
                      <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#15803d',marginBottom:12}}>
                        ✅ {recipients.length} recipients loaded
                        {recipients.filter(r=>r.is_safe_to_send==='true'||r.is_safe_to_send==='1').length > 0 &&
                          ` · ${recipients.filter(r=>r.is_safe_to_send==='true'||r.is_safe_to_send==='1').length} safe to send`}
                      </div>
                      <div style={{maxHeight:160,overflowY:'auto',border:'1px solid #e2e8f0',borderRadius:8}}>
                        <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
                          <thead><tr style={{background:'#f8fafc'}}>
                            {['Email','Business','City','State','Safe?'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',color:'#64748b',fontWeight:600}}>{h}</th>)}
                          </tr></thead>
                          <tbody>{recipients.slice(0,5).map((r,i)=>(
                            <tr key={i} style={{borderTop:'1px solid #f1f5f9'}}>
                              <td style={{padding:'6px 10px',color:'#1e293b'}}>{r.email}</td>
                              <td style={{padding:'6px 10px',color:'#64748b'}}>{r.business_name||'-'}</td>
                              <td style={{padding:'6px 10px',color:'#64748b'}}>{r.city||'-'}</td>
                              <td style={{padding:'6px 10px',color:'#64748b'}}>{r.state||'-'}</td>
                              <td style={{padding:'6px 10px',color: r.is_safe_to_send==='true'||r.is_safe_to_send==='1'?'#22c55e':'#ef4444'}}>
                                {r.is_safe_to_send==='true'||r.is_safe_to_send==='1'?'✅':'❌'}
                              </td>
                            </tr>
                          ))}</tbody>
                        </table>
                        {recipients.length>5 && <div style={{padding:'6px 10px',fontSize:12,color:'#94a3b8'}}>+{recipients.length-5} more</div>}
                      </div>
                    </div>
                  )}
                  <div style={{display:'flex',gap:10,marginTop:16}}>
                    <button style={{...btn,background:'#f1f5f9',color:'#475569'}} onClick={()=>setStep(1)}>← Back</button>
                    <button style={btn} onClick={()=>{if(!recipients.length){setError('Upload a CSV first');return;}setError('');setStep(3);}}>Next →</button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step===3 && (
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <h3 style={{fontWeight:700,fontSize:16,color:'#1e293b'}}>Compose Email</h3>
                    <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer'}}>
                      <div onClick={()=>setAbEnabled(!abEnabled)} style={{width:36,height:20,borderRadius:10,background:abEnabled?'#2563eb':'#cbd5e1',position:'relative',cursor:'pointer',transition:'background 0.2s'}}>
                        <div style={{position:'absolute',top:2,left:abEnabled?18:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}}/>
                      </div>
                      <span style={{fontWeight:600,color:abEnabled?'#2563eb':'#64748b'}}>A/B Test</span>
                    </label>
                  </div>

                  {/* Variant tabs */}
                  <div style={{display:'flex',gap:6,marginBottom:16}}>
                    {(abEnabled?[0,1]:[0]).map(i=>(
                      <button key={i} onClick={()=>setActiveVariant(i)}
                        style={{padding:'6px 16px',borderRadius:8,border:`2px solid ${activeVariant===i?'#2563eb':'#e2e8f0'}`,
                          background:activeVariant===i?'#eff6ff':'#fff',color:activeVariant===i?'#2563eb':'#64748b',
                          fontWeight:600,fontSize:13,cursor:'pointer'}}>
                        Variant {String.fromCharCode(65+i)}
                        {abEnabled && <span style={{fontSize:11,marginLeft:6,color:'#94a3b8'}}>50%</span>}
                      </button>
                    ))}
                  </div>

                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Subject Line</label>
                    <input style={inp} placeholder="Quick question for {{business_name}}"
                      value={variants[activeVariant].subject}
                      onChange={e=>updateVariant(activeVariant,'subject',e.target.value)}/>
                  </div>

                  <div style={{marginBottom:8}}>
                    <label style={lbl}>Personalization Tags — click to insert</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                      {TAGS.map(t=>(
                        <button key={t} onClick={()=>insertTag(t)}
                          style={{fontSize:11,padding:'3px 8px',borderRadius:6,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#475569',cursor:'pointer',fontFamily:'monospace'}}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <textarea ref={activeVariant===0?bodyRef:undefined} style={{...inp,height:180,resize:'vertical',fontFamily:'system-ui,sans-serif'}}
                      placeholder={`Hi {{first_name}},\n\nI came across {{business_name}} in {{city}} and wanted to reach out...`}
                      value={variants[activeVariant].body}
                      onChange={e=>updateVariant(activeVariant,'body',e.target.value)}/>
                  </div>

                  {/* Live preview */}
                  {recipients.length>0 && variants[activeVariant].subject && (
                    <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,padding:14,marginTop:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:8,letterSpacing:1}}>LIVE PREVIEW — {recipients[0].email}</div>
                      <div style={{fontSize:13,fontWeight:600,color:'#1e293b',marginBottom:4}}>Subject: {preview(variants[activeVariant].subject, recipients[0])}</div>
                      <div style={{fontSize:13,color:'#475569',whiteSpace:'pre-wrap'}}>{preview(variants[activeVariant].body, recipients[0])}</div>
                    </div>
                  )}

                  <div style={{display:'flex',gap:10,marginTop:16}}>
                    <button style={{...btn,background:'#f1f5f9',color:'#475569'}} onClick={()=>setStep(2)}>← Back</button>
                    <button style={btn} onClick={()=>{if(!variants[0].subject||!variants[0].body){setError('Fill subject and body');return;}setError('');setStep(4);}}>Next →</button>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step===4 && (
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,marginBottom:20,color:'#1e293b'}}>Schedule</h3>
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Send At (your local time)</label>
                    <input type="datetime-local" style={inp} value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/>
                    <div style={{fontSize:12,color:'#94a3b8',marginTop:4}}>Cron checks every minute — will send within 1 min of this time</div>
                  </div>
                  <div style={{marginBottom:20}}>
                    <label style={lbl}>Delay Between Emails — {delaySeconds}s ({Math.floor(delaySeconds/60)}m {delaySeconds%60}s)</label>
                    <input type="range" min={60} max={300} step={10} style={{width:'100%',marginTop:4}} value={delaySeconds} onChange={e=>setDelaySeconds(Number(e.target.value))}/>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#94a3b8',marginTop:2}}>
                      <span>1 min</span><span>2.5 min</span><span>5 min</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:14,marginBottom:20,fontSize:13}}>
                    <div style={{fontWeight:700,color:'#1d4ed8',marginBottom:6}}>Campaign Summary</div>
                    <div style={{color:'#1e40af'}}>📧 {recipients.length} recipients {abEnabled?'(50/50 A/B split)':''}</div>
                    <div style={{color:'#1e40af'}}>⏱ ~{Math.round(recipients.length * delaySeconds / 60)} min total send time</div>
                    <div style={{color:'#1e40af'}}>📅 {scheduledAt ? new Date(scheduledAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST' : 'Not set'}</div>
                    {abEnabled && <div style={{color:'#1e40af'}}>🧪 A/B: "{variants[0].subject}" vs "{variants[1].subject||'(empty)'}"</div>}
                  </div>

                  <div style={{display:'flex',gap:10}}>
                    <button style={{...btn,background:'#f1f5f9',color:'#475569'}} onClick={()=>setStep(3)}>← Back</button>
                    <button style={{...btn,background:submitting?'#94a3b8':'#16a34a'}} disabled={submitting} onClick={handleSubmit}>
                      {submitting?'Scheduling...':'🚀 Schedule Campaign'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUICK TEST */}
        {view==='test' && (
          <div style={{background:'#fff',borderRadius:16,border:'1px solid #e2e8f0',padding:28,maxWidth:560}}>
            <h3 style={{fontWeight:700,fontSize:16,marginBottom:20,color:'#1e293b'}}>Send Quick Test Email</h3>
            <div style={{marginBottom:12}}>
              <label style={lbl}>To Email</label>
              <input style={inp} placeholder="your@email.com" value={testEmail} onChange={e=>setTestEmail(e.target.value)}/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={lbl}>Subject</label>
              <input style={inp} placeholder="Test subject" value={testSubject} onChange={e=>setTestSubject(e.target.value)}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>Body</label>
              <textarea style={{...inp,height:140,resize:'vertical'}} placeholder="Email body..." value={testBody} onChange={e=>setTestBody(e.target.value)}/>
            </div>
            {testResult && <div style={{background: testResult.includes('✅')?'#f0fdf4':'#fee2e2', color: testResult.includes('✅')?'#15803d':'#dc2626', borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13}}>{testResult}</div>}
            <button style={{...btn,background:testSending?'#94a3b8':'#2563eb'}} disabled={testSending} onClick={sendTestEmail}>
              {testSending?'Sending...':'✉️ Send Test'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Shared styles
const lbl: React.CSSProperties = {display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:4};
const inp: React.CSSProperties = {display:'block',width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',fontSize:14,color:'#1e293b',outline:'none',boxSizing:'border-box',background:'#fff'};
const btn: React.CSSProperties = {background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontSize:14,fontWeight:600,cursor:'pointer'};
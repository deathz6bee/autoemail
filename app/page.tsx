'use client';
import { useEffect, useState } from 'react';

type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduled_at: string;
  recipients: { count: number }[];
};

type RecipientRow = { email: string; name: string };

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    from_name: '',
    subject: '',
    body: '',
    scheduled_at: '',
  });
  const [recipientText, setRecipientText] = useState('');
  const [error, setError] = useState('');

  const fetchCampaigns = async () => {
    const res = await fetch('/api/campaigns');
    const data = await res.json();
    setCampaigns(data);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const parseRecipients = (text: string): RecipientRow[] => {
    // Accepts: one per line, "Name <email>" or just "email"
    return text.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const match = line.match(/^(.+?)\s*<(.+?)>$/);
        if (match) return { name: match[1].trim(), email: match[2].trim() };
        return { name: '', email: line };
      });
  };

  const handleSubmit = async () => {
    setError('');
    const recipients = parseRecipients(recipientText);
    if (!recipients.length) { setError('Add at least one recipient'); return; }
    if (!form.name || !form.subject || !form.body || !form.scheduled_at) {
      setError('Fill all fields'); return;
    }

    setLoading(true);
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, recipients }),
    });
    setLoading(false);

    if (res.ok) {
      setView('list');
      setForm({ name: '', from_name: '', subject: '', body: '', scheduled_at: '' });
      setRecipientText('');
      fetchCampaigns();
    } else {
      const d = await res.json();
      setError(d.error || 'Something went wrong');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
    fetchCampaigns();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cold Email</h1>
            <p className="text-sm text-gray-500">Schedule campaigns, send while offline</p>
          </div>
          <button
            onClick={() => setView(view === 'list' ? 'create' : 'list')}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            {view === 'list' ? '+ New Campaign' : '← Back'}
          </button>
        </div>

        {/* Campaign List */}
        {view === 'list' && (
          <div className="space-y-3">
            {campaigns.length === 0 && (
              <div className="text-center py-16 text-gray-400">No campaigns yet. Create one!</div>
            )}
            {campaigns.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || ''}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {c.subject} · {c.recipients?.[0]?.count ?? 0} recipients ·{' '}
                    {new Date(c.scheduled_at).toLocaleString()}
                  </div>
                </div>
                {c.status === 'scheduled' && (
                  <button
                    onClick={() => deleteCampaign(c.id)}
                    className="text-red-400 hover:text-red-600 text-sm ml-4"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Campaign Form */}
        {view === 'create' && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">New Campaign</h2>

            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Campaign Name</span>
                <input className="input mt-1" placeholder="Q1 Outreach"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">From Name</span>
                <input className="input mt-1" placeholder="Raj from Acme"
                  value={form.from_name} onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))} />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Subject Line</span>
              <input className="input mt-1" placeholder="Quick question for you"
                value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Schedule At</span>
              <input type="datetime-local" className="input mt-1"
                value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">Cron runs hourly — email sends within 1 hour of this time</p>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email Body (HTML or plain)</span>
              <p className="text-xs text-gray-400">Use {`{{name}}`} for personalization</p>
              <textarea className="input mt-1 h-40 resize-y font-mono text-sm"
                placeholder={`Hi {{name}},\n\nI came across your work and wanted to reach out...`}
                value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Recipients</span>
              <p className="text-xs text-gray-400">One per line. Format: <code>Name &lt;email&gt;</code> or just <code>email</code></p>
              <textarea className="input mt-1 h-32 font-mono text-sm"
                placeholder={"John Doe <john@acme.com>\njane@startup.io"}
                value={recipientText} onChange={e => setRecipientText(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">
                {parseRecipients(recipientText).length} recipient(s) detected
              </p>
            </label>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Campaign'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .input {
          display: block;
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: #000; }
      `}</style>
    </div>
  );
}
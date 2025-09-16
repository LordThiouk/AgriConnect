import React from 'react';
import { Button } from '../components/ui/button';
import { campaignsService, type Campaign, type CreateCampaignInput } from '../services/campaignsService';

const CampaignsPage: React.FC = () => {
  const [items, setItems] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState<CreateCampaignInput>({
    title: '',
    channel: 'sms',
    message_template: '',
    locale: 'fr',
    target_filters: {},
    schedule_at: null,
  });

  const load = async () => {
    setLoading(true);
    const { data } = await campaignsService.list();
    setItems((data as Campaign[]) || []);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
        <div className="space-x-2">
          <Button onClick={load} disabled={loading}>{loading ? 'Chargement…' : 'Rafraîchir'}</Button>
          <Button onClick={() => setShowCreate(true)}>Nouveau</Button>
        </div>
      </div>
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Titre" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select className="border rounded px-3 py-2" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as any })}>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="inapp">In‑app</option>
            </select>
            <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Planifier (YYYY-MM-DD HH:MM)" onChange={e => setForm({ ...form, schedule_at: e.target.value || null })} />
            <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Message" value={form.message_template} onChange={e => setForm({ ...form, message_template: e.target.value })} />
          </div>
          <div className="mt-3 space-x-2">
            <Button onClick={async () => { await campaignsService.create(form); setShowCreate(false); await load(); }}>Créer</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Annuler</Button>
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="text-gray-700">Liste</span>
          <span className="text-sm text-gray-500">{items.length} campagnes</span>
        </div>
        <div className="divide-y divide-gray-100">
          {items.length === 0 ? (
            <div className="p-6 text-gray-500">Aucune campagne.</div>
          ) : items.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{c.title}</div>
                <div className="text-sm text-gray-500">Canal: {c.channel} · Statut: {c.status}</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">Planifiée: {c.schedule_at || '—'}</div>
                {c.status === 'draft' && (
                  <Button onClick={async () => { await campaignsService.schedule(c.id, c.schedule_at ?? null); await load(); }}>Planifier</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;



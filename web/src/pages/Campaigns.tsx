import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { campaignsService, type Campaign, type CreateCampaignInput } from '../services/campaignsService';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';

const CampaignsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState<CreateCampaignInput>({
    title: '',
    description: '',
    channel: 'sms',
    message_template: '',
    locale: 'fr',
    target_filters: {},
    schedule_at: null,
  });

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await campaignsService.list();
      
      if (error) {
        throw error;
      }
      
      setCampaigns((data as unknown as Campaign[]) || []);
    } catch (err) {
      console.error('Erreur lors du chargement des campagnes:', err);
      showToast({ type: 'error', title: 'Erreur', message: 'Erreur lors du chargement des campagnes' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreateCampaign = async () => {
    try {
      if (!form.title.trim() || !form.message_template.trim()) {
        showToast({ type: 'error', title: 'Erreur', message: 'Veuillez remplir tous les champs obligatoires' });
        return;
      }

      const { error } = await campaignsService.create(form);
      
      if (error) {
        throw error;
      }

      showToast({ type: 'success', title: 'Succès', message: 'Campagne créée avec succès' });
      setShowCreate(false);
      setForm({
        title: '',
        description: '',
        channel: 'sms',
        message_template: '',
        locale: 'fr',
        target_filters: {},
        schedule_at: null,
      });
      await loadCampaigns();
    } catch (err) {
      console.error('Erreur lors de la création de la campagne:', err);
      showToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la création de la campagne' });
    }
  };

  const handleScheduleCampaign = async (campaignId: string, scheduleAt: string | null) => {
    try {
      const { error } = await campaignsService.schedule(campaignId, scheduleAt);
      
      if (error) {
        throw error;
      }

      showToast({ type: 'success', title: 'Succès', message: 'Campagne planifiée avec succès' });
      await loadCampaigns();
    } catch (err) {
      console.error('Erreur lors de la planification:', err);
      showToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la planification' });
    }
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Brouillon', variant: 'secondary' as const },
      scheduled: { label: 'Planifiée', variant: 'default' as const },
      running: { label: 'En cours', variant: 'default' as const },
      completed: { label: 'Terminée', variant: 'secondary' as const },
      cancelled: { label: 'Annulée', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getChannelIcon = (channel: string) => {
    const icons = {
      sms: '📱',
      push: '🔔',
      whatsapp: '💬',
      inapp: '📲',
    };
    return icons[channel as keyof typeof icons] || '📱';
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} />
        <Header onMenuToggle={handleToggleSidebar} />
        <div className="ml-0 lg:ml-64 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des campagnes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} />
      <Header onMenuToggle={handleToggleSidebar} />
      
      <div className="ml-0 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campagnes</h1>
              <p className="text-gray-600 mt-1">Gérez vos campagnes de communication</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={loadCampaigns} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Chargement...' : 'Actualiser'}
              </Button>
              <Button onClick={() => setShowCreate(true)}>
                Nouvelle Campagne
              </Button>
            </div>
          </div>

          {/* Create Campaign Form */}
          {showCreate && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Créer une nouvelle campagne</CardTitle>
                <CardDescription>
                  Remplissez les informations pour créer une nouvelle campagne de communication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Titre de la campagne"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canal de communication *
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.channel}
                      onChange={e => setForm({ ...form, channel: e.target.value as any })}
                      aria-label="Sélectionner le canal de communication"
                    >
                      <option value="sms">SMS</option>
                      <option value="push">Notification Push</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="inapp">In-App</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Description de la campagne (optionnel)"
                      value={form.description || ''}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planification
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Sélectionner une date et heure"
                      aria-label="Planifier la campagne à une date et heure spécifique"
                      onChange={e => setForm({ ...form, schedule_at: e.target.value || null })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Langue
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.locale}
                      onChange={e => setForm({ ...form, locale: e.target.value })}
                      aria-label="Sélectionner la langue du message"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="wo">Wolof</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Contenu du message à envoyer"
                      value={form.message_template}
                      onChange={e => setForm({ ...form, message_template: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreate(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleCreateCampaign}>
                    Créer la campagne
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaigns List */}
          <div className="grid gap-6">
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📢</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune campagne</h3>
                  <p className="text-gray-500 mb-4">Commencez par créer votre première campagne de communication</p>
                  <Button onClick={() => setShowCreate(true)}>
                    Créer une campagne
                  </Button>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getChannelIcon(campaign.channel)}</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {campaign.title}
                          </h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        
                        {campaign.description && (
                          <p className="text-gray-600 mb-3">{campaign.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Canal: <span className="font-medium capitalize">{campaign.channel}</span></span>
                          <span>Langue: <span className="font-medium uppercase">{campaign.locale}</span></span>
                          {campaign.schedule_at && (
                            <span>Planifiée: <span className="font-medium">{new Date(campaign.schedule_at).toLocaleString('fr-FR')}</span></span>
                          )}
                          <span>Créée: <span className="font-medium">{new Date(campaign.created_at).toLocaleDateString('fr-FR')}</span></span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleScheduleCampaign(campaign.id, campaign.schedule_at)}
                          >
                            Planifier
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          Voir
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Message:</span> {campaign.message_template}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;



import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AgentsService } from '../../services/agentsService';
import { Agent, AgentPerformance } from '../../types';
import { 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  Activity,
  TrendingUp,
  Users,
  Map,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface AgentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  onEdit?: () => void;
}

const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({
  isOpen,
  onClose,
  agent,
  onEdit
}) => {
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!agent) return;
      
      setLoading(true);
      try {
        const perf = await AgentsService.getAgentPerformance(agent.id);
        setPerformance(perf);
      } catch (error) {
        console.error('Erreur lors du chargement des performances:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && agent) {
      fetchPerformance();
    }
  }, [isOpen, agent]);

  if (!agent) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-600" />
            <span>Détails de l'agent</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informations personnelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Nom complet</label>
                    <p className="text-lg font-semibold">{agent.display_name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Téléphone</label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{agent.phone || 'Non renseigné'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Statut</label>
                    <Badge className={`${getStatusColor(agent.approval_status)} flex items-center space-x-1 w-fit`}>
                      {getStatusIcon(agent.approval_status)}
                      <span className="capitalize">{agent.approval_status}</span>
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Activité</label>
                    <Badge className={`${agent.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} w-fit`}>
                      {agent.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations géographiques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Localisation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Région</label>
                    <p>{agent.region || 'Non renseigné'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Département</label>
                    <p>{agent.department || 'Non renseigné'}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Commune</label>
                    <p>{agent.commune || 'Non renseigné'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coopérative */}
            {agent.cooperative && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Coopérative</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{agent.cooperative}</p>
                </CardContent>
              </Card>
            )}

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Dates importantes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Date de création</label>
                    <p>{formatDate(agent.created_at)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Dernière mise à jour</label>
                    <p>{formatDate(agent.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : performance ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Métriques de collecte</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{performance.totalVisits || 0}</div>
                        <div className="text-sm text-gray-600">Total visites</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{performance.totalProducers || 0}</div>
                        <div className="text-sm text-gray-600">Producteurs suivis</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{performance.totalPlots || 0}</div>
                        <div className="text-sm text-gray-600">Parcelles suivies</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-indigo-600">{performance.totalOperations || 0}</div>
                        <div className="text-sm text-gray-600">Opérations réalisées</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-teal-600">{performance.totalObservations || 0}</div>
                        <div className="text-sm text-gray-600">Observations effectuées</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-cyan-600">{performance.visitsThisMonth || 0}</div>
                        <div className="text-sm text-gray-600">Visites ce mois</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Métriques d'efficacité</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">{performance.avgVisitsPerMonth?.toFixed(1) || '0.0'}</div>
                        <div className="text-sm text-gray-600">Visites/mois (moyenne)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-pink-600">{performance.avgVisitsPerProducer?.toFixed(1) || '0.0'}</div>
                        <div className="text-sm text-gray-600">Visites/producteur</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{performance.dataQualityRate?.toFixed(1) || '0.0'}%</div>
                        <div className="text-sm text-gray-600">Qualité des données</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Métriques temporelles</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600">{performance.avgVisitDuration?.toFixed(0) || '0'} min</div>
                        <div className="text-sm text-gray-600">Durée moyenne visite</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-lime-600">{performance.avgDataEntryTime?.toFixed(0) || '0'} min</div>
                        <div className="text-sm text-gray-600">Temps saisie données</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-600">
                          {performance.lastSyncDate ? new Date(performance.lastSyncDate).toLocaleDateString('fr-FR') : 'Jamais'}
                        </div>
                        <div className="text-sm text-gray-600">Dernière synchronisation</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Métriques de qualité</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-violet-600">{performance.dataCompletionRate?.toFixed(1) || '0.0'}%</div>
                        <div className="text-sm text-gray-600">Taux complétion données</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-amber-600">{performance.photosPerPlot?.toFixed(1) || '0.0'}</div>
                        <div className="text-sm text-gray-600">Photos/parcelle</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-sky-600">{performance.gpsAccuracyRate?.toFixed(1) || '0.0'}%</div>
                        <div className="text-sm text-gray-600">Précision GPS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-rose-600">{performance.syncSuccessRate?.toFixed(1) || '0.0'}%</div>
                        <div className="text-sm text-gray-600">Taux sync réussie</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Aucune donnée de performance disponible</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Activité récente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Agent assigné</p>
                      <p className="text-sm text-gray-600">Agent assigné à {performance?.totalProducers || 0} producteurs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Map className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Visites effectuées</p>
                      <p className="text-sm text-gray-600">{performance?.totalVisits || 0} visites au total</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Performance</p>
                      <p className="text-sm text-gray-600">Qualité des données: {performance?.dataQualityRate.toFixed(1) || 0}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          {onEdit && (
            <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
              Modifier
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentDetailsModal;

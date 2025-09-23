import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, RefreshCw, Eye, CheckCircle, XCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertsService } from '@/services/alertsService';
import { Notification, NotificationFilters } from '@/types';
import StatusBadge from './StatusBadge';
import NotificationModal from './NotificationModal';
import NotificationDetailsModal from './NotificationDetailsModal';
import NotificationEditModal from './NotificationEditModal';
import DeleteNotificationModal from './DeleteNotificationModal';

interface NotificationsTabProps {
  onRefresh: () => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ onRefresh }) => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const pageSize = 10;

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer TOUTES les notifications sans filtres
      const response = await AlertsService.getNotifications({}, 1, 1000); // Récupérer beaucoup de données
      setAllNotifications(response.data);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  // Appliquer les filtres côté frontend
  const applyFilters = () => {
    let filtered = [...allNotifications];

    // Filtre par canal
    if (filters.channel && filters.channel !== 'all') {
      filtered = filtered.filter(n => n.channel === filters.channel);
    }

    // Filtre par statut
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(n => n.status === filters.status);
    }

    // Filtre par fournisseur
    if (filters.provider && filters.provider !== 'all') {
      filtered = filtered.filter(n => n.provider === filters.provider);
    }

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.body.toLowerCase().includes(searchLower)
      );
    }

    setFilteredNotifications(filtered);
    setTotalCount(filtered.length);
    setTotalPages(Math.ceil(filtered.length / pageSize));
  };

  // Appliquer la pagination
  const applyPagination = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filteredNotifications.slice(startIndex, endIndex);
    setDisplayedNotifications(paginated);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allNotifications, filters, searchTerm]);

  useEffect(() => {
    applyPagination();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filteredNotifications]);

  useEffect(() => {
    applyPagination();
  }, [currentPage, filteredNotifications]);

  const handleFilterChange = (key: keyof NotificationFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setCurrentPage(1);
  };

  const handleResendNotification = async (notificationId: string) => {
    try {
      await AlertsService.resendNotification(notificationId);
      await loadNotifications();
      onRefresh();
    } catch (err) {
      console.error('Error resending notification:', err);
      setError('Erreur lors du renvoi de la notification');
    }
  };

  // Fonctions pour gérer les modals
  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleView = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };

  const handleEdit = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowEditModal(true);
  };

  const handleDelete = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDeleteModal(true);
  };

  const handleModalSuccess = () => {
    loadNotifications();
    if (onRefresh) onRefresh();
  };

  const handleModalClose = () => {
    setSelectedNotification(null);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setShowDeleteModal(false);
  };

  const getChannelBadge = (channel: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'sms': 'default',
      'email': 'secondary',
      'push': 'outline',
      'whatsapp': 'default'
    };
    
    const labels: Record<string, string> = {
      'sms': 'SMS',
      'email': 'Email',
      'push': 'Push',
      'whatsapp': 'WhatsApp'
    };

    return (
      <Badge variant={variants[channel] || 'outline'}>
        {labels[channel] || channel}
      </Badge>
    );
  };

  const getProviderBadge = (provider: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'twilio': 'default',
      'sendgrid': 'secondary',
      'firebase': 'outline',
      'local': 'secondary'
    };

    return (
      <Badge variant={variants[provider] || 'outline'}>
        {provider}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && allNotifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher une notification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select onValueChange={(value) => handleFilterChange('channel', value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les canaux</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="push">Push</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="sent">Envoyée</SelectItem>
            <SelectItem value="delivered">Livrée</SelectItem>
            <SelectItem value="failed">Échec</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => handleFilterChange('provider', value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Fournisseur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les fournisseurs</SelectItem>
            <SelectItem value="twilio">Twilio</SelectItem>
            <SelectItem value="sendgrid">SendGrid</SelectItem>
            <SelectItem value="firebase">Firebase</SelectItem>
            <SelectItem value="local">Local</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notifications ({totalCount})</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleCreate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle notification
              </Button>
              <Button size="sm" variant="outline" onClick={loadNotifications}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {displayedNotifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune notification trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Destinataire</th>
                    <th className="text-left py-3 px-4 font-medium">Titre</th>
                    <th className="text-left py-3 px-4 font-medium">Canal</th>
                    <th className="text-left py-3 px-4 font-medium">Fournisseur</th>
                    <th className="text-left py-3 px-4 font-medium">Statut</th>
                    <th className="text-left py-3 px-4 font-medium">Envoyée</th>
                    <th className="text-left py-3 px-4 font-medium">Livrée</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedNotifications.map((notification) => (
                    <tr key={notification.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">
                            {notification.profile?.full_name || 'Utilisateur inconnu'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {notification.profile?.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {notification.body}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getChannelBadge(notification.channel)}
                      </td>
                      <td className="py-3 px-4">
                        {getProviderBadge(notification.provider)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(notification.status)}
                          <StatusBadge status={notification.status} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {notification.sent_at 
                          ? new Date(notification.sent_at).toLocaleString('fr-FR')
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {notification.delivered_at 
                          ? new Date(notification.delivered_at).toLocaleString('fr-FR')
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(notification)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(notification)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            {notification.status === 'failed' && (
                              <DropdownMenuItem onClick={() => handleResendNotification(notification.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Renvoyer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(notification)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages} ({totalCount} notifications)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <NotificationModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        mode="create"
      />

      <NotificationDetailsModal
        isOpen={showDetailsModal}
        onClose={handleModalClose}
        notification={selectedNotification}
      />

      <NotificationEditModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        notification={selectedNotification}
      />

      <DeleteNotificationModal
        isOpen={showDeleteModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        notification={selectedNotification}
      />
    </div>
  );
};

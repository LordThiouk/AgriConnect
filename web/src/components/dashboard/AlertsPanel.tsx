import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, XCircle, CheckCircle, Info, Clock, AlertCircle } from 'lucide-react';

// Type assertions pour résoudre le conflit de types
const AlertTriangleIcon = AlertTriangle as any;
const XCircleIcon = XCircle as any;
const CheckCircleIcon = CheckCircle as any;
const InfoIcon = Info as any;
const ClockIcon = Clock as any;
const AlertCircleIcon = AlertCircle as any;

interface Alert {
  id: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  type: 'warning' | 'error' | 'info' | 'success';
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

interface AlertsPanelProps {
  alerts: Alert[];
  onResolve?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onResolve, onDismiss }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      default:
        return <InfoIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive" className="text-xs">En attente</Badge>;
      case 'resolved':
        return <Badge variant="default" className="text-xs bg-green-600">Résolu</Badge>;
      case 'dismissed':
        return <Badge variant="secondary" className="text-xs">Ignoré</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <AlertCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
          Alertes récentes
        </CardTitle>
        <p className="text-sm text-gray-500">
          Dernières alertes et notifications
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p>Aucune alerte récente</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error' ? 'border-red-500 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  alert.type === 'success' ? 'border-green-500 bg-green-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {alert.title}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(alert.priority)}`}
                        >
                          {alert.priority === 'high' ? 'Élevée' : 
                           alert.priority === 'medium' ? 'Moyenne' : 'Faible'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{alert.timestamp}</span>
                        </div>
                        {getStatusBadge(alert.status)}
                      </div>
                    </div>
                  </div>
                  
                  {alert.status === 'pending' && (
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResolve?.(alert.id)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Résoudre
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDismiss?.(alert.id)}
                        className="text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        <XCircleIcon className="h-3 w-3 mr-1" />
                        Ignorer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {alerts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="outline" className="w-full">
              Voir toutes les alertes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;

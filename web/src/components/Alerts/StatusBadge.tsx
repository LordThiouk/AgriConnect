import React from 'react';
import { Badge } from '../ui/badge';
import { Clock, Send, CheckCircle2, XCircle, Eye } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'dismissed';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'En attente',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'sent':
        return {
          label: 'Envoyée',
          variant: 'default' as const,
          icon: Send,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'acknowledged':
        return {
          label: 'Reconnue',
          variant: 'secondary' as const,
          icon: Eye,
          className: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'completed':
        return {
          label: 'Complétée',
          variant: 'secondary' as const,
          icon: CheckCircle2,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'dismissed':
        return {
          label: 'Rejetée',
          variant: 'destructive' as const,
          icon: XCircle,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          label: 'En attente',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`flex items-center gap-1 ${config.className} ${className}`}
    >
      <IconComponent className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default StatusBadge;

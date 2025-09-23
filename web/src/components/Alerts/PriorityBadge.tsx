import React from 'react';
import { Badge } from '../ui/badge';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  className?: string;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Urgent',
          variant: 'destructive' as const,
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'high':
        return {
          label: 'Élevée',
          variant: 'destructive' as const,
          icon: AlertCircle,
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case 'medium':
        return {
          label: 'Moyenne',
          variant: 'secondary' as const,
          icon: Info,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'low':
        return {
          label: 'Faible',
          variant: 'secondary' as const,
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      default:
        return {
          label: 'Moyenne',
          variant: 'secondary' as const,
          icon: Info,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getPriorityConfig(priority);
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

export default PriorityBadge;

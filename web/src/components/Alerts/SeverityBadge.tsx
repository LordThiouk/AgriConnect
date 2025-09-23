import React from 'react';
import { Badge } from '../ui/badge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface SeverityBadgeProps {
  severity: 'info' | 'warning' | 'critical';
  className?: string;
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          label: 'Critique',
          variant: 'destructive' as const,
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'warning':
        return {
          label: 'Avertissement',
          variant: 'destructive' as const,
          icon: AlertCircle,
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case 'info':
        return {
          label: 'Information',
          variant: 'secondary' as const,
          icon: Info,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      default:
        return {
          label: 'Information',
          variant: 'secondary' as const,
          icon: Info,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getSeverityConfig(severity);
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

export default SeverityBadge;

import React from 'react';
import { Card, CardContent } from '../ui/card';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>; // Accept React components
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple';
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600'
  };

  const iconColorClasses = {
    blue: 'text-blue-200',
    green: 'text-green-200',
    orange: 'text-orange-200',
    purple: 'text-purple-200'
  };

  const titleColorClasses = {
    blue: 'text-blue-100',
    green: 'text-green-100',
    orange: 'text-orange-100',
    purple: 'text-purple-100'
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${titleColorClasses[color]} mb-1`}>
              {title}
            </p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-white">
                {value}
              </span>
              {trend && (
                <span className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-200' : 'text-red-200'
                }`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className={`text-xs ${titleColorClasses[color]} mt-1`}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-white/20`}>
            <icon className={`h-8 w-8 ${iconColorClasses[color]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;

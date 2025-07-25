import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'stable';
  };
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'accent';
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  description,
  variant = 'default' 
}: StatsCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'accent':
        return 'border-accent/20 bg-accent/5';
      default:
        return 'border-border';
    }
  };

  const getIconVariant = () => {
    switch (variant) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'accent':
        return 'text-accent';
      default:
        return 'text-primary';
    }
  };

  const getTrendBadge = () => {
    if (!change) return null;
    
    const badgeVariant = change.trend === 'up' ? 'default' : 
                        change.trend === 'down' ? 'destructive' : 'secondary';
    
    return (
      <Badge variant={badgeVariant} className="text-xs">
        {change.trend === 'up' ? '↗' : change.trend === 'down' ? '↘' : '→'} {change.value}
      </Badge>
    );
  };

  return (
    <Card className={`transition-all duration-300 hover:shadow-card ${getVariantStyles()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${getIconVariant()}`} />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{value}</div>
            {getTrendBadge()}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
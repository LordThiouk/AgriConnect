import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  UserPlus, 
  MapPin, 
  Clipboard,
  Upload,
  Download
} from "lucide-react";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    {
      id: 'add-producer',
      label: 'Nouveau Producteur',
      icon: UserPlus,
      variant: 'default' as const,
      description: 'Ajouter un producteur'
    },
    {
      id: 'add-parcel',
      label: 'Nouvelle Parcelle',
      icon: MapPin,
      variant: 'secondary' as const,
      description: 'Enregistrer une parcelle'
    },
    {
      id: 'field-report',
      label: 'Rapport Terrain',
      icon: Clipboard,
      variant: 'outline' as const,
      description: 'Saisir activités'
    },
    {
      id: 'sync-data',
      label: 'Synchroniser',
      icon: Upload,
      variant: 'outline' as const,
      description: 'Données hors ligne'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Actions Rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              className="h-auto p-4 flex flex-col items-center gap-2 transition-all hover:scale-105"
              onClick={() => onAction(action.id)}
            >
              <action.icon className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">{action.label}</div>
                <div className="text-xs opacity-70">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onAction('export')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onAction('import')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  MapPin, 
  Phone, 
  Calendar,
  Edit,
  Eye,
  MoreVertical
} from "lucide-react";

interface Producer {
  id: string;
  name: string;
  phone: string;
  village: string;
  parcelsCount: number;
  totalArea: number;
  lastVisit: string;
  status: 'active' | 'inactive' | 'pending';
}

interface ProducerCardProps {
  producer: Producer;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}

export function ProducerCard({ producer, onEdit, onView }: ProducerCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-card hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{producer.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {producer.village}
              </p>
            </div>
          </div>
          <Badge variant={getStatusVariant(producer.status)}>
            {getStatusLabel(producer.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informations de contact */}
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{producer.phone}</span>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-lg font-bold text-primary">{producer.parcelsCount}</div>
            <div className="text-xs text-muted-foreground">Parcelles</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-lg font-bold text-primary">{producer.totalArea} ha</div>
            <div className="text-xs text-muted-foreground">Surface totale</div>
          </div>
        </div>

        {/* Dernière visite */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Dernière visite: {producer.lastVisit}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(producer.id)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(producer.id)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
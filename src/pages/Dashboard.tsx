import { Header } from "@/components/Layout/Header";
import { StatsCard } from "@/components/Dashboard/StatsCard";
import { QuickActions } from "@/components/Dashboard/QuickActions";
import { ProducerCard } from "@/components/Producers/ProducerCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  MapPin, 
  TrendingUp,
  Activity,
  Search,
  Filter,
  ChevronRight
} from "lucide-react";

// Données de démonstration
const mockProducers = [
  {
    id: "1",
    name: "Sokhna Diouf",
    phone: "+221 77 123 45 89",
    village: "Thies",
    parcelsCount: 3,
    totalArea: 4.5,
    lastVisit: "15/07/2025",
    status: "active" as const
  },
  {
    id: "2", 
    name: "Aminata Traoré",
    phone: "+221 77 123 45 67",
    village: "Dakar",
    parcelsCount: 2,
    totalArea: 3.2,
    lastVisit: "12/07/2025",
    status: "active" as const
  },
  {
    id: "3",
    name: "Ibrahim Diallo",
    phone: "+221 77 123 45 67",
    village: "Dakar",
    parcelsCount: 1,
    totalArea: 2.8,
    lastVisit: "10/07/2025",
    status: "pending" as const
  }
];

export default function Dashboard() {
  const { toast } = useToast();

  const handleQuickAction = (action: string) => {
    toast({
      title: "Action en cours",
      description: `Ouverture de: ${action}`,
    });
  };

  const handleProducerEdit = (id: string) => {
    toast({
      title: "Modifier producteur",
      description: `ID: ${id}`,
    });
  };

  const handleProducerView = (id: string) => {
    toast({
      title: "Voir producteur", 
      description: `ID: ${id}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-earth">
      <Header userRole="agent" userName="Agent Dupont" />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-primary p-8 text-primary-foreground">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Tableau de Bord AgriConnect</h1>
            <p className="text-primary-foreground/80 mb-4">
              Suivez vos producteurs et parcelles en temps réel
            </p>
            <Button variant="secondary" size="lg">
              Commencer une visite terrain
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <div className="h-full w-full bg-gradient-field"></div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Producteurs Total"
            value={234}
            icon={Users}
            change={{ value: "+12%", trend: "up" }}
            description="vs mois dernier"
            variant="success"
          />
          <StatsCard
            title="Parcelles Enregistrées"
            value={156}
            icon={MapPin}
            change={{ value: "+8%", trend: "up" }}
            description="nouvelles ce mois"
            variant="default"
          />
          <StatsCard
            title="Surface Totale"
            value="1,247 ha"
            icon={TrendingUp}
            change={{ value: "+15%", trend: "up" }}
            description="hectares suivis"
            variant="accent"
          />
          <StatsCard
            title="Visites Terrain"
            value={42}
            icon={Activity}
            change={{ value: "5", trend: "stable" }}
            description="cette semaine"
            variant="warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions rapides */}
          <div className="lg:col-span-1">
            <QuickActions onAction={handleQuickAction} />
          </div>

          {/* Producteurs récents */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Producteurs Récents
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    Voir tout
                  </Button>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un producteur..."
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {mockProducers.map((producer) => (
                    <ProducerCard
                      key={producer.id}
                      producer={producer}
                      onEdit={handleProducerEdit}
                      onView={handleProducerView}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Carte d'activité */}
        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
                  <Users className="h-4 w-4 text-success-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Nouveau producteur ajouté</p>
                  <p className="text-sm text-muted-foreground">Sokhna Diouf - Thies - il y a 2h</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Parcelle géolocalisée</p>
                  <p className="text-sm text-muted-foreground">Aminata Traoré - 3.2 ha - il y a 4h</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Synchronisation terminée</p>
                  <p className="text-sm text-muted-foreground">15 entrées synchronisées - il y a 6h</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
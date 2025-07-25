import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  Bell, 
  Settings, 
  LogOut, 
  Menu,
  Leaf,
  Users,
  MapPin
} from "lucide-react";

interface HeaderProps {
  userRole?: 'agent' | 'superviseur' | 'admin';
  userName?: string;
  onMenuToggle?: () => void;
}

export function Header({ userRole = 'agent', userName = 'Agent Dupont', onMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { signOut } = useAuth();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'superviseur': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'superviseur': return 'Superviseur';
      default: return 'Agent Terrain';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo et titre */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">AgriConnect</h1>
              <p className="text-xs text-muted-foreground">Plateforme Nationale</p>
            </div>
          </div>
        </div>

        {/* Indicateurs rapides */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">234</span>
            <span className="text-muted-foreground">producteurs</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">156</span>
            <span className="text-muted-foreground">parcelles</span>
          </div>
        </div>

        {/* Actions utilisateur */}
        <div className="flex items-center gap-2">
          <Badge variant={getRoleBadgeVariant(userRole)} className="hidden sm:inline-flex">
            {getRoleLabel(userRole)}
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent"></span>
          </Button>

          <div className="flex items-center gap-2 text-sm">
            <div className="hidden sm:block text-right">
              <p className="font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(userRole)}</p>
            </div>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications dropdown */}
      {showNotifications && (
        <div className="absolute right-4 top-16 z-50 w-80 rounded-lg border bg-card p-4 shadow-card">
          <h3 className="font-semibold mb-3">Notifications récentes</h3>
          <div className="space-y-2">
            <div className="rounded p-2 bg-muted">
              <p className="text-sm font-medium">Nouvelle parcelle ajoutée</p>
              <p className="text-xs text-muted-foreground">M. Sahm - 2.5 ha</p>
            </div>
            <div className="rounded p-2 bg-accent/10">
              <p className="text-sm font-medium">Alerte météo</p>
              <p className="text-xs text-muted-foreground">Risque de gel cette nuit</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
# 🌐 Application Web

Vue d'ensemble de l'application web AgriConnect.

## 🎯 Introduction

L'application web AgriConnect est développée avec React 19 et Vite, offrant une interface moderne pour les superviseurs et administrateurs.

## 🏗️ Architecture

### Stack Technique

- **React 19** : Framework de développement web
- **Vite** : Outil de build et serveur de développement
- **TypeScript** : Langage de programmation
- **Tailwind CSS** : Framework CSS
- **React Query** : Gestion des données et cache
- **React Router** : Navigation côté client

### Structure du Projet

```
web/
├── src/
│   ├── components/        # Composants réutilisables
│   ├── pages/            # Pages de l'application
│   ├── hooks/            # Hooks personnalisés
│   ├── services/         # Services API
│   ├── types/            # Types TypeScript
│   └── utils/            # Utilitaires
├── public/               # Assets statiques
└── package.json          # Dépendances
```

## 🔐 Authentification

### Connexion avec OTP

```typescript
// Service d'authentification
export const authService = {
  async signInWithPhone(phone: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: { channel: 'sms' }
    });
    
    if (error) throw error;
    return data;
  },
  
  async verifyOTP(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms'
    });
    
    if (error) throw error;
    return data;
  }
};
```

### Gestion des sessions

```typescript
// Hook d'authentification
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, loading };
};
```

## 🧭 Navigation

### React Router

```typescript
// Configuration des routes
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/producers',
    element: <ProducersList />,
  },
  {
    path: '/producers/:id',
    element: <ProducerDetail />,
  },
  {
    path: '/plots',
    element: <PlotsList />,
  },
  {
    path: '/plots/:id',
    element: <PlotDetail />,
  }
]);
```

### Navigation protégée

```typescript
// Composant de protection des routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

// Utilisation
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## 🗄️ Gestion des Données

### React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Hook pour récupérer les producteurs
export const useProducers = () => {
  return useQuery({
    queryKey: ['producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producers')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });
};

// Hook pour créer un producteur
export const useCreateProducer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (producer: CreateProducerData) => {
      const { data, error } = await supabase
        .from('producers')
        .insert(producer)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['producers'] });
    }
  });
};
```

### Cache et Optimisation

```typescript
// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
});
```

## 🎨 Interface Utilisateur

### Composants avec Tailwind CSS

```typescript
// Composant de carte producteur
const ProducerCard = ({ producer }: { producer: Producer }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {producer.name}
          </h3&gt;
          <p className="text-gray-600">{producer.phone}</p>
          <p className="text-sm text-gray-500">{producer.region}</p>
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Voir détails
        </button>
      </div>
    </div>
  );
};
```

### Layout Responsive

```typescript
// Layout principal
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                AgriConnect
              </h1&gt;
            </div>
            <div className="flex items-center space-x-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};
```

## 📊 Tableaux de Bord

### Composant de Statistiques

```typescript
const StatsCard = ({ title, value, change, icon }: StatsCardProps) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change > 0 ? '+' : ''}{change}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Graphiques avec Recharts

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const YieldChart = ({ data }: { data: YieldData[] }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Évolution des Rendements
      </h3&gt;
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="yield" 
            stroke="#3b82f6" 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

## 🗺️ Cartographie

### Intégration Leaflet

```typescript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const PlotsMap = ({ plots }: { plots: Plot[] }) => {
  return (
    <div className="h-96 w-full">
      <MapContainer
        center={[14.6928, -16.2518]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {plots.map(plot => (
          <Marker
            key={plot.id}
            position={[plot.latitude, plot.longitude]}
          >
            <Popup>
              <div>
                <h3 className="font-semibold">{plot.name}</h3&gt;
                <p>Superficie: {plot.area_ha} ha</p>
                <p>Type de sol: {plot.soil_type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
```

## 📱 Responsive Design

### Breakpoints Tailwind

```typescript
// Composant responsive
const ResponsiveGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {children}
    </div>
  );
};

// Navigation mobile
const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-gray-600"
      >
        <MenuIcon className="h-6 w-6" />
      </button>
      
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg">
          <nav className="px-2 pt-2 pb-3 space-y-1">
            <a href="/dashboard" className="block px-3 py-2 text-gray-900">
              Tableau de bord
            </a>
            <a href="/producers" className="block px-3 py-2 text-gray-900">
              Producteurs
            </a>
          </nav>
        </div>
      )}
    </div>
  );
};
```

## 🧪 Tests

### Tests avec Vitest

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ProducerCard } from './ProducerCard';

describe('ProducerCard', () => {
  it('should display producer information', () => {
    const producer = {
      id: '1',
      name: 'Mamadou Diallo',
      phone: '+221701234567',
      region: 'Kaolack'
    };
    
    render(<ProducerCard producer={producer} />);
    
    expect(screen.getByText('Mamadou Diallo')).toBeInTheDocument();
    expect(screen.getByText('+221701234567')).toBeInTheDocument();
    expect(screen.getByText('Kaolack')).toBeInTheDocument();
  });
  
  it('should call onPress when clicked', () => {
    const mockOnPress = jest.fn();
    const producer = { id: '1', name: 'Test' };
    
    render(<ProducerCard producer={producer} onPress={mockOnPress} />);
    
    fireEvent.click(screen.getByText('Voir détails'));
    expect(mockOnPress).toHaveBeenCalledWith(producer);
  });
});
```

## 🚀 Déploiement

### Build de Production

```bash
# Build de production
npm run build

# Preview du build
npm run preview

# Déploiement sur Vercel
vercel --prod
```

### Configuration Vercel

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

## 📚 Ressources

- [Documentation React](https://react.dev/)
- [Documentation Vite](https://vitejs.dev/)
- [Documentation Tailwind CSS](https://tailwindcss.com/)
- [Documentation React Query](https://tanstack.com/query/latest)
- [Documentation React Router](https://reactrouter.com/)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com

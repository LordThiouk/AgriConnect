# 🔧 Guide de Développement

Standards, bonnes pratiques et conventions de développement pour AgriConnect.

## 📋 Standards de Code

### TypeScript
- **Strict mode** : Activé par défaut
- **Types explicites** : Éviter `any`
- **Interfaces** : Pour les objets complexes
- **Enums** : Pour les valeurs constantes

```typescript
// ✅ Bon
interface Producer {
  id: string;
  name: string;
  phone: string;
  cooperativeId: string;
}

enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  PRODUCER = 'producer'
}

// ❌ Éviter
const producer: any = { ... };
```

### React/React Native
- **Functional components** : Préférer les hooks
- **Custom hooks** : Pour la logique réutilisable
- **Memoization** : `React.memo`, `useMemo`, `useCallback`
- **Error boundaries** : Gestion des erreurs

```typescript
// ✅ Bon
const ProducerCard = React.memo(({ producer }: { producer: Producer }) => {
  const { data, loading } = useProducer(producer.id);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <Card>
      <Text>{producer.name}</Text>
    </Card>
  );
});

// ❌ Éviter
class ProducerCard extends React.Component {
  // ...
}
```

## 🏗️ Architecture des Composants

### Structure des dossiers
```
components/
├── ui/                    # Composants UI de base
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
├── forms/                 # Composants de formulaires
│   ├── ProducerForm.tsx
│   └── PlotForm.tsx
├── business/              # Composants métier
│   ├── ProducerCard.tsx
│   └── PlotMap.tsx
└── layout/                # Composants de layout
    ├── ScreenContainer.tsx
    └── TabNavigator.tsx
```

### Conventions de nommage
- **Composants** : PascalCase (`ProducerCard.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useProducer.ts`)
- **Services** : camelCase (`producerService.ts`)
- **Types** : PascalCase (`Producer.ts`)

## 🗄️ Gestion des Données

### Supabase Client
```typescript
// ✅ Configuration centralisée
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// ✅ Hooks personnalisés
export const useProducers = () => {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProducers = async () => {
      const { data, error } = await supabase
        .from('producers')
        .select('*');
      
      if (error) {
        console.error('Error fetching producers:', error);
        return;
      }
      
      setProducers(data || []);
      setLoading(false);
    };
    
    fetchProducers();
  }, []);
  
  return { producers, loading };
};
```

### Gestion d'état
- **Context API** : Pour l'état global (auth, sync)
- **Zustand** : Pour l'état complexe
- **Local state** : `useState` pour l'état local

```typescript
// ✅ Context pour l'authentification
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ...
  
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 🧪 Tests

### Structure des tests
```
tests/
├── unit/                  # Tests unitaires
│   ├── components/
│   ├── hooks/
│   └── services/
├── integration/           # Tests d'intégration
│   ├── api/
│   └── database/
└── e2e/                   # Tests end-to-end
    ├── mobile/
    └── web/
```

### Tests unitaires (Jest + React Testing Library)
```typescript
// ✅ Test de composant
import { render, screen } from '@testing-library/react';
import { ProducerCard } from '../ProducerCard';

describe('ProducerCard', () => {
  it('should display producer name', () => {
    const producer = {
      id: '1',
      name: 'John Doe',
      phone: '+221701234567'
    };
    
    render(<ProducerCard producer={producer} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Tests d'intégration
```typescript
// ✅ Test d'API
import { supabase } from '../lib/supabase';

describe('Producers API', () => {
  it('should fetch producers', async () => {
    const { data, error } = await supabase
      .from('producers')
      .select('*');
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

## 🔒 Sécurité

### Validation des données
```typescript
// ✅ Validation avec Zod
import { z } from 'zod';

const ProducerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\+221[0-9]{9}$/, 'Invalid phone format'),
  cooperativeId: z.string().uuid('Invalid cooperative ID')
});

export const validateProducer = (data: unknown) => {
  return ProducerSchema.parse(data);
};
```

### Gestion des erreurs
```typescript
// ✅ Gestion centralisée des erreurs
export const handleError = (error: unknown, context: string) => {
  console.error(`Error in ${context}:`, error);
  
  if (error instanceof Error) {
    // Log to monitoring service
    logError(error, context);
    
    // Show user-friendly message
    showToast(error.message);
  }
};
```

## 📱 Développement Mobile

### Navigation
```typescript
// ✅ Navigation typée
import { createNativeStackNavigator } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Producer: { producerId: string };
  Plot: { plotId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
```

### Gestion offline
```typescript
// ✅ Hook pour la synchronisation
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Change[]>([]);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    NetInfo.addEventListener(handleOnline);
    NetInfo.addEventListener(handleOffline);
    
    return () => {
      NetInfo.removeEventListener(handleOnline);
      NetInfo.removeEventListener(handleOffline);
    };
  }, []);
  
  return { isOnline, pendingChanges };
};
```

## 🌐 Développement Web

### Routing
```typescript
// ✅ Routes typées
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
]);
```

### Performance
```typescript
// ✅ Lazy loading
const ProducersList = lazy(() => import('./ProducersList'));

// ✅ Memoization
const ExpensiveComponent = memo(({ data }: { data: ComplexData }) => {
  const processedData = useMemo(() => {
    return processComplexData(data);
  }, [data]);
  
  return <div>{/* ... */}</div>;
});
```

## 📝 Documentation

### Commentaires de code
```typescript
/**
 * Récupère les producteurs d'une coopérative avec pagination
 * @param cooperativeId - ID de la coopérative
 * @param page - Numéro de page (défaut: 1)
 * @param limit - Nombre d'éléments par page (défaut: 20)
 * @returns Promise avec les producteurs et métadonnées de pagination
 */
export const getProducers = async (
  cooperativeId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<Producer>> => {
  // Implementation...
};
```

### README des composants
```typescript
/**
 * ProducerCard - Composant d'affichage d'un producteur
 * 
 * @example
 * ```tsx
 * <ProducerCard 
 *   producer={producer} 
 *   onPress={() => navigate('ProducerDetail', { id: producer.id })}
 * />
 * ```
 */
export const ProducerCard = ({ producer, onPress }: ProducerCardProps) => {
  // Implementation...
};
```

## 🚀 Déploiement

### Variables d'environnement
```bash
# ✅ Fichier .env.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
TWILIO_ACCOUNT_SID=your-twilio-sid
```

### Scripts de build
```json
{
  "scripts": {
    "build:web": "cd web && npm run build",
    "build:mobile": "cd mobile && npm run build",
    "build:all": "npm run build:web && npm run build:mobile"
  }
}
```

## 📚 Ressources

- [Standards de documentation](doc-standards.md)
- [Guide de contribution](contributing.md)
- [Tests](testing.md)
- [Déploiement](../deployment/guide.md)

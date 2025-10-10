# 📱 Application Mobile

Vue d'ensemble de l'application mobile AgriConnect.

## 🎯 Introduction

L'application mobile AgriConnect est développée avec React Native et Expo, offrant une expérience optimisée pour les agents de terrain et les producteurs.

## 🏗️ Architecture

### Stack Technique

- **React Native** : Framework de développement mobile
- **Expo SDK 53** : Outils et services de développement
- **TypeScript** : Langage de programmation
- **NativeBase** : Bibliothèque de composants UI
- **Supabase** : Backend et authentification

### Structure du Projet

```
mobile/
├── app/                    # Navigation et écrans
│   ├── (auth)/            # Écrans d'authentification
│   ├── (tabs)/            # Écrans principaux
│   └── _layout.tsx        # Layout principal
├── components/            # Composants réutilisables
├── context/              # Contextes React
├── hooks/                # Hooks personnalisés
├── lib/                  # Utilitaires et services
└── types/                # Types TypeScript
```

## 🔐 Authentification

### OTP par SMS

```typescript
// Connexion avec numéro de téléphone
const signInWithPhone = async (phone: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone,
    options: { channel: 'sms' }
  });
  
  if (error) throw error;
  return data;
};

// Vérification du code OTP
const verifyOTP = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone,
    token: token,
    type: 'sms'
  });
  
  if (error) throw error;
  return data;
};
```

### Gestion des rôles

```typescript
// Types de rôles
enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  AGENT = 'agent',
  PRODUCER = 'producer'
}

// Vérification des permissions
const hasPermission = (userRole: UserRole, requiredRole: UserRole) => {
  const roleHierarchy = {
    [UserRole.PRODUCER]: 0,
    [UserRole.AGENT]: 1,
    [UserRole.SUPERVISOR]: 2,
    [UserRole.ADMIN]: 3
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
```

## 📱 Navigation

### Expo Router

```typescript
// Structure de navigation
app/
├── (auth)/
│   ├── login.tsx          # Connexion
│   └── register.tsx       # Inscription
├── (tabs)/
│   ├── dashboard.tsx      # Tableau de bord
│   ├── producers.tsx      # Liste des producteurs
│   ├── plots.tsx          # Parcelles
│   └── profile.tsx        # Profil utilisateur
└── _layout.tsx            # Layout principal
```

### Navigation typée

```typescript
// Types de navigation
type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  ProducerDetail: { producerId: string };
  PlotDetail: { plotId: string };
  AddProducer: undefined;
  AddPlot: { producerId: string };
};

// Utilisation
const navigation = useNavigation<NavigationProp<RootStackParamList>>();
navigation.navigate('ProducerDetail', { producerId: 'uuid' });
```

## 🗄️ Gestion des Données

### Supabase Client

```typescript
// Configuration du client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Hooks personnalisés
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

### Synchronisation Offline

```typescript
// Gestion du mode hors ligne
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

## 🎨 Interface Utilisateur

### Composants NativeBase

```typescript
import { Box, Text, Button, Input, VStack } from 'native-base';

const ProducerCard = ({ producer }: { producer: Producer }) => {
  return (
    <Box p={4} bg="white" rounded="lg" shadow={2}>
      <VStack space={2}>
        <Text fontSize="lg" fontWeight="bold">
          {producer.name}
        </Text>
        <Text color="gray.600">
          {producer.phone}
        </Text>
        <Button size="sm" colorScheme="blue">
          Voir détails
        </Button>
      </VStack>
    </Box>
  );
};
```

### Thème et Couleurs

```typescript
// Configuration du thème
const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#fefce8',
      500: '#eab308',
      900: '#713f12'
    }
  },
  fonts: {
    heading: 'Inter-Bold',
    body: 'Inter-Regular'
  }
};
```

## 📍 Géolocalisation

### Récupération de la position

```typescript
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (err) {
      setError('Erreur de géolocalisation');
    }
  };
  
  return { location, error, getCurrentLocation };
};
```

### Affichage de cartes

```typescript
import MapView, { Marker } from 'react-native-maps';

const PlotMap = ({ plots }: { plots: Plot[] }) => {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 14.6928,
        longitude: -16.2518,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
      }}
    >
      {plots.map(plot => (
        <Marker
          key={plot.id}
          coordinate={{
            latitude: plot.latitude,
            longitude: plot.longitude
          }}
          title={plot.name}
        />
      ))}
    </MapView>
  );
};
```

## 📸 Gestion des Photos

### Prise de photo

```typescript
import * as ImagePicker from 'expo-image-picker';

export const useImagePicker = () => {
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Permission d\'accès aux photos refusée');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    });
    
    if (!result.canceled) {
      return result.assets[0];
    }
  };
  
  return { pickImage };
};
```

### Upload vers Supabase

```typescript
const uploadImage = async (imageUri: string, bucket: string, path: string) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: 'image/jpeg'
    });
  
  if (error) throw error;
  return data;
};
```

## 🔔 Notifications

### Notifications Push

```typescript
import * as Notifications from 'expo-notifications';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

// Envoi de notification locale
const sendLocalNotification = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body
    },
    trigger: null // Immédiat
  });
};
```

## 🧪 Tests

### Tests de Composants

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProducerCard } from '../ProducerCard';

describe('ProducerCard', () => {
  it('should display producer information', () => {
    const producer = {
      id: '1',
      name: 'Mamadou Diallo',
      phone: '+221701234567'
    };
    
    render(<ProducerCard producer={producer} />);
    
    expect(screen.getByText('Mamadou Diallo')).toBeOnTheScreen();
    expect(screen.getByText('+221701234567')).toBeOnTheScreen();
  });
});
```

## 🚀 Déploiement

### Build de Production

```bash
# Build pour Android
npx expo build:android

# Build pour iOS
npx expo build:ios

# Ou avec EAS Build
eas build --platform android
eas build --platform ios
```

### Configuration EAS

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## 📚 Ressources

- [Documentation React Native](https://reactnative.dev/)
- [Documentation Expo](https://docs.expo.dev/)
- [NativeBase Documentation](https://docs.nativebase.io/)
- [Supabase Mobile Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com

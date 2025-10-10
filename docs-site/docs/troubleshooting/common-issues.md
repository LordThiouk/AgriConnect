# 🔧 Problèmes Courants

Solutions aux problèmes les plus fréquemment rencontrés avec AgriConnect.

## 🚨 Problèmes d'Authentification

### Erreur "Invalid phone number"

**Symptôme :** Impossible de se connecter avec un numéro de téléphone.

**Solutions :**
1. Vérifier le format du numéro : `+221701234567`
2. S'assurer que le numéro commence par `+221`
3. Vérifier que le numéro contient exactement 9 chiffres après le code pays

```typescript
// Validation côté client
const validatePhoneNumber = (phone: string) => {
  const phoneRegex = /^\+221[0-9]{9}$/;
  return phoneRegex.test(phone);
};
```

### Code OTP non reçu

**Symptôme :** Le code OTP n'arrive pas par SMS.

**Solutions :**
1. Vérifier la configuration Twilio
2. Vérifier les quotas SMS
3. Tester avec un autre numéro
4. Vérifier les logs Supabase

```bash
# Vérifier les logs Supabase
npx supabase logs --type edge-function
```

### Session expirée

**Symptôme :** Déconnexion automatique après un certain temps.

**Solutions :**
1. Vérifier la configuration JWT
2. Implémenter le refresh token
3. Gérer la reconnexion automatique

```typescript
// Gestion de la reconnexion
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Rediriger vers la page de connexion
        router.push('/login');
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

## 🗄️ Problèmes de Base de Données

### Erreur RLS "permission denied"

**Symptôme :** Accès refusé aux données malgré l'authentification.

**Solutions :**
1. Vérifier les politiques RLS
2. Vérifier le rôle de l'utilisateur
3. Vérifier l'appartenance à la coopérative

```sql
-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'producers';

-- Vérifier le rôle de l'utilisateur
SELECT auth.uid(), auth.role();
```

### Erreur de géolocalisation PostGIS

**Symptôme :** Erreur lors de l'insertion de données géospatiales.

**Solutions :**
1. Vérifier l'extension PostGIS
2. Vérifier le SRID des géométries
3. Valider les coordonnées

```sql
-- Vérifier PostGIS
SELECT PostGIS_Version();

-- Vérifier le SRID
SELECT ST_SRID(geom) FROM plots LIMIT 1;
```

### Connexion à la base de données

**Symptôme :** Impossible de se connecter à Supabase.

**Solutions :**
1. Vérifier les variables d'environnement
2. Vérifier la clé API
3. Vérifier l'URL du projet

```typescript
// Vérifier la configuration
console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Supabase Key:', process.env.SUPABASE_ANON_KEY?.substring(0, 10) + '...');
```

## 📱 Problèmes Mobile

### Application ne se lance pas

**Symptôme :** L'application mobile ne démarre pas.

**Solutions :**
1. Vérifier la configuration Expo
2. Nettoyer le cache
3. Réinstaller les dépendances

```bash
# Nettoyer le cache
npx expo start --clear

# Réinstaller les dépendances
rm -rf node_modules
npm install
```

### Problème de géolocalisation

**Symptôme :** Impossible d'obtenir la position GPS.

**Solutions :**
1. Vérifier les permissions
2. Tester en mode debug
3. Vérifier la configuration

```typescript
// Vérifier les permissions
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  alert('Permission de localisation requise');
  return;
}
```

### Synchronisation offline

**Symptôme :** Les données ne se synchronisent pas après reconnexion.

**Solutions :**
1. Vérifier la queue offline
2. Vérifier les conflits de données
3. Implémenter la résolution de conflits

```typescript
// Vérifier la queue offline
const pendingChanges = await getOfflineQueue();
console.log('Pending changes:', pendingChanges.length);
```

## 🌐 Problèmes Web

### Erreur de build Vite

**Symptôme :** Le build de l'application web échoue.

**Solutions :**
1. Vérifier les erreurs TypeScript
2. Vérifier les imports
3. Nettoyer le cache

```bash
# Nettoyer le cache
rm -rf node_modules/.vite
npm run build
```

### Problème de routage

**Symptôme :** Les routes ne fonctionnent pas correctement.

**Solutions :**
1. Vérifier la configuration React Router
2. Vérifier les routes protégées
3. Vérifier les redirections

```typescript
// Vérifier la configuration des routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>
  }
]);
```

### Problème de performance

**Symptôme :** L'application web est lente.

**Solutions :**
1. Optimiser les requêtes
2. Implémenter la pagination
3. Utiliser la mise en cache

```typescript
// Optimiser les requêtes
const { data } = useQuery({
  queryKey: ['producers', page, limit],
  queryFn: () => fetchProducers(page, limit),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
});
```

## 🔔 Problèmes de Notifications

### SMS non envoyés

**Symptôme :** Les notifications SMS ne sont pas envoyées.

**Solutions :**
1. Vérifier la configuration Twilio
2. Vérifier les quotas
3. Vérifier les logs

```bash
# Vérifier les logs Twilio
curl -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN \
  "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json"
```

### Notifications push non reçues

**Symptôme :** Les notifications push ne s'affichent pas.

**Solutions :**
1. Vérifier les permissions
2. Vérifier la configuration Expo
3. Tester sur un appareil physique

```typescript
// Vérifier les permissions
const { status } = await Notifications.getPermissionsAsync();
if (status !== 'granted') {
  const { status } = await Notifications.requestPermissionsAsync();
}
```

## 🚀 Problèmes de Déploiement

### Erreur de déploiement Vercel

**Symptôme :** Le déploiement sur Vercel échoue.

**Solutions :**
1. Vérifier les variables d'environnement
2. Vérifier la configuration build
3. Vérifier les logs de déploiement

```bash
# Vérifier les variables d'environnement
vercel env ls

# Vérifier les logs
vercel logs
```

### Erreur de déploiement mobile

**Symptôme :** Le build mobile échoue.

**Solutions :**
1. Vérifier la configuration EAS
2. Vérifier les certificats
3. Vérifier les permissions

```bash
# Vérifier la configuration EAS
eas build:configure

# Vérifier les certificats
eas credentials
```

## 🔍 Diagnostic

### Outils de diagnostic

```bash
# Vérifier le statut Supabase
npx supabase status

# Vérifier les logs
npx supabase logs

# Vérifier la base de données
npx supabase db diff
```

### Logs utiles

```typescript
// Logs côté client
console.log('User:', user);
console.log('Session:', session);
console.log('Error:', error);

// Logs côté serveur
console.log('Request:', req);
console.log('Response:', res);
console.log('Error:', error);
```

## 📞 Support

### Informations à fournir

Lors de la demande de support, fournir :

1. **Description du problème** : Ce qui ne fonctionne pas
2. **Étapes de reproduction** : Comment reproduire le problème
3. **Logs d'erreur** : Messages d'erreur complets
4. **Environnement** : OS, navigateur, version de l'app
5. **Données de test** : Données utilisées pour reproduire

### Contacts

- **Email** : pirlothiouk@gmail.com
- **GitHub Issues** : [Ouvrir une issue](https://github.com/agriconnect/agriconnect/issues)
- **Documentation** : [Consulter la documentation](../README.md)

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Expo](https://docs.expo.dev/)
- [Documentation React](https://react.dev/)
- [Documentation Vite](https://vitejs.dev/)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com

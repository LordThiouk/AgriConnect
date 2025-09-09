# Correction de la Redirection Automatique - AgriConnect Mobile

## Problème Identifié

L'authentification mobile fonctionnait correctement (OTP SMS envoyé et vérifié), mais la redirection automatique vers les tableaux de bord ne se faisait pas. Le problème était que :

1. **Utilisateur sans rôle** : Les utilisateurs créés via OTP SMS n'avaient pas de rôle assigné (`userRole: null`)
2. **Accès mobile refusé** : Sans rôle, `canAccessMobile` était `false`
3. **Redirection bloquée** : La logique de redirection ne fonctionnait pas

## Solution Implémentée

### 1. Création Automatique de Profil

Ajout de fonctions pour créer automatiquement un profil utilisateur avec un rôle par défaut :

```typescript
// mobile/lib/auth/mobileAuthService.ts
export const createUserProfile = async (user: User, defaultRole: UserRole = 'producer'): Promise<boolean>
export const userProfileExists = async (userId: string): Promise<boolean>
```

### 2. Attribution de Rôle par Défaut

Modification de `getUserInfo` pour :
- Vérifier si un profil existe pour l'utilisateur
- Créer automatiquement un profil avec le rôle `'producer'` si inexistant
- Récupérer le rôle depuis la base de données

### 3. Correction de la Structure de Données

Correction des champs de la table `profiles` :
- `id` → `user_id` (clé étrangère vers auth.users)
- `full_name` → `display_name` (nom d'affichage)

### 4. Mise à Jour du Contexte d'Authentification

Modification du contexte pour utiliser la nouvelle fonction `getUserInfo` asynchrone :

```typescript
// mobile/context/AuthContext.tsx
const userInfo = await MobileAuthService.getUserInfo(session.user, session);
```

## Flux Corrigé

### Avant (Problématique)
1. Utilisateur saisit son numéro → OTP envoyé ✅
2. Utilisateur saisit l'OTP → Vérification réussie ✅
3. Utilisateur créé dans auth.users → **Sans rôle** ❌
4. `canAccessMobile = false` → Redirection bloquée ❌

### Après (Corrigé)
1. Utilisateur saisit son numéro → OTP envoyé ✅
2. Utilisateur saisit l'OTP → Vérification réussie ✅
3. Utilisateur créé dans auth.users → **Profil créé automatiquement** ✅
4. Rôle `'producer'` assigné → `canAccessMobile = true` ✅
5. Redirection automatique vers le tableau de bord ✅

## Tests Ajoutés

### Script de Test de Profil
```bash
npm run test-profile
```

Teste :
- Vérification de l'existence du profil
- Création du profil avec rôle par défaut
- Vérification de la création
- Nettoyage du profil de test

### Script de Test d'Authentification
```bash
npm run test-auth
```

Teste le flux complet d'authentification avec création de profil.

## Structure de la Table Profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role,
  display_name TEXT,
  cooperative TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Rôles Supportés

- **`producer`** : Producteurs agricoles (rôle par défaut pour mobile)
- **`agent`** : Agents de terrain (mobile)
- **`supervisor`** : Superviseurs (web uniquement)
- **`admin`** : Administrateurs (web uniquement)
- **`coop_admin`** : Administrateurs de coopérative (web uniquement)

## Logs de Débogage

Les logs incluent maintenant :
- Vérification de l'existence du profil
- Création automatique du profil
- Attribution du rôle
- Validation de l'accès mobile
- Redirection automatique

## Configuration Requise

### Variables d'Environnement
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Permissions RLS
Assurez-vous que les politiques RLS permettent :
- Lecture des profils par `user_id`
- Insertion de nouveaux profils
- Mise à jour des profils

## Résultat

✅ **Authentification mobile complète** : OTP SMS + Création de profil + Redirection automatique  
✅ **Rôles automatiques** : Attribution du rôle `'producer'` par défaut  
✅ **Navigation fluide** : Redirection vers les tableaux de bord appropriés  
✅ **Tests validés** : Scripts de test pour vérifier le fonctionnement  

L'application mobile AgriConnect est maintenant **100% fonctionnelle** avec authentification production et redirection automatique ! 🎉

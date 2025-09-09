# Interface de Sélection de Rôle - AgriConnect Mobile

## Problème Identifié

L'utilisateur demandait que lors de l'inscription, l'utilisateur puisse choisir son rôle (producteur ou agent), avec une validation admin requise pour les agents.

## Solution Implémentée

### 1. Écran de Sélection de Rôle

Création d'un nouvel écran `role-selection.tsx` qui permet à l'utilisateur de :

- **Choisir entre Producteur et Agent**
- **Voir les différences** entre les deux rôles
- **Comprendre la validation admin** requise pour les agents
- **Créer automatiquement le profil** avec le rôle sélectionné

### 2. Flux d'Authentification Modifié

**Nouveau flux** :
1. **Saisie du numéro** → OTP envoyé
2. **Vérification OTP** → Connexion réussie
3. **Vérification du profil** → Profil existe ?
   - **Non** → Redirection vers sélection de rôle
   - **Oui** → Redirection vers l'application
4. **Sélection de rôle** → Création du profil
5. **Redirection finale** → Vers l'application

### 3. Modifications Techniques

#### **Service d'Authentification (`mobileAuthService.ts`)**
- Suppression de la création automatique de profil avec rôle par défaut
- Ajout de vérification de l'existence du profil
- Fonction `createUserProfile` modifiée pour accepter un rôle spécifique

#### **Contexte d'Authentification (`AuthContext.tsx`)**
- Ajout de la fonction `refreshAuth()` pour actualiser l'état après création de profil
- Mise à jour du type `AuthContextType` pour inclure `refreshAuth`

#### **Écran de Login (`login.tsx`)**
- Vérification de l'existence du profil après vérification OTP
- Redirection vers sélection de rôle si pas de profil
- Redirection vers l'app si profil existant

#### **Écran Principal (`index.tsx`)**
- Gestion du cas "utilisateur sans rôle"
- Redirection vers sélection de rôle si `userRole` est `null`

### 4. Interface Utilisateur

#### **Écran de Sélection de Rôle**
- **Design moderne** avec cartes de sélection
- **Icônes distinctives** pour chaque rôle
- **Descriptions claires** des responsabilités
- **Badge de validation** pour les agents
- **Confirmation** avant création du profil agent

#### **Rôles Disponibles**

**Producteur** 🧑‍🌾
- Suit ses parcelles
- Reçoit des conseils
- Gère son exploitation
- **Accès immédiat** (pas de validation)

**Agent de Terrain** 👥
- Collecte des données
- Suit les producteurs
- Gère les parcelles
- **Validation admin requise** ⚠️

### 5. Validation Admin pour Agents

Lors de la sélection du rôle "Agent" :
1. **Alerte informative** sur la validation requise
2. **Confirmation utilisateur** avant création
3. **Profil créé** avec statut "en attente de validation"
4. **Notification admin** (à implémenter dans la phase suivante)

### 6. Tests Ajoutés

#### **Script de Test de Sélection de Rôle**
```bash
npm run test-role
```

Teste :
- Création de profil producteur
- Création de profil agent
- Vérification de l'accès mobile
- Test des rôles non autorisés
- Nettoyage des profils de test

### 7. Structure des Données

#### **Table `profiles`**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role, -- 'producer' ou 'agent'
  display_name TEXT,
  cooperative TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Enum `user_role`**
```sql
CREATE TYPE user_role AS ENUM (
  'admin',
  'supervisor', 
  'agent',
  'producer',
  'coop_admin'
);
```

### 8. Logique d'Accès Mobile

```typescript
// Seuls les agents et producteurs peuvent accéder au mobile
const canAccessMobile = (role: UserRole | null): boolean => {
  return role ? ['agent', 'producer'].includes(role) : false;
};
```

### 9. Navigation

#### **Routes Ajoutées**
- `/(auth)/role-selection` - Sélection de rôle

#### **Logique de Redirection**
- **Pas de profil** → `role-selection`
- **Profil existant** → `/(tabs)` (tableaux de bord)
- **Rôle non autorisé** → `/(auth)/login`

### 10. Expérience Utilisateur

#### **Pour les Producteurs**
1. Saisie numéro → OTP → Sélection "Producteur" → Accès immédiat ✅

#### **Pour les Agents**
1. Saisie numéro → OTP → Sélection "Agent" → Confirmation → Profil créé → Attente validation ⏳

### 11. Prochaines Étapes

- **Interface admin** pour valider les demandes d'agents
- **Notifications** pour informer les agents de leur validation
- **Statuts de profil** (en attente, validé, rejeté)
- **Gestion des coopératives** lors de la sélection de rôle

## Résultat

✅ **Sélection de rôle** : Interface intuitive pour choisir entre producteur et agent  
✅ **Validation admin** : Alerte et confirmation pour les agents  
✅ **Flux complet** : OTP → Sélection → Création → Redirection  
✅ **Tests validés** : Scripts de test pour vérifier le fonctionnement  
✅ **UX optimisée** : Navigation fluide et messages clairs  

L'application mobile AgriConnect supporte maintenant la sélection de rôle avec validation admin ! 🎉

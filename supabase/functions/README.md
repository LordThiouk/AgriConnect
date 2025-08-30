# AgriConnect Edge Functions API

Ce document décrit les Edge Functions Supabase pour l'API AgriConnect.

## Structure des API

### Authentification
- `POST /auth/verify-otp` - Envoyer un code OTP
- `POST /auth/login` - Se connecter avec OTP

### Producteurs
- `GET /api/producers` - Lister les producteurs
- `POST /api/producers` - Créer un producteur
- `GET /api/producers/:id` - Obtenir un producteur
- `PUT /api/producers/:id` - Modifier un producteur
- `DELETE /api/producers/:id` - Supprimer un producteur

## Authentification

### Envoyer OTP
```bash
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "+221701234567"
}
```

### Se connecter
```bash
POST /auth/login
Content-Type: application/json

{
  "phone": "+221701234567",
  "otp": "123456"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": {
      "id": "uuid",
      "role": "agent",
      "cooperative_id": "uuid"
    },
    "expires_at": "2025-01-01T12:00:00Z"
  }
}
```

## API Producteurs

### Lister les producteurs
```bash
GET /api/producers?page=1&limit=50&search=nom&cooperative_id=uuid
Authorization: Bearer <token>
```

**Paramètres de requête :**
- `page` (number) - Page de résultats (défaut: 1)
- `limit` (number) - Nombre d'éléments par page (défaut: 50, max: 100)
- `search` (string) - Recherche dans nom, prénom, téléphone, village
- `cooperative_id` (string) - Filtrer par coopérative
- `region` (string) - Filtrer par région
- `department` (string) - Filtrer par département

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "first_name": "Mamadou",
      "last_name": "Diallo",
      "phone": "+221701234567",
      "email": "mamadou@example.com",
      "village": "Touba",
      "region": "Diourbel",
      "cooperative_id": "uuid",
      "is_active": true,
      "created_at": "2025-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### Créer un producteur
```bash
POST /api/producers
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Mamadou",
  "last_name": "Diallo",
  "phone": "+221701234567",
  "email": "mamadou@example.com",
  "gender": "M",
  "birth_date": "1980-01-01",
  "address": "123 Rue Principale",
  "village": "Touba",
  "commune": "Touba",
  "department": "Mbacké",
  "region": "Diourbel",
  "household_size": 5,
  "education_level": "primary",
  "farming_experience_years": 15,
  "primary_language": "fr",
  "cooperative_id": "uuid"
}
```

### Obtenir un producteur
```bash
GET /api/producers/:id
Authorization: Bearer <token>
```

### Modifier un producteur
```bash
PUT /api/producers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Mamadou",
  "last_name": "Diallo",
  "phone": "+221701234567",
  "is_active": true
}
```

### Supprimer un producteur
```bash
DELETE /api/producers/:id
Authorization: Bearer <token>
```

## Gestion des erreurs

Toutes les API retournent des réponses standardisées :

**Succès :**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

**Erreur :**
```json
{
  "success": false,
  "error": "Description de l'erreur"
}
```

**Codes d'erreur HTTP :**
- `400` - Requête invalide (validation échouée)
- `401` - Non authentifié
- `403` - Non autorisé
- `404` - Ressource non trouvée
- `409` - Conflit (ex: téléphone déjà utilisé)
- `500` - Erreur serveur

## Autorisation

### Rôles utilisateur
- `admin` - Accès complet à toutes les données
- `supervisor` - Accès complet à toutes les données
- `agent` - Accès aux données de sa coopérative
- `coop_admin` - Accès aux données de sa coopérative
- `producer` - Accès à ses propres données

### Permissions par opération
- **Lire** : Tous les rôles peuvent lire les données selon leur scope
- **Créer** : `admin`, `supervisor`, `agent`
- **Modifier** : `admin`, `supervisor`, `agent`
- **Supprimer** : `admin`, `supervisor`

## Validation des données

Toutes les données sont validées avec Zod :

### Producteur
- `first_name`, `last_name` : Requis, max 100 caractères
- `phone` : Format téléphone Sénégal (+221XXXXXXXXX)
- `email` : Format email valide (optionnel)
- `gender` : 'M' ou 'F' (optionnel)
- `birth_date` : Format date ISO (optionnel)
- `household_size` : Nombre entier 1-50 (optionnel)
- `farming_experience_years` : Nombre entier 0-100 (optionnel)

## Déploiement

```bash
# Déployer toutes les fonctions
npm run deploy:all

# Déployer une fonction spécifique
supabase functions deploy producers --project-ref swggnqbymblnyjcocqxi
```

## Développement local

```bash
# Démarrer Supabase local
supabase start

# Tester les fonctions localement
curl -X POST http://localhost:54321/functions/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+221701234567"}'
```

## Variables d'environnement

Les fonctions utilisent les variables d'environnement Supabase :
- `SUPABASE_URL` - URL du projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé de service pour accès admin

Pour Twilio (optionnel) :
- `TWILIO_ACCOUNT_SID` - SID du compte Twilio
- `TWILIO_AUTH_TOKEN` - Token d'authentification Twilio
- `TWILIO_FROM_NUMBER` - Numéro d'envoi SMS

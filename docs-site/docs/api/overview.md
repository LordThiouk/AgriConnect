# 📡 API Overview

Vue d'ensemble de l'API AgriConnect.

## 🎯 Introduction

L'API AgriConnect fournit un accès programmatique à toutes les fonctionnalités de la plateforme via des endpoints REST sécurisés.

## 🔗 Base URL

```
Production: https://your-project.supabase.co/rest/v1/
Development: http://localhost:54321/rest/v1/
```

## 🔐 Authentification

### Headers requis

```http
Authorization: Bearer <your-jwt-token>
apikey: <your-anon-key>
Content-Type: application/json
```

### Obtention du token

```typescript
// Authentification OTP
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+221701234567',
  options: { channel: 'sms' }
});

// Vérification OTP
const { data: session } = await supabase.auth.verifyOtp({
  phone: '+221701234567',
  token: '123456',
  type: 'sms'
});

const token = session?.access_token;
```

## 📊 Endpoints Principaux

### Producteurs

```http
GET    /producers              # Liste des producteurs
POST   /producers              # Créer un producteur
GET    /producers/{id}         # Détails d'un producteur
PATCH  /producers/{id}         # Modifier un producteur
DELETE /producers/{id}         # Supprimer un producteur
```

### Parcelles

```http
GET    /plots                  # Liste des parcelles
POST   /plots                  # Créer une parcelle
GET    /plots/{id}             # Détails d'une parcelle
PATCH  /plots/{id}             # Modifier une parcelle
DELETE /plots/{id}             # Supprimer une parcelle
```

### Cultures

```http
GET    /crops                  # Liste des cultures
POST   /crops                  # Créer une culture
GET    /crops/{id}             # Détails d'une culture
PATCH  /crops/{id}             # Modifier une culture
DELETE /crops/{id}             # Supprimer une culture
```

### Opérations

```http
GET    /operations             # Liste des opérations
POST   /operations             # Créer une opération
GET    /operations/{id}        # Détails d'une opération
PATCH  /operations/{id}        # Modifier une opération
DELETE /operations/{id}        # Supprimer une opération
```

## 🔍 Filtrage et Pagination

### Filtrage

```http
# Filtres simples
GET /producers?cooperative_id=eq.uuid-here

# Filtres multiples
GET /producers?cooperative_id=eq.uuid-here&region=eq.Kaolack

# Filtres de plage
GET /operations?date=gte.2024-01-01&date=lte.2024-12-31
```

### Pagination

```http
# Pagination basique
GET /producers?limit=20&offset=0

# Pagination avec tri
GET /producers?limit=20&offset=0&order=name.asc
```

## 📍 Requêtes Spatiales

### Parcelles dans un rayon

```http
# Toutes les parcelles dans un rayon de 5km
GET /plots?geom=st_dwithin(st_point(-16.2518,14.6928),5000)
```

### Parcelles intersectant une zone

```http
# Parcelles dans un rectangle
GET /plots?geom=st_intersects(st_makeenvelope(-16.3,14.6,-16.2,14.7,4326))
```

## 📝 Exemples d'utilisation

### Créer un producteur

```typescript
const response = await fetch('/rest/v1/producers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': anonKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Mamadou Diallo',
    phone: '+221701234567',
    cooperative_id: 'coop-uuid',
    region: 'Kaolack'
  })
});

const producer = await response.json();
```

### Récupérer les parcelles d'un producteur

```typescript
const response = await fetch('/rest/v1/plots?producer_id=eq.producer-uuid', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': anonKey
  }
});

const plots = await response.json();
```

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec des politiques par rôle :

- **Producteurs** : Peuvent voir uniquement leurs propres données
- **Agents** : Peuvent voir les données de leur coopérative
- **Superviseurs** : Peuvent voir les données de leur région
- **Admins** : Peuvent voir toutes les données

### Validation des données

```typescript
// Exemple de validation côté client
const producerSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  phone: z.string().regex(/^\+221[0-9]{9}$/, 'Format téléphone invalide'),
  cooperative_id: z.string().uuid('ID coopérative invalide')
});

const validatedData = producerSchema.parse(data);
```

## 📊 Codes de réponse

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Permissions insuffisantes |
| 404 | Ressource non trouvée |
| 422 | Données invalides |
| 500 | Erreur serveur |

## 🧪 Tests

### Tests d'API

```typescript
// Test avec Jest
describe('Producers API', () => {
  it('should create a producer', async () => {
    const response = await request(app)
      .post('/rest/v1/producers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Producer',
        phone: '+221701234567',
        cooperative_id: 'test-coop-id'
      })
      .expect(201);

    expect(response.body.name).toBe('Test Producer');
  });
});
```

## 📚 Documentation complète

- [Endpoints détaillés](api/overview.md)
- [Authentification](getting-started/supabase-setup.md)
- [Exemples Postman](api/overview.md)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com

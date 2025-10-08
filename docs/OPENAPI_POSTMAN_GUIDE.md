# 🚀 Guide OpenAPI + Postman - AgriConnect PostgREST

## 📋 Vue d'ensemble

Supabase expose automatiquement une **spécification OpenAPI complète** via PostgREST. Cette spécification contient **273 endpoints** et peut être importée directement dans Postman pour générer automatiquement des collections d'API !

## 🔍 **Découverte OpenAPI réussie**

### **Endpoint OpenAPI découvert :**
```
URL: https://swggnqbymblnyjcocqxi.supabase.co/rest/v1/
Headers: 
  - apikey: [VOTRE_CLÉ_ANON]
  - Authorization: Bearer [VOTRE_CLÉ_ANON]
  - Accept: application/openapi+json
```

### **Spécification générée :**
- ✅ **Format** : OpenAPI 2.0 (Swagger)
- ✅ **Chemins** : 273 endpoints disponibles
- ✅ **Tables** : Toutes les tables agricoles documentées
- ✅ **Fichier** : `postgrest-openapi.json` (25,024 lignes !)

## 📥 **Import dans Postman**

### **Méthode 1 : Import direct du fichier JSON**
1. **Ouvrir Postman**
2. **Cliquer sur "Import"**
3. **Glisser-déposer** le fichier `postgrest-openapi.json`
4. **Postman génère automatiquement** une collection complète !

### **Méthode 2 : Import via URL**
1. **Dans Postman** → "Import" → "Link"
2. **URL** : `https://swggnqbymblnyjcocqxi.supabase.co/rest/v1/`
3. **Headers** : `Accept: application/openapi+json`
4. **Postman récupère** la spécification en temps réel

## 🏗️ **Structure de la Collection Postman**

### **Collections générées automatiquement :**
```
AgriConnect API (PostgREST)
├── Introspection
│   └── OpenAPI description
├── Profiles
│   ├── GET /profiles
│   ├── POST /profiles
│   ├── PUT /profiles/{id}
│   └── DELETE /profiles/{id}
├── Cooperatives
│   ├── GET /cooperatives
│   ├── POST /cooperatives
│   ├── PUT /cooperatives/{id}
│   └── DELETE /cooperatives/{id}
├── Producers
│   ├── GET /producers
│   ├── POST /producers
│   ├── PUT /producers/{id}
│   └── DELETE /producers/{id}
├── Plots
│   ├── GET /plots
│   ├── POST /plots
│   ├── PUT /plots/{id}
│   └── DELETE /plots/{id}
├── Crops
│   ├── GET /crops
│   ├── POST /crops
│   ├── PUT /crops/{id}
│   └── DELETE /crops/{id}
├── Operations
│   ├── GET /operations
│   ├── POST /operations
│   ├── PUT /operations/{id}
│   └── DELETE /operations/{id}
├── Observations
│   ├── GET /observations
│   ├── POST /observations
│   ├── PUT /observations/{id}
│   └── DELETE /observations/{id}
└── [Autres tables...]
```

## 🔧 **Configuration Postman**

### **Variables d'environnement :**
```json
{
  "SUPABASE_URL": "https://swggnqbymblnyjcocqxi.supabase.co",
  "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIs...",
  "SUPABASE_SERVICE_KEY": "eyJhbGciOiJIUzI1NiIs..."
}
```

### **Headers globaux :**
```json
{
  "apikey": "{{SUPABASE_ANON_KEY}}",
  "Authorization": "Bearer {{SUPABASE_ANON_KEY}}",
  "Content-Type": "application/json"
}
```

## 📊 **Endpoints disponibles (273 total)**

### **Tables principales agricoles :**
- **`/profiles`** - Gestion des utilisateurs
- **`/cooperatives`** - Coopératives agricoles
- **`/producers`** - Producteurs agricoles
- **`/plots`** - Parcelles agricoles
- **`/crops`** - Cultures plantées
- **`/operations`** - Opérations agricoles
- **`/observations`** - Observations terrain
- **`/notifications`** - Notifications système
- **`/seasons`** - Campagnes agricoles
- **`/memberships`** - Adhésions coopératives

### **Tables de support :**
- **`/logs`** - Journal des activités
- **`/media`** - Photos et documents
- **`/agri_rules`** - Règles métier agricoles
- **`/recommendations`** - Recommandations générées

## 🎯 **Exemples d'utilisation Postman**

### **1. Lister tous les producteurs :**
```
GET {{SUPABASE_URL}}/rest/v1/producers?select=*
```

### **2. Créer un nouveau producteur :**
```
POST {{SUPABASE_URL}}/rest/v1/producers
Body:
{
  "first_name": "Mamadou",
  "last_name": "Diallo",
  "phone": "+221701234567",
  "region": "Dakar",
  "is_active": true
}
```

### **3. Filtrer par région :**
```
GET {{SUPABASE_URL}}/rest/v1/producers?region=eq.Dakar&select=*
```

### **4. Pagination :**
```
GET {{SUPABASE_URL}}/rest/v1/producers?select=*&limit=10&offset=0
```

### **5. Jointure avec coopérative :**
```
GET {{SUPABASE_URL}}/rest/v1/producers?select=*,cooperatives(name,region)
```

### **6. Recherche textuelle :**
```
GET {{SUPABASE_URL}}/rest/v1/producers?first_name=ilike.*mamadou*
```

### **7. Tri par date :**
```
GET {{SUPABASE_URL}}/rest/v1/producers?select=*&order=created_at.desc
```

### **8. Compter les enregistrements :**
```
GET {{SUPABASE_URL}}/rest/v1/producers?select=id&limit=1
Headers: Prefer: count=exact
```

## 🔐 **Authentification et Sécurité**

### **Clés d'accès :**
- **Clé anon** : Accès public (lecture selon RLS)
- **Clé service** : Accès complet (bypass RLS)

### **RLS (Row Level Security) :**
- **Automatique** : Sécurité appliquée selon le rôle
- **Producteur** : Voit seulement ses données
- **Agent** : Voit les données de sa coopérative
- **Admin** : Voit toutes les données

## 📈 **Fonctionnalités avancées PostgREST**

### **Filtrage :**
```bash
# Égalité
region=eq.Dakar

# Inégalité
area_hectares=gt.1.0

# Recherche textuelle
first_name=ilike.*mamadou*

# Filtres multiples
region=eq.Dakar&is_active=eq.true
```

### **Pagination :**
```bash
# Limite et offset
limit=10&offset=20

# Range (PostgREST standard)
Range: 0-9
```

### **Jointures :**
```bash
# Jointure simple
select=*,cooperatives(name,region)

# Jointure avec filtrage
select=*,plots(area_hectares)&plots.area_hectares=gt.1.0
```

### **Recherche :**
```bash
# Recherche OR
or=(first_name.ilike.*mamadou*,last_name.ilike.*diallo*)

# Recherche géospatiale (PostGIS)
geom=st_within(st_point(0,0),geom)
```

## 🧪 **Tests automatisés Postman**

### **Tests de réponse :**
```javascript
// Vérifier le statut
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Vérifier le format JSON
pm.test("Response is JSON", function () {
    pm.response.to.be.json;
});

// Vérifier la structure
pm.test("Response has data", function () {
    const response = pm.response.json();
    pm.expect(response).to.be.an('array');
});

// Vérifier le nombre d'éléments
pm.test("Response has items", function () {
    const response = pm.response.json();
    pm.expect(response.length).to.be.greaterThan(0);
});
```

### **Tests de performance :**
```javascript
// Vérifier le temps de réponse
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

## 📚 **Documentation interactive**

### **Swagger UI intégré :**
- **URL** : `https://swggnqbymblnyjcocqxi.supabase.co/rest/v1/`
- **Fonctionnalités** : Test en ligne, documentation complète
- **Avantages** : Pas besoin de Postman pour les tests rapides

### **Postman Collection Runner :**
- **Tests automatisés** de tous les endpoints
- **Rapports de performance** et de fiabilité
- **Intégration CI/CD** possible

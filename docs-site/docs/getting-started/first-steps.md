# 🎯 Premiers Pas

Guide pour commencer à utiliser AgriConnect après l'installation.

## 🚀 Démarrage Rapide

### 1. Vérifier l'installation

```bash
# Vérifier que tout fonctionne
npm run dev:all

# Vérifier la base de données
npm run supabase:status
```

### 2. Accéder aux applications

- **Web** : `http://localhost:5173`
- **Mobile** : Scanner le QR code avec Expo Go

## 👤 Créer votre premier utilisateur

### Via l'interface web (Admin)

1. Aller sur `http://localhost:5173`
2. Cliquer sur "Créer un compte admin"
3. Entrer votre numéro de téléphone
4. Vérifier le code OTP reçu par SMS

### Via l'API (Développement)

```bash
# Créer un utilisateur admin
curl -X POST http://localhost:54321/auth/v1/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+221701234567",
    "password": "password123"
  }'
```

## 🏢 Configurer une coopérative

### 1. Créer une coopérative

```sql
-- Via Supabase Studio ou SQL
INSERT INTO cooperatives (name, region, department, commune)
VALUES ('Coopérative Test', 'Kaolack', 'Kaolack', 'Kaolack');
```

### 2. Assigner un agent

```sql
-- Assigner un agent à la coopérative
INSERT INTO memberships (user_id, cooperative_id, role)
VALUES (
  (SELECT id FROM profiles WHERE phone = '+221701234567'),
  (SELECT id FROM cooperatives WHERE name = 'Coopérative Test'),
  'agent'
);
```

## 👨‍🌾 Ajouter un producteur

### Via l'application mobile

1. Se connecter avec le compte agent
2. Aller dans "Producteurs"
3. Cliquer sur "Ajouter un producteur"
4. Remplir les informations

### Via l'API

```bash
curl -X POST http://localhost:54321/rest/v1/producers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mamadou Diallo",
    "phone": "+221701234568",
    "cooperative_id": "coop-uuid"
  }'
```

## 🌾 Créer une parcelle

### 1. Ajouter une parcelle

```bash
curl -X POST http://localhost:54321/rest/v1/plots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "producer_id": "producer-uuid",
    "area_ha": 2.5,
    "soil_type": "sableux",
    "water_source": "puits",
    "geom": "POINT(-16.2518 14.6928)"
  }'
```

### 2. Vérifier sur la carte

- Aller dans l'onglet "Carte"
- La parcelle devrait apparaître à Kaolack

## 🌱 Planter une culture

### 1. Ajouter une culture

```bash
curl -X POST http://localhost:54321/rest/v1/crops \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plot_id": "plot-uuid",
    "crop_type": "mil",
    "variety": "Souna 3",
    "sowing_date": "2024-06-15",
    "expected_harvest": "2024-10-15"
  }'
```

### 2. Enregistrer une opération

```bash
curl -X POST http://localhost:54321/rest/v1/operations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "crop_id": "crop-uuid",
    "operation_type": "semis",
    "date": "2024-06-15",
    "notes": "Semis effectué avec succès"
  }'
```

## 📊 Voir les données

### Tableau de bord

1. Aller dans l'onglet "Tableau de bord"
2. Voir les statistiques :
   - Nombre de producteurs
   - Parcelles en cours
   - Cultures plantées
   - Opérations récentes

### Rapports

1. Aller dans l'onglet "Rapports"
2. Générer un rapport :
   - Par période
   - Par culture
   - Par coopérative

## 🔔 Recevoir des notifications

### Configuration SMS

1. Aller dans "Paramètres"
2. Configurer Twilio :
   - Account SID
   - Auth Token
   - Numéro de téléphone

### Test de notification

```bash
# Déclencher une notification test
curl -X POST http://localhost:54321/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+221701234567",
    "message": "Test de notification AgriConnect"
  }'
```

## 🧪 Tests de fonctionnement

### Checklist de validation

- [ ] Connexion utilisateur fonctionne
- [ ] Création de coopérative réussie
- [ ] Ajout de producteur OK
- [ ] Création de parcelle avec GPS
- [ ] Plantation de culture
- [ ] Enregistrement d'opération
- [ ] Affichage sur la carte
- [ ] Génération de rapport
- [ ] Envoi de notification SMS

### Tests de performance

```bash
# Test de charge simple
npm run test:api

# Test de synchronisation offline
# 1. Couper la connexion
# 2. Ajouter des données
# 3. Rétablir la connexion
# 4. Vérifier la synchronisation
```

## 🎉 Félicitations !

Vous avez maintenant :
- ✅ Une installation fonctionnelle
- ✅ Un utilisateur admin créé
- ✅ Une coopérative configurée
- ✅ Un producteur ajouté
- ✅ Une parcelle géolocalisée
- ✅ Une culture plantée
- ✅ Des opérations enregistrées

## 📚 Prochaines étapes

- [Guide de développement](../development/guide.md)
- [Architecture du système](../architecture/overview.md)
- [Déploiement en production](../deployment/guide.md)
- [Dépannage](../troubleshooting/common-issues.md)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com

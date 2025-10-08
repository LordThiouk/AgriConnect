# Scripts de Test - AgriConnect

## 🧪 Test des Services Domain

Ce dossier contient les scripts de test pour valider tous les services domain avant la migration.

### 📋 Prérequis

1. **Variables d'environnement** dans `.env` à la racine du projet :
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Installation des dépendances** :
   ```bash
   cd mobile/scripts
   npm install
   ```

### 🚀 Exécution des Tests

```bash
# Test complet des services
npm run test:services

# Test en mode watch (re-exécution automatique)
npm run test:services:watch
```

### 📊 Ce qui est testé

#### Services Domain
- ✅ **FarmFilesService** - Fiches d'exploitation
- ✅ **ObservationsService** - Observations terrain
- ✅ **OperationsService** - Opérations agricoles
- ✅ **InputsService** - Intrants agricoles
- ✅ **RecommendationsService** - Recommandations
- ✅ **ParticipantsService** - Participants/intervenants
- ✅ **VisitsService** - Visites des agents
- ✅ **ProducersService** - Producteurs
- ✅ **PlotsService** - Parcelles
- ✅ **AlertsService** - Alertes

#### Tests Effectués
- **Connexion Supabase** - Vérification de la connectivité
- **Authentification** - Test des permissions RLS
- **Méthodes principales** - Test de toutes les méthodes publiques
- **Performance** - Mesure des temps de réponse
- **Gestion d'erreurs** - Validation des erreurs

### 📈 Résultats Attendus

```
🚀 Starting AgriConnect Services Test Suite
==========================================

🔌 Testing Supabase Connection...
✅ [Supabase] connection - 45ms
✅ [Supabase] auth - 12ms

📋 Testing FarmFilesService...
✅ [FarmFilesService] getFarmFiles - 234ms
✅ [FarmFilesService] getAgentFarmFileStats - 156ms

👁️ Testing ObservationsService...
✅ [ObservationsService] getObservationsByPlotId - 189ms
✅ [ObservationsService] getLatestObservations - 145ms
✅ [ObservationsService] getObservationsForAgent - 267ms

...

📊 Test Results Summary
======================
✅ Success: 25
❌ Errors: 0
⏭️ Skipped: 0
⏱️ Total Time: 3245ms

🎉 All tests passed! Services are ready for migration.
```

### ⚠️ En cas d'erreurs

Si des tests échouent, vérifiez :

1. **Variables d'environnement** correctes
2. **Permissions RLS** dans Supabase
3. **Données de test** présentes en base
4. **Services** correctement configurés

### 🔧 Personnalisation

Pour ajouter de nouveaux tests :

```typescript
// Dans test-services.ts
async testNewService(): Promise<void> {
  console.log('\n🆕 Testing NewService...');
  
  await this.runTest('NewService', 'methodName', async () => {
    return await NewServiceInstance.methodName(params);
  });
}
```

### 📝 Logs

Les logs détaillés incluent :
- **Temps de réponse** pour chaque méthode
- **Données retournées** (nombre d'éléments)
- **Erreurs détaillées** avec stack trace
- **Performance** (tests lents > 1s)

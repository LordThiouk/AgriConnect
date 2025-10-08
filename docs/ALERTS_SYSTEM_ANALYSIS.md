# Analyse du système d'alertes - AgriConnect

## 🎯 Vue d'ensemble

Le système d'alertes d'AgriConnect fonctionne sur **deux sources principales** :
1. **Observations terrain** (sévérité élevée)
2. **Recommandations automatiques** (règles agricoles)

## 📊 Architecture du système

### **1. Sources d'alertes**

#### **A. Observations terrain (table `observations`)**
- **Déclencheur** : Sévérité >= 3
- **Types** : ravageur, maladie, levée
- **RPC** : `get_agent_terrain_alerts(p_user_id)`
- **Filtrage** : 7 derniers jours, limité à 10 alertes

#### **B. Recommandations automatiques (table `recommendations`)**
- **Déclencheur** : Règles agricoles (`agri_rules`)
- **Statut** : "active" pour affichage
- **RPC** : `get_agent_dashboard_unified` (section alerts)
- **Types** : fertilisation, irrigation, pest_control, harvest, other

### **2. Tables impliquées**

```sql
-- Observations terrain
observations (
  id, observation_type, severity, description,
  plot_id, observed_by, created_at
)

-- Recommandations automatiques  
recommendations (
  id, title, message, priority, status,
  plot_id, producer_id, rule_code, created_at
)

-- Règles agricoles
agri_rules (
  code, name, rule_type, condition, action, priority
)

-- Assignations agent-producteur
agent_assignments (
  agent_id, assigned_to_id, assigned_to_type
)
```

## 🔄 Flux de fonctionnement

### **Phase 1 : Collecte des données**
```
Agent terrain → Observation → Table observations
                ↓
            Si sévérité >= 3
                ↓
            Alerte générée
```

### **Phase 2 : Génération d'alertes**
```
RPC get_agent_terrain_alerts :
1. Récupère agent_id via user_id
2. Trouve producteurs assignés via agent_assignments
3. Filtre observations (sévérité >= 3, 7 derniers jours)
4. Retourne alertes formatées
```

### **Phase 3 : Affichage mobile**
```
DashboardService.getTerrainAlerts() →
  Interface TerrainAlert[] →
    Agent Dashboard (section alertes)
```

## 📱 Interface utilisateur

### **Affichage des alertes**
- **Carte moderne** avec icônes de sévérité
- **Couleurs** : Rouge (high), Orange (medium)
- **Informations** : Titre, description, parcelle, producteur, date
- **Actions** : Voir détails, marquer comme fait

### **Types d'alertes affichées**
1. **Alerte ravageur** (observation_type = 'ravageur')
2. **Alerte maladie** (observation_type = 'maladie')  
3. **Problème de levée** (observation_type = 'levée')
4. **Alerte terrain** (autres types)

## 🔧 Configuration actuelle

### **Seuils de sévérité**
- **High** : severity >= 4
- **Medium** : severity >= 3

### **Filtres temporels**
- **Période** : 7 derniers jours
- **Limite** : 10 alertes maximum

### **Assignations**
- **Agent** → Producteurs via `agent_assignments`
- **Producteurs** → Parcelles via `plots.producer_id`
- **Parcelles** → Observations via `observations.plot_id`

## 📊 Données actuelles

### **Observations trouvées** : 3
- 1 observation haute sévérité (severity = 4)
- Type : ravageur (chenilles sur maïs)
- Producteur : Amadou Test Diop Test
- Parcelle : Parcelle B2 - Légumes

### **Recommandations trouvées** : 3
- Type : irrigation
- Priorité : high
- Statut : pending
- Titre : "Irrigation nécessaire"

### **Règles agricoles** : 5
- Codes : TEST_WORKING_001, RULE_CASSAVA_001, etc.
- Types : Manioc, Maïs, Riz, Lutte ravageurs

## ⚙️ RPCs utilisés

### **1. get_agent_terrain_alerts(p_user_id)**
```sql
-- Récupère les alertes basées sur les observations
-- Filtre par agent → producteurs assignés → observations haute sévérité
-- Retourne : id, title, description, severity, plotName, producerName, createdAt
```

### **2. get_agent_dashboard_unified(p_user_id, p_filter)**
```sql
-- RPC unifié incluant les alertes recommendations
-- Section alerts avec recommendations actives
-- Retourne : stats, visits, alerts
```

## 🎯 Points d'amélioration identifiés

### **1. Cohérence des sources**
- **Problème** : Deux RPCs différents pour les alertes
- **Solution** : Unifier ou clarifier l'usage

### **2. Règles agricoles**
- **Problème** : Colonnes `rule_type`, `condition`, `action` vides
- **Solution** : Compléter les règles ou les supprimer

### **3. Génération automatique**
- **Problème** : Pas de Edge Functions visibles pour l'exécution des règles
- **Solution** : Implémenter des triggers ou Edge Functions

### **4. Gestion des statuts**
- **Problème** : Pas de mécanisme pour marquer les alertes comme "vues"
- **Solution** : Ajouter un champ `viewed_at` ou `status`

## 🚀 Recommandations

### **Court terme**
1. **Tester l'affichage** des alertes dans l'interface mobile
2. **Vérifier** que les alertes s'affichent correctement
3. **Implémenter** les actions (marquer comme fait)

### **Moyen terme**
1. **Unifier** les sources d'alertes (observations + recommendations)
2. **Compléter** les règles agricoles
3. **Ajouter** la gestion des statuts d'alerte

### **Long terme**
1. **Implémenter** des Edge Functions pour l'exécution automatique des règles
2. **Ajouter** des notifications push pour les alertes critiques
3. **Créer** un système de priorités plus sophistiqué

## 📈 Métriques de performance

### **Cache**
- **Durée** : 2 minutes pour les alertes
- **Clé** : `terrain_alerts_{agentId}`
- **Avantage** : Évite les appels RPC répétés

### **Limites**
- **Observations** : 10 alertes max, 7 derniers jours
- **Recommandations** : Via RPC unifié
- **Performance** : Bonne avec cache client

---

**Date d'analyse** : 2 octobre 2025  
**Version** : 1.2.2  
**Statut** : ✅ Système fonctionnel, améliorations possibles

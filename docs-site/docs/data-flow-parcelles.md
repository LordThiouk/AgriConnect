# Documentation : Récupération des données parcelles

## Architecture de récupération des données

### 1. **Culture** 🌱
- **Charge :** À LA DEMANDE via bouton interaction
- **Source :** RPC `get_crops_by_plot_id` 
- **Processus :** 
  1. User clique → `loadCultures()` 
  2. `CollecteService.getCropsByPlotId(plotId, agentId)` 
  3. RPC retourne crops `[{crop_type, variety, ...}]`
  4. Affiche `"${crop_type} - ${variety}"`

### 2. **Localisation** 📍  
- **Charge :** AUTOMATIQUE lors liste parcelles
- **Source :** RPC `get_agent_plots` → champs `name_season_snapshot` 
- **Mappage :** `plot.name_season_snapshot` → `item.location`
- **Affichage :** `item.location || 'Non renseignée'`

## Schema des données

### PlotDisplay Interface
```typescript
interface PlotDisplay {
  id: string;              // ← RPC farm_file_plots.id
  name: string;             // ← RPC farm_file_plots.name_season_snapshot  
  area: number;             // ← RPC farm_file_plots.area_hectares
  producerName: string;     // ← RPC concatenation producer first+last
  location?: string;        // ← RPC farm_file_plots.name_season_snapshot  
  variety?: string;         // ← Vide jusqu'au clic loadCultures
  soilType?: string;        // ← Vide par défaut  
  waterSource?: string;     // ← Vide par défaut
  status: plotStatus;       // ← Actuellement 'preparation' par défaut
  cropsCount: number;       // ← Toujours 0 jusqu'au chargement cultures
  hasGps: boolean;          // ← RPC farm_file_plots.geom IS NOT NULL
}
```

### RPC `get_agent_plots` retourne :
- ✅ `name_season_snapshot`  - nom parcelle + saison
- ✅ `area_hectares` - superficie
- ✅ `producer_first_name/last_name` - info producteur
- ✅ `geom` - géométrie GPS
- ❌ PAS de culture data - chargées a posteriori  
- ❌ PAS de local descriptive - seulement `name_season_snapshot`

## UX/UI Behavior

### Culture loading ⚡ 
- **État initial** : TouchableOpacity avec icone down-arrow 
- **État charging** : spinner loading
- **État loaded** : affichage culture + icone trending-up
- **Fallback** : si pas de données → "Aucune culture"

### Localisation display 📍
- **Source directe** : `{item.location || 'Non renseignée'}`  
- **Réellement mappé** : `plot.name_season_snapshot` → location  
- **Adaptive UI** : si GPS coords → affichage différent potentiel

## Optimisations

- **Performance scroll** : Load à la demande évite 39×RPC simultanes
- **NestedScrollEnabled** : Supporte layout scroll complex 
- **TouchableOpacity states** : gestion UX états loading/success/error

---

*Généré automatiquement depuis l'analyse du code parcelles/index.tsx et CollecteService.ts*

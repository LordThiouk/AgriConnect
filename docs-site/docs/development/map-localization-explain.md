# Documentation : Localisation dans la carte

## 🗂️ **Architecture de la localisation de parcelles**

### 🔧 **1. Récupération des données de géolocalisation**

La localisation s'effectue en **deux étapes principales** :

1. **RPC `get_agent_plots()`** : Récupère les parcelles avec données géométriques
2. **Mapping côté client** : Extrait les coordonnées du champ `geom` PostGIS

#### **Schema des données PostGIS avec coordonnées :**
```
farm_file_plots.geom:
  {
    "type": "Polygon",
    "coordinates": [[[lng, lat], [lng2, lat2], ...]]
  }
```

### 🎯 **2. Extraction des coordonnées**

```typescript
// mobile/lib/services/collecte.ts : getAgentPlots()
plot.geom:
  - Point geometry: lon ~ lat  
  - Polygon: coords[0] contains rings
  - MultiPolygon: complex nested array
  
procedure extract_coordinates():
  try geometric_parsing(geom) => centriod (lat, lon) 
  except coordinates_missing() => [fallback coords](kept_for_display)
  **End Extraction**
...
```

#### **Types supportés:**
```328: 335:mobile/lib/services/collecte.ts
if (plot.geom.type === 'Point') {
    coords = [plot.geom.coordinates];
} else if (plot.geom.type === 'Polygon') {
    coords = plot.geom.coordinates[0];
} else if (plot.geom.type === 'MultiPolygon') {
    coords = plot.geom.coordinates[0][0];
}
```

### ⎿ **3. Mise à jour du MapComponent**

Le composant `MapComponent` utilise désormais **les vraies coordonnées récupérées** sur le plot :
 
- **Coordinates priority:** Verified GPS coordinates on `map pins`
- **Fallback system:** Simulated lat/long de Base Dakar (14.6937, -17.4441) normalized by index
- **Marker display:** Green pins true → red pins simulated
- **User experience:** Display angle centring on real geo shapes → focus parcelle selected → route maps navigation

### ⚡ **4. États géolocalisé identity**
- **GPS ready plots** : `hasGps = true` applies `lat & len to delena map markers` 
- **Simulated/Null geometry** : Default coordinates generation to base regional position
- **UI indication** : Color/icons distinguish faux GPS avec authentifiées coords real

### ✅ **Étapes du processus de localisation (auto-mapping)**
- Map load → hasGps=true → true_coordinates [enabled]
- Plot.size === markers [exact match]
- Maps.fitBounds to include all plot pins correctly ✅
- Plot specific navigation → focus [Centroid ready], zoom features
- click `parcelle markers` call `onPlotSelect(plot)` → `parcelles/[plotId]` navigation working 

## 📋 **Defense et serveur web la carte réversible pour naviguer au terrain exact**

- **Perimeter map bounds:** Maps.center sur géométrique extraite et vicinity.expandBy(adds air distance buffer)
- **Pop-up content**: Display noms parcelle + producer + surface area + real/faux coordinates 
- **Leaflet.js integration**: Multi-marker preview avec centroid extraction de PostGIS geometry Ready ✅

---

*Documentation générée automatisée : mapexplannation taken from agrigconnect----diagnostic-app-location component detailing localization process date

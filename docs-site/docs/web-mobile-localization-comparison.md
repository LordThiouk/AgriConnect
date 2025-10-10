# Comparaison : Localisation carte Web vs Mobile

## 🏗️ Architecture des données

### 🌐 **WEB - (PlotsPage.tsx + PlotsLeafletMap.tsx)**

**RPC** : `get_plots_with_geolocation`

- **Calcul coordonnées** : Côté Supabase (SQL)
- **Extraction lat/lng** : Direct depuis RPC
- **Filtrage** : Parcelles sans coordonnées exclues automatiquement
- **Performance** : Optimale (calcul serveur)

```sql
-- Calcul côté Supabase
CASE 
  WHEN ffp.center_point IS NOT NULL THEN ST_Y(ffp.center_point::geometry)
  WHEN ffp.geom IS NOT NULL THEN ST_Y(ST_Centroid(ffp.geom))
  ELSE NULL
END as latitude
```

### 📱 **MOBILE - (ParcellesScreen.tsx + MapComponent.tsx)**

**RPC** : `get_agent_plots`

- **Calcul coordonnées** : Côté client JavaScript
- **Extraction** : Conversion PostGIS `geom` → lat/lng
- **Fallback** : Simulations si géométrie manquante
- **Performance** : Coûteuse (calcul client)

```typescript
// mobile/lib/services/collecte.ts
if (plot.geom.type === 'Point') {
  coords = [plot.geom.coordinates];
} else if (plot.geom.type === 'Polygon') {
  coords = plot.geom.coordinates[0];
}
```

## 📊 Comparaison workflows

| **Critère** | **🌐 WEB** | **📱 MOBILE** |
|-------------|------------|---------------|
| **Source données** | RPC direct avec lat/lng calculées | RPC avec geom brut |
| **Extraction GPS** | Serveur PostGIS `ST_Y/ST_X` | Client JS conversion |
| **Performance** | Optimale (0 calcul client) | Ralentie (parcel-by-parcel) |
| **Fallback système** | ❌ Exclusion parcelles sans geo | ✅ Coords simulées Dakar |
| **Reliability** | Simple et robuste | Complexité conversion |
| **Affichage markers** | Direct `plot.latitude` | Conversion `geom→lat/lng` |

## 💡 Optimisations recommandées

1. **Uniformiser vers standard WEB** :
   - Faire calcul côté serveur pour Mobile aussi
   - Remplacer conversion client par RPC calculée
   - Améliorer performance mobile

2. **Ajuster format de retour** :
   - Harmoniser RPC entre Web + Mobile
   - Coordonnées retournées depuis Supabase côté mobile

## 🔄 Migration suggérée

**MOBILE** → **WEB-STYLE RPC**

- Utiliser `get_plots_with_geolocation` côté mobile
- Faire calcul SQL latitude/longitude côté serveur
- Harmoniser reliability et performance
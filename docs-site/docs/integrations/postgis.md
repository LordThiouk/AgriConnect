# 🗺️ Intégration PostGIS

Configuration et utilisation de PostGIS pour la géolocalisation dans AgriConnect.

## 🎯 Vue d'ensemble

PostGIS est utilisé pour gérer les données géospatiales des parcelles agricoles dans AgriConnect.

## 🔧 Configuration

### 1. Activation de PostGIS

```sql
-- Activer l'extension PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Vérifier l'installation
SELECT PostGIS_Version();
```

### 2. Configuration des Tables

```sql
-- Table des parcelles avec géométrie
CREATE TABLE plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid REFERENCES producers(id) ON DELETE CASCADE,
  name text,
  area_ha numeric CHECK (area_ha > 0),
  soil_type text,
  water_source text,
  status plot_status DEFAULT 'active',
  geom geometry(Polygon, 4326), -- Géométrie en WGS84
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index spatial
CREATE INDEX idx_plots_geom ON plots USING GIST (geom);

-- Index pour les recherches
CREATE INDEX idx_plots_producer ON plots(producer_id);
CREATE INDEX idx_plots_status ON plots(status);
```

### 3. Types de Géométries

```sql
-- Points (pour les observations)
CREATE TABLE observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid REFERENCES crops(id) ON DELETE CASCADE,
  observation_type observation_type NOT NULL,
  severity integer CHECK (severity >= 1 AND severity <= 5),
  description text,
  location geometry(Point, 4326), -- Point d'observation
  observed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Index spatial pour les points
CREATE INDEX idx_observations_location ON observations USING GIST (location);
```

## 💻 Implémentation

### 1. Service de Géolocalisation

```typescript
// Service de géolocalisation
export class GeospatialService {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }
  
  // Créer une parcelle avec géométrie
  async createPlot(plotData: CreatePlotData) {
    const { data, error } = await this.supabase
      .from('plots')
      .insert({
        ...plotData,
        geom: `POINT(${plotData.longitude} ${plotData.latitude})`
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Créer une parcelle avec polygone
  async createPlotWithPolygon(plotData: CreatePlotData, coordinates: Coordinate[]) {
    const wkt = this.coordinatesToWKT(coordinates);
    
    const { data, error } = await this.supabase
      .from('plots')
      .insert({
        ...plotData,
        geom: `POLYGON((${wkt}))`
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Convertir les coordonnées en WKT
  private coordinatesToWKT(coordinates: Coordinate[]): string {
    return coordinates
      .map(coord => `${coord.longitude} ${coord.latitude}`)
      .join(', ');
  }
}
```

### 2. Requêtes Spatiales

```typescript
// Requêtes spatiales
export class SpatialQueries {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }
  
  // Trouver les parcelles dans un rayon
  async findPlotsInRadius(
    centerLat: number, 
    centerLng: number, 
    radiusMeters: number
  ) {
    const { data, error } = await this.supabase
      .rpc('find_plots_in_radius', {
        center_lat: centerLat,
        center_lng: centerLng,
        radius_meters: radiusMeters
      });
    
    if (error) throw error;
    return data;
  }
  
  // Calculer la superficie d'une parcelle
  async calculatePlotArea(plotId: string) {
    const { data, error } = await this.supabase
      .rpc('calculate_plot_area', {
        plot_id: plotId
      });
    
    if (error) throw error;
    return data;
  }
  
  // Trouver les parcelles qui intersectent une zone
  async findPlotsInBounds(bounds: BoundingBox) {
    const { data, error } = await this.supabase
      .rpc('find_plots_in_bounds', {
        min_lat: bounds.minLat,
        min_lng: bounds.minLng,
        max_lat: bounds.maxLat,
        max_lng: bounds.maxLng
      });
    
    if (error) throw error;
    return data;
  }
}
```

### 3. Fonctions SQL Personnalisées

```sql
-- Fonction pour trouver les parcelles dans un rayon
CREATE OR REPLACE FUNCTION find_plots_in_radius(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision
)
RETURNS TABLE (
  id uuid,
  name text,
  area_ha numeric,
  distance_meters double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.area_ha,
    ST_Distance(
      p.geom::geography,
      ST_Point(center_lng, center_lat)::geography
    ) as distance_meters
  FROM plots p
  WHERE ST_DWithin(
    p.geom::geography,
    ST_Point(center_lng, center_lat)::geography,
    radius_meters
  )
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la superficie
CREATE OR REPLACE FUNCTION calculate_plot_area(plot_id uuid)
RETURNS double precision AS $$
DECLARE
  area_sq_meters double precision;
BEGIN
  SELECT ST_Area(geom::geography)
  INTO area_sq_meters
  FROM plots
  WHERE id = plot_id;
  
  RETURN area_sq_meters / 10000; -- Convertir en hectares
END;
$$ LANGUAGE plpgsql;

-- Fonction pour trouver les parcelles dans une zone
CREATE OR REPLACE FUNCTION find_plots_in_bounds(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision
)
RETURNS TABLE (
  id uuid,
  name text,
  area_ha numeric,
  geom geometry
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.area_ha,
    p.geom
  FROM plots p
  WHERE ST_Intersects(
    p.geom,
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
  );
END;
$$ LANGUAGE plpgsql;
```

## 📱 Intégration Mobile

### 1. Récupération de la Position

```typescript
// Hook pour la géolocalisation
export const useLocation = () => {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setLocation(location);
    } catch (err) {
      setError('Erreur de géolocalisation');
    }
  };
  
  return { location, error, getCurrentLocation };
};
```

### 2. Création de Parcelles

```typescript
// Composant de création de parcelle
const CreatePlotForm = ({ producerId }: { producerId: string }) => {
  const { location, getCurrentLocation } = useLocation();
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  
  const handleCreatePlot = async () => {
    if (coordinates.length < 3) {
      alert('Au moins 3 points requis pour créer une parcelle');
      return;
    }
    
    try {
      const plotData = {
        producer_id: producerId,
        name: 'Nouvelle parcelle',
        area_ha: calculateArea(coordinates),
        soil_type: 'sableux',
        water_source: 'puits'
      };
      
      await geospatialService.createPlotWithPolygon(plotData, coordinates);
      alert('Parcelle créée avec succès');
    } catch (error) {
      alert('Erreur lors de la création de la parcelle');
    }
  };
  
  return (
    <View>
      <Button onPress={getCurrentLocation}>
        Obtenir ma position
      </Button>
      
      {location && (
        <Text>
          Position: {location.coords.latitude}, {location.coords.longitude}
        </Text>
      )}
      
      <Button onPress={handleCreatePlot}>
        Créer la parcelle
      </Button>
    </View>
  );
};
```

## 🌐 Intégration Web

### 1. Affichage de Cartes

```typescript
// Composant de carte avec Leaflet
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';

const PlotsMap = ({ plots }: { plots: Plot[] }) => {
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  
  useEffect(() => {
    if (plots.length > 0) {
      const coordinates = plots.flatMap(plot => 
        plot.geom.coordinates[0].map(coord => [coord[1], coord[0]])
      );
      
      const newBounds = new LatLngBounds(coordinates);
      setBounds(newBounds);
    }
  }, [plots]);
  
  return (
    <MapContainer
      center={[14.6928, -16.2518]}
      zoom={10}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {plots.map(plot => (
        <Polygon
          key={plot.id}
          positions={plot.geom.coordinates[0].map(coord => [coord[1], coord[0]])}
          color="blue"
          fillColor="lightblue"
        >
          <Popup>
            <div>
              <h3&gt;{plot.name}</h3&gt;
              <p>Superficie: {plot.area_ha} ha</p>
              <p>Type de sol: {plot.soil_type}</p>
            </div>
          </Popup>
        </Polygon>
      ))}
    </MapContainer>
  );
};
```

### 2. Recherche Spatiale

```typescript
// Composant de recherche spatiale
const SpatialSearch = ({ onResults }: { onResults: (plots: Plot[]) => void }) => {
  const [center, setCenter] = useState<Coordinate>({ latitude: 14.6928, longitude: -16.2518 });
  const [radius, setRadius] = useState<number>(1000);
  
  const handleSearch = async () => {
    try {
      const plots = await spatialQueries.findPlotsInRadius(
        center.latitude,
        center.longitude,
        radius
      );
      
      onResults(plots);
    } catch (error) {
      console.error('Erreur de recherche spatiale:', error);
    }
  };
  
  return (
    <div className="spatial-search">
      <div>
        <label>Latitude:</label>
        <input
          type="number"
          value={center.latitude}
          onChange={(e) => setCenter(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
        />
      </div>
      
      <div>
        <label>Longitude:</label>
        <input
          type="number"
          value={center.longitude}
          onChange={(e) => setCenter(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
        />
      </div>
      
      <div>
        <label>Rayon (mètres):</label>
        <input
          type="number"
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
        />
      </div>
      
      <button onClick={handleSearch}>
        Rechercher
      </button>
    </div>
  );
};
```

## 📊 Analytics Spatiales

### 1. Statistiques par Zone

```sql
-- Statistiques par région
SELECT 
  region,
  COUNT(*) as total_plots,
  SUM(area_ha) as total_area,
  AVG(area_ha) as avg_area
FROM plots p
JOIN producers pr ON p.producer_id = pr.id
GROUP BY region
ORDER BY total_area DESC;
```

### 2. Densité de Parcelles

```sql
-- Densité de parcelles par km²
SELECT 
  region,
  COUNT(*) as plot_count,
  SUM(area_ha) as total_area_ha,
  COUNT(*) / (SUM(area_ha) / 100) as density_per_km2
FROM plots p
JOIN producers pr ON p.producer_id = pr.id
GROUP BY region;
```

## 🧪 Tests

### 1. Tests des Requêtes Spatiales

```typescript
// Tests des requêtes spatiales
describe('SpatialQueries', () => {
  let spatialQueries: SpatialQueries;
  
  beforeEach(() => {
    spatialQueries = new SpatialQueries(supabase);
  });
  
  it('should find plots in radius', async () => {
    const plots = await spatialQueries.findPlotsInRadius(14.6928, -16.2518, 1000);
    
    expect(plots).toBeDefined();
    expect(Array.isArray(plots)).toBe(true);
  });
  
  it('should calculate plot area', async () => {
    const area = await spatialQueries.calculatePlotArea('plot-uuid');
    
    expect(area).toBeGreaterThan(0);
  });
});
```

### 2. Tests des Fonctions SQL

```sql
-- Tests des fonctions PostGIS
SELECT 
  find_plots_in_radius(14.6928, -16.2518, 1000) as radius_test,
  calculate_plot_area('plot-uuid') as area_test,
  find_plots_in_bounds(14.6, -16.3, 14.8, -16.1) as bounds_test;
```

## 🔒 Sécurité

### 1. Validation des Coordonnées

```typescript
// Validation des coordonnées
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

// Validation des polygones
export const validatePolygon = (coordinates: Coordinate[]): boolean => {
  if (coordinates.length < 3) return false;
  
  // Vérifier que le polygone est fermé
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  
  return first.latitude === last.latitude && first.longitude === last.longitude;
};
```

### 2. Limitation des Requêtes

```sql
-- Limiter les requêtes spatiales coûteuses
CREATE OR REPLACE FUNCTION find_plots_in_radius(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision
)
RETURNS TABLE (...) AS $$
BEGIN
  -- Limiter le rayon à 10km
  IF radius_meters > 10000 THEN
    RAISE EXCEPTION 'Rayon maximum de 10km autorisé';
  END IF;
  
  -- Limiter le nombre de résultats
  RETURN QUERY
  SELECT ... FROM plots p
  WHERE ST_DWithin(...)
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;
```

## 📚 Ressources

- [Documentation PostGIS](https://postgis.net/documentation/)
- [Documentation Supabase PostGIS](https://supabase.com/docs/guides/database/extensions/postgis)
- [Tutoriel PostGIS](https://postgis.net/workshops/postgis-intro/)
- [Référence des fonctions PostGIS](https://postgis.net/docs/reference.html)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com

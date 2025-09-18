import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { PlotDisplay } from '../types/collecte';

interface MapComponentProps {
  plots: PlotDisplay[];
  onPlotSelect?: (plot: PlotDisplay) => void;
  selectedPlotId?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  plots, 
  onPlotSelect, 
  selectedPlotId 
}) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission de localisation refusée');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  // Générer des coordonnées GPS pour les parcelles
  const generateCoordinates = (plot: PlotDisplay, index: number) => {
    const baseLat = 14.6937;
    const baseLng = -17.4441;
    
    return {
      id: plot.id,
      name: plot.name,
      producerName: plot.producerName,
      area: plot.area,
      latitude: baseLat + (index * 0.01),
      longitude: baseLng + (index * 0.01),
      hasGps: plot.hasGps,
    };
  };

  const coordinates = plots.map((plot, index) => generateCoordinates(plot, index));

  // Créer le HTML de la carte Leaflet
  const mapHtml = useMemo(() => {
    const centerLat = location?.coords.latitude || 14.6937;
    const centerLng = location?.coords.longitude || -17.4441;
    
    const markers = coordinates.map(coord => `
      <div class="marker" data-plot-id="${coord.id}" data-lat="${coord.latitude}" data-lng="${coord.longitude}">
        <div class="marker-icon ${coord.hasGps ? 'gps' : 'simulated'}">
          📍
        </div>
        <div class="marker-popup">
          <strong>${coord.name}</strong><br>
          ${coord.producerName}<br>
          ${coord.area} ha<br>
          <small>${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}</small>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parcelles Agricoles</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          #map { height: 100vh; width: 100vw; }
          .marker { position: absolute; z-index: 1000; }
          .marker-icon { 
            width: 30px; height: 30px; 
            background: #3D944B; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: transform 0.2s;
          }
          .marker-icon:hover { transform: scale(1.1); }
          .marker-icon.gps { background: #3D944B; }
          .marker-icon.simulated { background: #9CA3AF; }
          .marker-popup {
            position: absolute;
            bottom: 35px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 8px 12px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            white-space: nowrap;
            font-size: 12px;
            display: none;
            z-index: 1001;
          }
          .marker:hover .marker-popup { display: block; }
          .leaflet-popup-content { font-size: 14px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        ${markers}
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          // Initialiser la carte
          const map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
          
          // Ajouter les tuiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          
          // Ajouter les marqueurs
          const markers = document.querySelectorAll('.marker');
          markers.forEach(marker => {
            const lat = parseFloat(marker.dataset.lat);
            const lng = parseFloat(marker.dataset.lng);
            const plotId = marker.dataset.plotId;
            
            const leafletMarker = L.marker([lat, lng]).addTo(map);
            
            // Créer le popup
            const popup = marker.querySelector('.marker-popup');
            const popupContent = popup.innerHTML;
            
            leafletMarker.bindPopup(popupContent);
            
            // Gérer le clic
            leafletMarker.on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'plotSelected',
                plotId: plotId
              }));
            });
          });
          
          // Ajuster la vue pour inclure tous les marqueurs
          if (markers.length > 0) {
            const group = new L.featureGroup();
            markers.forEach(marker => {
              const lat = parseFloat(marker.dataset.lat);
              const lng = parseFloat(marker.dataset.lng);
              group.addLayer(L.marker([lat, lng]));
            });
            map.fitBounds(group.getBounds().pad(0.1));
          }
        </script>
      </body>
      </html>
    `;
  }, [coordinates, location]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'plotSelected') {
        const plot = plots.find(p => p.id === data.plotId);
        if (plot && onPlotSelect) {
          onPlotSelect(plot);
        }
      }
    } catch (error) {
      console.error('Erreur parsing message WebView:', error);
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carte des Parcelles</Text>
        <Text style={styles.subtitle}>
          {coordinates.length} parcelle{coordinates.length > 1 ? 's' : ''} affichée{coordinates.length > 1 ? 's' : ''}
        </Text>
      </View>
      
      <WebView
        source={{ html: mapHtml }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  webview: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MapComponent;
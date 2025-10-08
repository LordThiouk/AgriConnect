import React, { useEffect, useState, useMemo } from 'react';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { PlotDisplay } from '../lib/services/domain/plots/plots.types';
import { 
  Box, 
  Text, 
  VStack
} from 'native-base';

interface MapComponentProps {
  plots: PlotDisplay[];
  onPlotSelect?: (plot: PlotDisplay) => void;
  onPlotSelected?: (plotId: string) => void;
  selectedPlotId?: string;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  plots, 
  onPlotSelect, 
  onPlotSelected,
  selectedPlotId,
  centerLat,
  centerLng,
  zoom = 13
}) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let watchId: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        console.log('🗺️ [MapComponent] Demande de permission GPS...');
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        console.log('🗺️ [MapComponent] Statut permission GPS:', status);
        
        if (status !== 'granted') {
          setErrorMsg('Permission de localisation refusée');
          console.log('❌ [MapComponent] Permission GPS refusée');
          return;
        }

        console.log('🗺️ [MapComponent] Démarrage du suivi GPS en temps réel...');
        
        // Récupérer la position initiale
        let initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        console.log('✅ [MapComponent] Position GPS initiale récupérée:', {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          accuracy: initialLocation.coords.accuracy
        });
        
        setLocation(initialLocation);

        // Démarrer le suivi en temps réel
        watchId = await Location.watchPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Mise à jour toutes les 30 secondes
          distanceInterval: 10, // Mise à jour si déplacement de plus de 10 mètres
        }, (newLocation) => {
          console.log('🔄 [MapComponent] Position mise à jour:', {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
            timestamp: new Date(newLocation.timestamp).toLocaleTimeString()
          });
          
          setLocation(newLocation);
        });

        console.log('✅ [MapComponent] Suivi GPS démarré avec succès');
        
      } catch (error) {
        console.error('❌ [MapComponent] Erreur suivi GPS:', error);
        setErrorMsg('Erreur lors du suivi de la position');
      }
    };

    startLocationTracking();

    // Nettoyer le suivi au démontage du composant
    return () => {
      if (watchId) {
        console.log('🗺️ [MapComponent] Arrêt du suivi GPS');
        watchId.remove();
      }
    };
  }, []);

  // Utiliser seulement les coordonnées GPS réelles (pas de simulation)
  const coordinates = plots
    .filter(plot => plot.center_point && (plot.center_point as any).coordinates)
    .map(plot => ({
      id: plot.id,
      name: plot.name_season_snapshot || plot.name || 'Parcelle sans nom',
      producerName: plot.producer_name,
      area: plot.area_hectares || plot.area || 0,
      latitude: (plot.center_point as any).coordinates[1],
      longitude: (plot.center_point as any).coordinates[0],
      hasGps: true,
    }));

  console.log('🗺️ [MapComponent] Données reçues:', {
    plotsCount: plots.length,
    coordinatesCount: coordinates.length,
    coordinates: coordinates.slice(0, 3), // Premiers 3 pour debug
    centerLat,
    centerLng,
    agentLocation: location ? {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      accuracy: location.coords.accuracy
    } : null,
    zoom
  });

  // Créer le HTML de la carte Leaflet
  const mapHtml = useMemo(() => {
    // Priorité : centerLat/centerLng > position agent > position parcelles > Dakar par défaut
    let mapCenterLat, mapCenterLng;
    
    if (centerLat && centerLng) {
      // Position explicite fournie
      mapCenterLat = centerLat;
      mapCenterLng = centerLng;
      console.log('🗺️ [MapComponent] Utilisation position explicite:', { lat: mapCenterLat, lng: mapCenterLng });
    } else if (location?.coords.latitude && location?.coords.longitude) {
      // Position de l'agent
      mapCenterLat = location.coords.latitude;
      mapCenterLng = location.coords.longitude;
      console.log('🗺️ [MapComponent] Utilisation position agent:', { lat: mapCenterLat, lng: mapCenterLng });
    } else if (coordinates.length > 0) {
      // Centrer sur les parcelles
      const avgLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / coordinates.length;
      const avgLng = coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / coordinates.length;
      mapCenterLat = avgLat;
      mapCenterLng = avgLng;
      console.log('🗺️ [MapComponent] Utilisation centre parcelles:', { lat: mapCenterLat, lng: mapCenterLng });
    } else {
      // Position par défaut : Dakar, Sénégal
      mapCenterLat = 14.6937;
      mapCenterLng = -17.4441;
      console.log('🗺️ [MapComponent] Utilisation position par défaut Dakar:', { lat: mapCenterLat, lng: mapCenterLng });
    }
    
    const mapZoom = zoom;
    
    const markers = coordinates.map(coord => `
      <div class="marker" data-plot-id="${coord.id}" data-lat="${coord.latitude}" data-lng="${coord.longitude}">
        <div class="marker-icon">
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
          body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif; 
            background: #f0f0f0;
            overflow: hidden;
          }
          #map { 
            height: 100vh !important; 
            width: 100vw !important; 
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            z-index: 1 !important;
            background: #e0e0e0 !important;
            min-height: 400px !important;
            display: block !important;
          }
          .leaflet-container {
            height: 100% !important;
            width: 100% !important;
            min-height: 400px !important;
          }
          .marker { 
            position: absolute; 
            z-index: 1000; 
            cursor: pointer;
          }
          .marker-icon { 
            width: 30px; 
            height: 30px; 
            background: #3D944B !important; 
            border-radius: 50% !important; 
            border: 3px solid white !important;
            display: flex !important; 
            align-items: center !important; 
            justify-content: center !important; 
            color: white !important;
            font-size: 12px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
            transition: transform 0.2s !important;
            position: relative !important;
            transform: translate(-50%, -50%) !important;
          }
          .marker-icon:hover { transform: scale(1.1); }
          .custom-marker {
            background: transparent !important;
            border: none !important;
          }
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
          console.log('🗺️ [MapComponent] Script démarré');
          
          try {
            console.log('🗺️ [MapComponent] Initialisation de la carte...');
            console.log('🗺️ [MapComponent] Centre:', ${mapCenterLat}, ${mapCenterLng});
            console.log('🗺️ [MapComponent] Zoom:', ${mapZoom});
          // Initialiser la carte
          const map = L.map('map').setView([${mapCenterLat}, ${mapCenterLng}], ${mapZoom});
          console.log('🗺️ [MapComponent] Carte créée');
          
          // Vérifier que la carte est visible
          setTimeout(() => {
            const mapElement = document.getElementById('map');
            const mapContainer = map.getContainer();
            const leafletContainer = document.querySelector('.leaflet-container');
            
            // Forcer la hauteur si elle est 0
            if (mapElement && mapElement.offsetHeight === 0) {
              mapElement.style.height = '400px';
              mapElement.style.minHeight = '400px';
              console.log('🗺️ [MapComponent] Hauteur forcée à 400px');
            }
            
            if (mapContainer && mapContainer.offsetHeight === 0) {
              mapContainer.style.height = '400px';
              mapContainer.style.minHeight = '400px';
              console.log('🗺️ [MapComponent] Container hauteur forcée à 400px');
            }
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapDebug',
              mapElementExists: !!mapElement,
              mapContainerExists: !!mapContainer,
              leafletContainerExists: !!leafletContainer,
              mapElementSize: mapElement ? {
                width: mapElement.offsetWidth,
                height: mapElement.offsetHeight,
                clientWidth: mapElement.clientWidth,
                clientHeight: mapElement.clientHeight
              } : null,
              mapContainerSize: mapContainer ? {
                width: mapContainer.offsetWidth,
                height: mapContainer.offsetHeight
              } : null,
              leafletContainerSize: leafletContainer ? {
                width: leafletContainer.offsetWidth,
                height: leafletContainer.offsetHeight
              } : null
            }));
          }, 1000);
          
          // Ajouter les tuiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          console.log('🗺️ [MapComponent] Tuiles ajoutées');
          
          // Marqueur de test retiré - utilisation de la position GPS de l'agent
          
          // Ajouter quelques marqueurs simples
          console.log('🗺️ [MapComponent] Création de marqueurs simples');
          
          // Ajouter le marqueur de l'agent si disponible
          const agentLat = ${location?.coords.latitude || 'null'};
          const agentLng = ${location?.coords.longitude || 'null'};
          
          if (agentLat && agentLng) {
            console.log('🗺️ [MapComponent] Ajout marqueur agent:', agentLat, agentLng);
            const agentMarker = L.marker([agentLat, agentLng], {
              icon: L.divIcon({
                className: 'agent-marker',
                html: '<div style="background: #FF6B35; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">👤</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })
            });
            
            agentMarker.bindPopup('<div style="text-align: center;"><strong>Votre position</strong><br>Agent de terrain</div>');
            map.addLayer(agentMarker);
          }
          
          const coordinatesData = ${JSON.stringify(coordinates)};
          console.log('🗺️ [MapComponent] Données coordinates:', coordinatesData);
          console.log('🗺️ [MapComponent] Nombre de marqueurs:', coordinatesData.length);
          
          if (coordinatesData && coordinatesData.length > 0) {
            coordinatesData.forEach((coord, index) => {
              if (coord.latitude && coord.longitude) {
                console.log('🗺️ [MapComponent] Ajout marqueur simple:', coord.id);
                const marker = L.marker([coord.latitude, coord.longitude]);
                
                // Ajouter un popup avec les informations de la parcelle
                const popupContent = 
                  '<div style="text-align: center; min-width: 150px;">' +
                    '<h4 style="margin: 0 0 8px 0; color: #3D944B; font-size: 14px;">' + (coord.name || 'Parcelle') + '</h4>' +
                    '<p style="margin: 4px 0; font-size: 12px; color: #666;">' +
                      '<strong>Producteur:</strong> ' + (coord.producerName || 'Non renseigné') +
                    '</p>' +
                    '<p style="margin: 4px 0; font-size: 12px; color: #666;">' +
                      '<strong>Surface:</strong> ' + (coord.area || 0) + ' ha' +
                    '</p>' +
                    '<p style="margin: 4px 0; font-size: 12px; color: #3D944B;">' +
                      '<strong>Cliquez pour voir les détails</strong>' +
                    '</p>' +
                  '</div>';
                
                marker.bindPopup(popupContent);
                
                // Gérer le clic sur le marqueur
                marker.on('click', () => {
                  console.log('🗺️ [MapComponent] Clic sur parcelle:', coord.id);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'plotSelected',
                    plotId: coord.id,
                    plotName: coord.name,
                    producerName: coord.producerName
                  }));
                });
                
                map.addLayer(marker);
              }
            });
          }
          
          console.log('🗺️ [MapComponent] Script terminé avec succès');
          
          } catch (error) {
            console.error('🗺️ [MapComponent] Erreur JavaScript:', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'javascriptError',
              error: error.message,
              stack: error.stack
            }));
          }
          
          // Ajuster la vue pour inclure tous les marqueurs ou focus sur une parcelle spécifique
          if (markers.length > 0) {
            // Si une parcelle est sélectionnée, centrer sur elle
            if (selectedMarker) {
              map.setView(selectedMarker.getLatLng(), ${mapZoom});
            } else {
              // Sinon, ajuster pour inclure toutes les parcelles
              map.fitBounds(group.getBounds().pad(0.1));
            }
          }
          
          // Message de diagnostic final
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapInitialized',
            markersCount: markers.length,
            centerLat: ${mapCenterLat},
            centerLng: ${mapCenterLng},
            zoom: ${mapZoom}
          }));
        </script>
      </body>
      </html>
    `;
  }, [coordinates, location, centerLat, centerLng, zoom]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('🗺️ [MapComponent] Message reçu:', data);
      
      if (data.type === 'plotSelected') {
        const plot = plots.find(p => p.id === data.plotId);
        if (plot && onPlotSelect) {
          onPlotSelect(plot);
        }
      } else if (data.type === 'markerAdded') {
        console.log('🗺️ [MapComponent] Marqueur ajouté:', data.plotId, data.lat, data.lng);
      } else if (data.type === 'mapInitialized') {
        console.log('🗺️ [MapComponent] Carte initialisée:', {
          markersCount: data.markersCount,
          center: [data.centerLat, data.centerLng],
          zoom: data.zoom
        });
        } else if (data.type === 'mapDebug') {
          console.log('🗺️ [MapComponent] Debug carte:', {
            mapElementExists: data.mapElementExists,
            mapContainerExists: data.mapContainerExists,
            mapElementSize: data.mapElementSize,
            mapContainerSize: data.mapContainerSize
          });
        } else if (data.type === 'javascriptError') {
          console.error('🗺️ [MapComponent] Erreur JavaScript dans WebView:', {
            error: data.error,
            stack: data.stack
          });
        } else if (data.type === 'plotSelected') {
          console.log('🗺️ [MapComponent] Parcelle sélectionnée:', {
            plotId: data.plotId,
            plotName: data.plotName,
            producerName: data.producerName
          });
          
          // Naviguer vers le détail de la parcelle
          if (onPlotSelected) {
            onPlotSelected(data.plotId);
          }
        }
    } catch (error) {
      console.error('❌ [MapComponent] Erreur parsing message WebView:', error);
    }
  };

  if (errorMsg) {
    return (
      <Box 
        flex={1} 
        justifyContent="center" 
        alignItems="center" 
        p={5}
        bg="gray.50"
      >
        <VStack space={3} alignItems="center">
          <Text fontSize="lg" color="error.500" textAlign="center" fontWeight="medium">
            Erreur de localisation
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center">
            {errorMsg}
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      <Box 
        p={4} 
        bg="white" 
        borderBottomWidth={1} 
        borderBottomColor="gray.200"
      >
        <VStack space={1}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Carte des Parcelles
          </Text>
          <Text fontSize="sm" color="gray.600">
            {coordinates.length} parcelle{coordinates.length > 1 ? 's' : ''} affichée{coordinates.length > 1 ? 's' : ''}
          </Text>
        </VStack>
      </Box>
      
      <WebView
        source={{ html: mapHtml }}
        style={{ 
          flex: 1,
          height: '100%',
          width: '100%',
          minHeight: 400
        }}
        onMessage={handleMessage}
        onLoadStart={() => console.log('🗺️ [MapComponent] WebView commence à charger')}
        onLoadEnd={() => console.log('🗺️ [MapComponent] WebView chargé avec succès')}
        onError={(error) => console.error('❌ [MapComponent] Erreur WebView:', error)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </Box>
  );
};

export default MapComponent;
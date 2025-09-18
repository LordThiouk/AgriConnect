import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface PlotData {
  id: string;
  name: string;
  producerName: string;
  hasGps: boolean;
  lat?: number;
  lon?: number;
}

interface SimpleMapComponentProps {
  plots: PlotData[];
  onMarkerPress: (plotId: string) => void;
}

const SimpleMapComponent: React.FC<SimpleMapComponentProps> = ({ plots, onMarkerPress }) => {
  const plotsWithGps = plots.filter(p => p.hasGps && p.lat && p.lon);
  const plotsWithoutGps = plots.filter(p => !p.hasGps || !p.lat || !p.lon);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Carte des Parcelles</Text>
        <Text style={styles.subtitle}>
          {plotsWithGps.length} parcelles avec GPS • {plotsWithoutGps.length} sans localisation
        </Text>
      </View>

      <ScrollView style={styles.mapContainer} showsVerticalScrollIndicator={false}>
        {/* Parcelles avec GPS */}
        {plotsWithGps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Parcelles Localisées</Text>
            {plotsWithGps.map((plot) => (
              <TouchableOpacity
                key={plot.id}
                style={styles.plotCard}
                onPress={() => onMarkerPress(plot.id)}
              >
                <View style={styles.plotHeader}>
                  <Text style={styles.plotName}>{plot.name}</Text>
                  <View style={styles.gpsBadge}>
                    <Text style={styles.gpsText}>GPS</Text>
                  </View>
                </View>
                <Text style={styles.producerName}>{plot.producerName}</Text>
                <Text style={styles.coordinates}>
                  📍 {plot.lat?.toFixed(4)}, {plot.lon?.toFixed(4)}
                </Text>
                <View style={styles.mapPreview}>
                  <Text style={styles.mapPreviewText}>
                    Région: Dakar • Zone: {plot.lat && plot.lat > 14.7 ? 'Nord' : 'Sud'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Parcelles sans GPS */}
        {plotsWithoutGps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❓ Parcelles sans Localisation</Text>
            {plotsWithoutGps.map((plot) => (
              <TouchableOpacity
                key={plot.id}
                style={[styles.plotCard, styles.plotCardNoGps]}
                onPress={() => onMarkerPress(plot.id)}
              >
                <View style={styles.plotHeader}>
                  <Text style={styles.plotName}>{plot.name}</Text>
                  <View style={styles.noGpsBadge}>
                    <Text style={styles.noGpsText}>Sans GPS</Text>
                  </View>
                </View>
                <Text style={styles.producerName}>{plot.producerName}</Text>
                <Text style={styles.noGpsMessage}>
                  📍 Localisation non disponible
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Message si aucune parcelle */}
        {plots.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucune parcelle trouvée</Text>
            <Text style={styles.emptySubtitle}>
              Les parcelles apparaîtront ici une fois créées
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  mapContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  plotCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  plotCardNoGps: {
    borderLeftColor: '#f59e0b',
  },
  plotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  gpsBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gpsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  noGpsBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noGpsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  producerName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  mapPreview: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 6,
  },
  mapPreviewText: {
    fontSize: 12,
    color: '#475569',
  },
  noGpsMessage: {
    fontSize: 12,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default SimpleMapComponent;

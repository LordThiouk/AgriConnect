import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MapScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* En-tête de la carte */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carte & Localisation</Text>
        <Text style={styles.headerSubtitle}>
          Géolocalisation des parcelles et coopératives
        </Text>
      </View>

      {/* Placeholder de la carte */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={80} color="#d1d5db" />
        <Text style={styles.mapPlaceholderTitle}>Carte en cours de développement</Text>
        <Text style={styles.mapPlaceholderText}>
          Cette fonctionnalité sera bientôt disponible pour visualiser vos parcelles et la localisation des coopératives.
        </Text>
      </View>

      {/* Actions rapides */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="location" size={24} color="#ffffff" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Ma Position</Text>
            <Text style={styles.actionDescription}>Voir ma localisation actuelle</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="search" size={24} color="#ffffff" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Rechercher Parcelle</Text>
            <Text style={styles.actionDescription}>Trouver une parcelle par nom ou coordonnées</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="business" size={24} color="#ffffff" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Coopératives Proches</Text>
            <Text style={styles.actionDescription}>Voir les coopératives dans votre région</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="layers" size={24} color="#ffffff" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Couches de Carte</Text>
            <Text style={styles.actionDescription}>Gérer l&apos;affichage des éléments</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Informations techniques */}
      <View style={styles.techInfo}>
        <Text style={styles.techInfoTitle}>Informations Techniques</Text>
        <View style={styles.techInfoItem}>
          <Text style={styles.techInfoLabel}>GPS:</Text>
          <Text style={styles.techInfoValue}>Activé</Text>
        </View>
        <View style={styles.techInfoItem}>
          <Text style={styles.techInfoLabel}>Précision:</Text>
          <Text style={styles.techInfoValue}>5 mètres</Text>
        </View>
        <View style={styles.techInfoItem}>
          <Text style={styles.techInfoLabel}>Dernière mise à jour:</Text>
          <Text style={styles.techInfoValue}>À l&apos;instant</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#10b981',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  techInfo: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  techInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  techInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  techInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  techInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});

export default MapScreen;

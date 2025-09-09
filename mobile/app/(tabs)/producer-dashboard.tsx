/**
 * Tableau de bord Producteur - AgriConnect
 * Interface principale pour les producteurs
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProducerDashboard() {
  const { user, userRole, phone } = useAuth();

  const myPlots = [
    { name: 'Parcelle A - Maïs', area: '2.5 ha', status: 'En cours', progress: 75 },
    { name: 'Parcelle B - Arachide', area: '1.8 ha', status: 'Récolté', progress: 100 },
    { name: 'Parcelle C - Mil', area: '3.2 ha', status: 'Préparation', progress: 20 },
  ];

  const recommendations = [
    { type: 'Fertilisation', message: 'Appliquer NPK sur parcelle A', priority: 'high' },
    { type: 'Traitement', message: 'Surveiller les ravageurs', priority: 'medium' },
    { type: 'Irrigation', message: 'Arrosage recommandé demain', priority: 'low' },
  ];

  return (
    <LinearGradient
      colors={['#3D944B', '#2E7D32']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Bonjour Producteur</Text>
            <Text style={styles.phoneText}>{phone}</Text>
            <Text style={styles.roleText}>Rôle: {userRole}</Text>
          </View>
          <Ionicons name="leaf" size={60} color="white" />
        </View>

        {/* Mes parcelles */}
        <View style={styles.plotsContainer}>
          <Text style={styles.sectionTitle}>Mes parcelles</Text>
          {myPlots.map((plot, index) => (
            <View key={index} style={styles.plotCard}>
              <View style={styles.plotHeader}>
                <Text style={styles.plotName}>{plot.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(plot.status) }]}>
                  <Text style={styles.statusText}>{plot.status}</Text>
                </View>
              </View>
              <Text style={styles.plotArea}>Superficie: {plot.area}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${plot.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{plot.progress}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recommandations */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Recommandations</Text>
          {recommendations.map((rec, index) => (
            <View key={index} style={[styles.recommendationCard, { borderLeftColor: getPriorityColor(rec.priority) }]}>
              <Ionicons name="bulb" size={20} color={getPriorityColor(rec.priority)} />
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationType}>{rec.type}</Text>
                <Text style={styles.recommendationMessage}>{rec.message}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="camera" size={32} color="#3D944B" />
              <Text style={styles.actionTitle}>Prendre une photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="add-circle" size={32} color="#3D944B" />
              <Text style={styles.actionTitle}>Ajouter observation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="call" size={32} color="#3D944B" />
              <Text style={styles.actionTitle}>Contacter agent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="information-circle" size={32} color="#3D944B" />
              <Text style={styles.actionTitle}>Aide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// Fonctions utilitaires
const getStatusColor = (status: string) => {
  switch (status) {
    case 'En cours': return '#3D944B';
    case 'Récolté': return '#4CAF50';
    case 'Préparation': return '#FF9800';
    default: return '#9E9E9E';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#F44336';
    case 'medium': return '#FF9800';
    case 'low': return '#4CAF50';
    default: return '#9E9E9E';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  phoneText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  roleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  plotsContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  plotCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  plotArea: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3D944B',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  recommendationsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recommendationMessage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
});

/**
 * Tableau de bord Agent - AgriConnect
 * Interface principale pour les agents de terrain
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function AgentDashboard() {
  const { user, userRole, phone } = useAuth();

  const stats = [
    { title: 'Producteurs suivis', value: '24', icon: 'people', color: '#3D944B' },
    { title: 'Parcelles visitées', value: '156', icon: 'map', color: '#FFD65A' },
    { title: 'Observations', value: '89', icon: 'eye', color: '#FF6B6B' },
    { title: 'Alertes actives', value: '3', icon: 'warning', color: '#FF8C00' },
  ];

  const quickActions = [
    { title: 'Ajouter Producteur', icon: 'person-add', route: '/collecte/add-producer' },
    { title: 'Ajouter Parcelle', icon: 'add-circle', route: '/collecte/add-plot' },
    { title: 'Nouvelle Observation', icon: 'camera', route: '/collecte/add-observation' },
    { title: 'Carte GPS', icon: 'map', route: '/map' },
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
            <Text style={styles.welcomeText}>Bonjour Agent</Text>
            <Text style={styles.phoneText}>{phone}</Text>
            <Text style={styles.roleText}>Rôle: {userRole}</Text>
          </View>
          <Ionicons name="person-circle" size={60} color="white" />
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionCard}>
                <Ionicons name={action.icon as any} size={32} color="#3D944B" />
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alertes récentes */}
        <View style={styles.alertsContainer}>
          <Text style={styles.sectionTitle}>Alertes récentes</Text>
          <View style={styles.alertCard}>
            <Ionicons name="warning" size={20} color="#FF8C00" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Fertilisation manquante</Text>
              <Text style={styles.alertDescription}>Parcelle Moussa Diop - Maïs</Text>
            </View>
          </View>
          <View style={styles.alertCard}>
            <Ionicons name="information-circle" size={20} color="#3D944B" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Visite programmée</Text>
              <Text style={styles.alertDescription}>Demain 14h - Zone Thiès</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

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
  statsContainer: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
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
  alertsContainer: {
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  alertDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

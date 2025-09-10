/**
 * Tableau de bord Agent - AgriConnect
 * Interface principale pour les agents de terrain
 */

import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAgentDashboard } from '../../hooks/useAgentDashboard';
// import { LinearGradient } from 'expo-linear-gradient';

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  
  // Utiliser le hook pour récupérer les vraies données (avec ID de test par défaut)
  const { stats, visits, alerts, loading, error, refresh } = useAgentDashboard(user?.id || 'test-agent-123');

  const today = new Date().toLocaleDateString();
  const agentName = user?.user_metadata?.display_name || 'Agent terrain';
  const agentFirstName = (agentName || '').split(' ')[0] || agentName;
  // Titre d'entête natif riche (Bonjour + date) et actions à droite
  const HeaderTitle = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="person-circle" size={24} color="#3D944B" />
      <View style={{ marginLeft: 8 }}>
        <Text style={{ color: '#111827', fontWeight: '700' }}>{`Bonjour, ${agentFirstName}`}</Text>
        <Text style={{ color: '#6b7280', fontSize: 12 }}>{today}</Text>
      </View>
    </View>
  );

  const HeaderRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <View style={styles.onlinePill}>
        <View style={styles.dotGreen} />
        <Text style={styles.onlineText}>En ligne</Text>
      </View>
      <Ionicons name="notifications-outline" size={20} color="#111827" style={{ marginLeft: 8 }} />
    </View>
  );

  useLayoutEffect(() => {
    navigation.setOptions?.({
      headerTitle: () => <HeaderTitle />,
      headerRight: () => <HeaderRight />,
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerTitleStyle: { color: '#111827' },
      headerTintColor: '#111827',
      headerTitleAlign: 'left',
    } as any);
  }, [navigation, agentFirstName, today, HeaderTitle, HeaderRight]);

  // KPI basés sur les vraies données
  const kpiStats = [
    { 
      title: 'Producteurs suivis', 
      value: stats?.producersCount?.toString() || '0', 
      icon: 'people', 
      color: '#3D944B' 
    },
    { 
      title: 'Parcelles actives', 
      value: stats?.activePlotsCount?.toString() || '0', 
      icon: 'map', 
      color: '#FFD65A' 
    },
  ];

  // Pourcentage de fiches complétées
  const percent = stats?.completedFilesPercent || 0;

  // Gestion des états de chargement et d'erreur
  if (loading && !stats) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3D944B" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#DC2626" />
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={['#3D944B']}
            tintColor="#3D944B"
          />
        }
      >
        {/* En-tête (carte claire) */}
        

        {/* Cartes KPI */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Vue d&apos;ensemble</Text>
          <View style={styles.statsGrid}>
            {kpiStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.kpiIcon, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon as any} size={18} color="#ffffff" />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Barre de progression fiches complétées (styles RN) */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressLabel}>Fiches complétées</Text>
            <Text style={styles.progressValue}>{percent}%</Text>
          </View>
          <View
            style={styles.progressTrack}
            onLayout={(e) => {
              console.log('[DASHBOARD] progressTrack layout:', e.nativeEvent.layout);
            }}
          >
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
        </View>

        {/* Visites du jour */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Visites du jour</Text>
            <Text style={styles.countText}>
              {visits.length} {visits.length === 1 ? 'visite' : 'visites'}
            </Text>
            
          </View>
          {visits.length === 0 ? (
            <Text style={styles.emptyText}>Aucune visite planifiée aujourd&apos;hui</Text>
          ) : (
            visits.map(v => (
              <View key={v.id} style={styles.visitRow}>
                <View style={styles.visitIcon}>
                  <Ionicons name="walk" size={18} color="#3D944B" />
                </View>
                <View style={styles.visitInfo}>
                  <Text style={styles.visitTitle}>{v.producer} - {v.location}</Text>
                  <View style={styles.visitMetaRow}>
                    <Ionicons name="location" size={12} color={v.hasGps ? '#6b7280' : '#cbd5e1'} />
                    <Text style={styles.visitMetaText}>{v.hasGps ? 'GPS disponible' : 'Localisation non disponible'}</Text>
                  </View>
                </View>
                <View style={styles.statusRight}>
                  <View style={[styles.statusBadge, v.status === 'terminé' ? styles.statusDone : v.status === 'en cours' ? styles.statusInProgress : styles.statusTodo]}>
                    <Text style={styles.statusText}>{v.status === 'terminé' ? 'Fait' : v.status}</Text>
                  </View>
                  {v.status === 'terminé' && (
                    <Ionicons name="checkmark-circle" size={18} color="#22c55e" style={{ marginLeft: 8 }} />
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Alertes terrain */}
        <View style={styles.alertsContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Alertes</Text>
            <View style={styles.critPill}>
              <Text style={styles.critPillText}>
                {alerts.length} {alerts.length === 1 ? 'critique' : 'critiques'}
              </Text>
            </View>
          </View>
          {alerts.length === 0 ? (
            <Text style={styles.emptyText}>Aucune alerte pour le moment</Text>
          ) : (
            alerts.map(a => (
              <View key={a.id} style={[styles.alertCard, a.severity === 'high' ? styles.alertLeftRed : styles.alertLeftYellow]}>
                <View style={[styles.alertBadge, a.severity === 'high' ? styles.badgeRed : styles.badgeOrange]} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{a.title}</Text>
                  <Text style={styles.alertDescription}>{a.description}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <Ionicons name={a.severity === 'high' ? 'warning' : 'alert-circle'} size={18} color={a.severity === 'high' ? '#DC2626' : '#F59E0B'} />
              </View>
            ))
          )}
        </View>

        {/* Actions de fin de page */}
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.primaryTile} onPress={() => router.push('/(tabs)/collecte')}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
            <Text style={styles.primaryTileText}>Nouvelle visite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryTile} onPress={() => router.push('/(tabs)/map')}>
            <Ionicons name="map" size={28} color="#111827" />
            <Text style={styles.secondaryTileText}>Carte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#3D944B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 16, borderRadius: 12, padding: 16, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTextBox: { marginLeft: 10 },
  helloText: { fontSize: 16, color: '#111827' },
  subRole: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  onlinePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 },
  onlineText: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  headerMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metaText: { fontSize: 12, color: '#6b7280' },
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: {
    fontSize: 22,
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
  progressCard: { backgroundColor: 'white', marginHorizontal: 20, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, alignSelf: 'stretch' },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 14, color: '#374151', fontWeight: '600' },
  progressValue: { fontSize: 14, color: '#059669', fontWeight: '700' },
  progressTrack: { height: 8, width: '100%', borderRadius: 999, backgroundColor: '#D1D5DB', overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 999 },
  cardContainer: { backgroundColor: 'white', marginHorizontal: 20, marginBottom: 20, borderRadius: 12, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 },
  countText: { color: '#6b7280', fontSize: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3D944B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  emptyText: { color: '#6b7280', fontSize: 14 },
  visitRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  visitIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  visitInfo: { flex: 1 },
  visitTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  visitMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  visitMetaText: { fontSize: 12, color: '#6b7280' },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  statusDone: { backgroundColor: '#DCFCE7' },
  statusInProgress: { backgroundColor: '#FEF3C7' },
  statusTodo: { backgroundColor: '#E5E7EB' },
  alertsContainer: { backgroundColor: 'white', marginHorizontal: 20, marginBottom: 20, borderRadius: 12, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  critPill: { backgroundColor: '#FEE2E2', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  critPillText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9', position: 'relative', overflow: 'hidden' },
  alertLeftRed: { borderLeftWidth: 3, borderLeftColor: '#EF4444' },
  alertLeftYellow: { borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  alertBadge: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  badgeRed: { backgroundColor: '#EF4444' },
  badgeOrange: { backgroundColor: '#F59E0B' },
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
  alertTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  footerActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingBottom: 24 },
  primaryTile: { flex: 1, backgroundColor: '#3D944B', borderRadius: 14, height: 88, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  primaryTileText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryTile: { flex: 1, backgroundColor: '#FFD65A', borderRadius: 14, height: 88, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  secondaryTileText: { color: '#111827', fontWeight: '700' },
});

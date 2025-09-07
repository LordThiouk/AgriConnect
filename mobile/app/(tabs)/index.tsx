import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const DashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const userRole = user?.user_metadata?.role;

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: signOut, style: 'destructive' },
      ]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'agent': return 'Agent de Terrain';
      case 'producer': return 'Producteur';
      case 'admin': return 'Administrateur';
      case 'supervisor': return 'Superviseur';
      default: return 'Utilisateur';
    }
  };

  const getQuickActions = () => {
    if (userRole === 'agent' || userRole === 'admin') {
      return [
        { title: 'Ajouter Producteur', icon: 'person-add', color: '#3b82f6' },
        { title: 'Ajouter Parcelle', icon: 'map', color: '#10b981' },
        { title: 'Nouvelle Observation', icon: 'eye', color: '#f59e0b' },
        { title: 'Synchroniser', icon: 'sync', color: '#8b5cf6' },
      ];
    } else if (userRole === 'producer') {
      return [
        { title: 'Mes Parcelles', icon: 'leaf', color: '#10b981' },
        { title: 'Mes Cultures', icon: 'flower', color: '#f59e0b' },
        { title: 'Conseils', icon: 'bulb', color: '#3b82f6' },
        { title: 'Alertes', icon: 'warning', color: '#ef4444' },
      ];
    }
    return [];
  };

  const quickActions = getQuickActions();

  return (
    <ScrollView style={styles.container}>
      {/* En-tête avec informations utilisateur */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#ffffff" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name || user?.email || 'Utilisateur'}
            </Text>
            <Text style={styles.userRole}>
              {getRoleDisplayName(userRole || '')}
            </Text>
            <Text style={styles.userCoop}>
              {user?.user_metadata?.cooperative_name || 'Coopérative non assignée'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Aperçu</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#3b82f6" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Producteurs</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="map" size={24} color="#10b981" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Parcelles</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Alertes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#8b5cf6" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Complétées</Text>
          </View>
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Informations de session */}
      <View style={styles.sessionContainer}>
        <Text style={styles.sectionTitle}>Informations de Session</Text>
        <View style={styles.sessionInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statut:</Text>
            <Text style={styles.infoValue}>Connecté</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plateforme:</Text>
            <Text style={styles.infoValue}>Mobile</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dernière sync:</Text>
            <Text style={styles.infoValue}>À l'instant</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
  },
  userCoop: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signOutButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  sessionContainer: {
    padding: 20,
    marginBottom: 20,
  },
  sessionInfo: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});

export default DashboardScreen;

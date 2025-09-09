import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CollecteScreen: React.FC = () => {
  const router = useRouter();
  const handleAction = (action: string) => {
    switch (action) {
      case 'Ajouter Fiche':
        router.push('/(tabs)/collecte/fiches/create');
        return;
      case 'Lister Fiches':
        router.push('/(tabs)/collecte/fiches');
        return;
      default:
        Alert.alert(
          'Fonctionnalité',
          `${action} sera bientôt disponible.`,
          [{ text: 'OK', style: 'default' }]
        );
    }
  };

  const collectionActions = [
    {
      title: 'Créer Fiche Exploitation',
      description: 'Point d’entrée — 1a/1b/1c',
      icon: 'document-text',
      color: '#0ea5e9',
      action: 'Ajouter Fiche'
    },
    {
      title: 'Mes Fiches',
      description: 'Voir et continuer les fiches',
      icon: 'documents',
      color: '#22c55e',
      action: 'Lister Fiches'
    },
    {
      title: 'Ajouter Producteur',
      description: 'Créer un nouveau producteur agricole',
      icon: 'person-add',
      color: '#3b82f6',
      action: 'Ajouter Producteur'
    },
    {
      title: 'Ajouter Parcelle',
      description: 'Enregistrer une nouvelle parcelle',
      icon: 'map',
      color: '#10b981',
      action: 'Ajouter Parcelle'
    },
    {
      title: 'Nouvelle Culture',
      description: 'Ajouter une culture à une parcelle',
      icon: 'leaf',
      color: '#f59e0b',
      action: 'Nouvelle Culture'
    },
    {
      title: 'Opération Agricole',
      description: 'Enregistrer semis, fertilisation, etc.',
      icon: 'construct',
      color: '#8b5cf6',
      action: 'Opération Agricole'
    },
    {
      title: 'Observation Terrain',
      description: 'Saisir levée, maladies, ravageurs',
      icon: 'eye',
      color: '#ef4444',
      action: 'Observation Terrain'
    },
    {
      title: 'Photo Parcelle',
      description: 'Prendre une photo de la parcelle',
      icon: 'camera',
      color: '#06b6d4',
      action: 'Photo Parcelle'
    }
  ];

  const quickStats = [
    { label: 'Producteurs', value: '0', icon: 'people', color: '#3b82f6' },
    { label: 'Parcelles', value: '0', icon: 'map', color: '#10b981' },
    { label: 'Cultures', value: '0', icon: 'leaf', color: '#f59e0b' },
    { label: 'Opérations', value: '0', icon: 'construct', color: '#8b5cf6' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collecte Terrain</Text>
        <Text style={styles.headerSubtitle}>
          Collectez les données agricoles sur le terrain
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Aperçu de la Collecte</Text>
        <View style={styles.statsGrid}>
          {quickStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon as any} size={20} color="#ffffff" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions de Collecte</Text>
        <View style={styles.actionsGrid}>
          {collectionActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => handleAction(action.action)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={24} color="#ffffff" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.syncContainer}>
        <Text style={styles.sectionTitle}>Synchronisation</Text>
        <View style={styles.syncStatus}>
          <View style={styles.syncItem}>
            <View style={styles.syncIcon}>
              <Ionicons name="wifi" size={20} color="#10b981" />
            </View>
            <View style={styles.syncInfo}>
              <Text style={styles.syncLabel}>Connexion</Text>
              <Text style={styles.syncValue}>Connecté</Text>
            </View>
          </View>
          <View style={styles.syncItem}>
            <View style={styles.syncIcon}>
              <Ionicons name="cloud-upload" size={20} color="#10b981" />
            </View>
            <View style={styles.syncInfo}>
              <Text style={styles.syncLabel}>Dernière sync</Text>
              <Text style={styles.syncValue}>À l'instant</Text>
            </View>
          </View>
          <View style={styles.syncItem}>
            <View style={styles.syncIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
            <View style={styles.syncInfo}>
              <Text style={styles.syncLabel}>Données en attente</Text>
              <Text style={styles.syncValue}>0</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.syncButton}>
          <Ionicons name="sync" size={20} color="#ffffff" />
          <Text style={styles.syncButtonText}>Synchroniser Maintenant</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.sectionTitle}>Conseils de Collecte</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.tipText}>
              Assurez-vous d'avoir une connexion GPS stable avant de commencer
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.tipText}>
              Prenez des photos claires des parcelles pour faciliter l'analyse
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.tipText}>
              Synchronisez régulièrement vos données pour éviter la perte d'informations
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#10b981', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' },
  statsContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, alignItems: 'center', width: '48%', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  actionsContainer: { padding: 20 },
  actionsGrid: { gap: 15 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  actionIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  actionDescription: { fontSize: 14, color: '#6b7280' },
  syncContainer: { padding: 20 },
  syncStatus: { backgroundColor: '#ffffff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  syncItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  syncIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  syncInfo: { flex: 1 },
  syncLabel: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  syncValue: { fontSize: 16, fontWeight: '500', color: '#111827' },
  syncButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  syncButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginLeft: 10 },
  tipsContainer: { padding: 20, marginBottom: 20 },
  tipsList: { backgroundColor: '#ffffff', borderRadius: 12, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tipText: { flex: 1, fontSize: 14, color: '#6b7280', marginLeft: 15, lineHeight: 20 },
});

export default CollecteScreen;


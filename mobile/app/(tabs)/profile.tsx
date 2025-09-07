import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen: React.FC = () => {
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

  const profileSections = [
    {
      title: 'Informations Personnelles',
      items: [
        { label: 'Nom complet', value: user?.user_metadata?.full_name || 'Non défini', icon: 'person' },
        { label: 'Email', value: user?.email || 'Non défini', icon: 'mail' },
        { label: 'Téléphone', value: user?.phone || 'Non défini', icon: 'call' },
        { label: 'Rôle', value: getRoleDisplayName(userRole || ''), icon: 'shield' },
        { label: 'Coopérative', value: user?.user_metadata?.cooperative_name || 'Non assignée', icon: 'business' },
      ]
    },
    {
      title: 'Préférences',
      items: [
        { label: 'Notifications Push', value: 'Activées', icon: 'notifications', toggle: true },
        { label: 'Synchronisation Auto', value: 'Activée', icon: 'sync', toggle: true },
        { label: 'Mode Sombre', value: 'Désactivé', icon: 'moon', toggle: true },
      ]
    },
    {
      title: 'Sécurité',
      items: [
        { label: 'Changer Mot de Passe', value: 'Modifier', icon: 'lock-closed', action: 'changePassword' },
        { label: 'Authentification 2FA', value: 'Non activée', icon: 'key', action: 'enable2FA' },
        { label: 'Sessions Actives', value: '1 session', icon: 'desktop', action: 'sessions' },
      ]
    }
  ];

  const handleAction = (action: string) => {
    switch (action) {
      case 'changePassword':
        Alert.alert('Changer Mot de Passe', 'Fonctionnalité à implémenter');
        break;
      case 'enable2FA':
        Alert.alert('2FA', 'Fonctionnalité à implémenter');
        break;
      case 'sessions':
        Alert.alert('Sessions', 'Fonctionnalité à implémenter');
        break;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* En-tête du profil */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color="#ffffff" />
          </View>
          <Text style={styles.userName}>
            {user?.user_metadata?.full_name || user?.email || 'Utilisateur'}
          </Text>
          <Text style={styles.userRole}>
            {getRoleDisplayName(userRole || '')}
          </Text>
        </View>
      </View>

      {/* Sections du profil */}
      {profileSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.profileItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.itemIcon}>
                    <Ionicons name={item.icon as any} size={20} color="#6b7280" />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {!item.toggle && (
                      <Text style={styles.itemValue}>{item.value}</Text>
                    )}
                  </View>
                </View>
                
                {item.toggle ? (
                  <Switch
                    value={item.value === 'Activées' || item.value === 'Activée'}
                    onValueChange={() => {}}
                    trackColor={{ false: '#d1d5db', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                ) : item.action ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAction(item.action!)}
                  >
                    <Text style={styles.actionButtonText}>{item.value}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.itemValue}>{item.value}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Bouton de déconnexion */}
      <View style={styles.signOutSection}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.signOutButtonText}>Se Déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* Informations de l'application */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>AgriConnect v1.0.0</Text>
        <Text style={styles.appInfoText}>© 2025 AgriConnect</Text>
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
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#10b981',
    marginRight: 5,
  },
  signOutSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 10,
  },
  appInfo: {
    marginTop: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 5,
  },
});

export default ProfileScreen;

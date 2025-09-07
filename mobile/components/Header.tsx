/**
 * Composant d'en-tête mobile - AgriConnect
 * Affiche les informations utilisateur et le bouton de déconnexion
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const Header: React.FC = () => {
  const { user, getUserRole, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const getUserDisplayName = () => {
    if (!user) return 'Utilisateur';
    
    const fullName = user.user_metadata?.full_name;
    if (fullName) return fullName;
    
    const phone = user.phone;
    if (phone) return phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    
    return 'Utilisateur';
  };

  const getRoleDisplayName = () => {
    const role = getUserRole();
    switch (role) {
      case 'agent':
        return 'Agent de terrain';
      case 'producer':
        return 'Producteur';
      default:
        return 'Utilisateur';
    }
  };

  const getRoleIcon = () => {
    const role = getUserRole();
    switch (role) {
      case 'agent':
        return 'person';
      case 'producer':
        return 'leaf';
      default:
        return 'person';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Informations utilisateur */}
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name={getRoleIcon()} size={24} color="#3D944B" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{getUserDisplayName()}</Text>
          <Text style={styles.userRole}>{getRoleDisplayName()}</Text>
        </View>
      </View>

      {/* Bouton de déconnexion */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 4,
  },
});

export default Header;

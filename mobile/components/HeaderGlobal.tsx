import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface HeaderGlobalProps {
  title?: string;
  showBackButton?: boolean;
  showProfileButton?: boolean;
  showNotifications?: boolean;
  onBackPress?: () => void;
}

const HeaderGlobal: React.FC<HeaderGlobalProps> = ({
  title = 'AgriConnect',
  showBackButton = false,
  showProfileButton = true,
  showNotifications = true,
  onBackPress,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole } = useAuth();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleNotificationsPress = () => {
    // TODO: Implémenter la navigation vers les notifications
    console.log('Notifications pressed');
  };

  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case 'agent':
        return 'Agent';
      case 'producer':
        return 'Producteur';
      case 'admin':
        return 'Administrateur';
      case 'supervisor':
        return 'Superviseur';
      default:
        return 'Utilisateur';
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'agent':
        return 'person';
      case 'producer':
        return 'leaf';
      case 'admin':
        return 'shield';
      case 'supervisor':
        return 'eye';
      default:
        return 'person';
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#3D944B" />
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
          
          <View style={styles.titleSection}>
            <Text style={styles.title}>{title}</Text>
            {userRole && (
              <View style={styles.roleContainer}>
                <Ionicons 
                  name={getRoleIcon(userRole) as any} 
                  size={12} 
                  color="#E8F5E8" 
                />
                <Text style={styles.roleText}>
                  {getRoleDisplayName(userRole)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          {showNotifications && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleNotificationsPress}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications" size={22} color="#ffffff" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          )}

          {showProfileButton && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleProfilePress}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3D944B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 44, // Pour éviter le notch
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 12,
    color: '#E8F5E8',
    marginLeft: 4,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
    padding: 4,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HeaderGlobal;

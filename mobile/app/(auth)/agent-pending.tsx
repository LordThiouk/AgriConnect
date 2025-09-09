import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, BackHandler, Linking, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AgentPendingScreen() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAuth();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAuth]);

  const handleSupport = () => {
    Linking.openURL('tel:+2210951543');
  };

  const handleExit = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      router.back();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.logo}>AgriConnect</Text>
      </View>

      <View style={styles.illustration} />

      <Text style={styles.title}>Compte en attente</Text>
      <Text style={styles.subtitle}>
        Votre compte Agent a été créé. Il doit être validé par un administrateur avant activation.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Vous recevrez une notification par SMS dès que votre compte sera activé.</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSupport}>
        <Text style={styles.primaryText}>Contacter le support</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleExit}>
        <Text style={styles.secondaryText}>Fermer l&apos;application</Text>
      </TouchableOpacity>

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>Temps moyen de validation : 24–48h</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  content: { padding: 24, alignItems: 'center' },
  header: { width: '100%', paddingVertical: 16, alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '700', color: '#3D944B' },
  illustration: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFD65A', marginVertical: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#1F2937', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginTop: 8 },
  infoCard: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 20, borderLeftWidth: 4, borderLeftColor: '#3D944B' },
  infoText: { color: '#334155' },
  primaryButton: { width: '100%', backgroundColor: '#3D944B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { width: '100%', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  secondaryText: { color: '#111827', fontWeight: '600' },
  footerNote: { marginTop: 28, backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  footerText: { color: '#374151' },
});



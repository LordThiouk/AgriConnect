import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FarmFilesServiceInstance } from '../../../lib/services/domain/farmfiles';
import { useAuth } from '../../../context/AuthContext';
import { ScreenContainer } from '../../../components/ui';

export default function SelectFicheScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = React.useState<{ id: string; name: string; producerName: string }[]>([]);

  React.useEffect(() => {
    const load = async () => {
      if (!user) return;
      const files = await FarmFilesServiceInstance.getFarmFiles(user.id);
      setItems(files.map(f => ({ id: f.id, name: f.name, producerName: f.producerName })));
    };
    load();
  }, [user]);

  return (
    <ScreenContainer title="Sélection Fiche">
      <View style={styles.header}><Text style={styles.title}>Sélectionner une fiche</Text></View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/(tabs)/parcelles/fiches/${item.id}/parcelles/add`)}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.producerName}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardSubtitle: { marginTop: 6, fontSize: 12, color: '#6b7280' }
});

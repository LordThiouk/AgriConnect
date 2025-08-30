import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/(auth)/login');
      }
    });
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Dashboard</Text>
    </View>
  );
}

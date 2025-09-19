import { Stack } from 'expo-router';

export default function CollecteStackLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false, // Désactiver tous les headers pour utiliser le header global
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="fiches/index" />
      <Stack.Screen name="fiches/create" />
      <Stack.Screen name="fiches/[id]" />
      <Stack.Screen name="fiches/[id]/parcelles/index" />
      <Stack.Screen name="fiches/[id]/parcelles/add" />
      <Stack.Screen name="../parcelles/[plotId]" />
    </Stack>
  );
}



import { Stack } from 'expo-router';

export default function CollecteStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="fiches/index" />
      <Stack.Screen name="fiches/create" />
      <Stack.Screen name="fiches/[id]" />
      <Stack.Screen name="fiches/[id]/parcelles/index" />
      <Stack.Screen name="fiches/[id]/parcelles/add" />
      <Stack.Screen name="../parcelles/[plotId]/dashboard" />
    </Stack>
  );
}



import { Stack } from 'expo-router';

export default function PlotLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="intervenants" />
      <Stack.Screen name="conseils/add" />
      <Stack.Screen name="observations" />
      <Stack.Screen name="intrants" />
      <Stack.Screen name="operations" />
      <Stack.Screen name="cultures" />
    </Stack>
  );
}

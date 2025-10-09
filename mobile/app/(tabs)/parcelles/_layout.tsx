import { Stack } from 'expo-router';

export default function ParcellesLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      detachInactiveScreens: true,
      freezeOnBlur: true,
      unmountOnBlur: true,
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="select-fiche" />
      <Stack.Screen name="[plotId]" />
    </Stack>
  );
}

import { Stack } from 'expo-router';

export default function IntrantsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, detachInactiveScreens: true, unmountOnBlur: true, freezeOnBlur: true }}>
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

import { Stack } from 'expo-router';

export default function OperationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add" />
    </Stack>
  );
}

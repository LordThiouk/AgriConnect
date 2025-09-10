import { Stack } from 'expo-router';

export default function CollecteStackLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: {
        backgroundColor: '#FFFFFF',
      },
      headerTintColor: '#111827',
      headerTitleStyle: {
        color: '#111827',
      },
      headerTitleAlign: 'left',
    }}>
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen name="fiches/index" />
      <Stack.Screen name="fiches/create" />
      <Stack.Screen name="fiches/[id]" />
      <Stack.Screen name="fiches/[id]/parcelles/index" />
      <Stack.Screen name="fiches/[id]/parcelles/add" />
      <Stack.Screen name="../parcelles/[plotId]/dashboard" />
    </Stack>
  );
}



import { Link, Stack } from 'expo-router';
import { Text, Box, VStack } from 'native-base';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Box flex={1} alignItems="center" justifyContent="center" p={5}>
        <VStack space={4} alignItems="center">
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            Cette page n&apos;existe pas.
          </Text>
          <Link href="/" style={{ marginTop: 15, paddingVertical: 15 }}>
            <Text fontSize="lg" color="primary.500" fontWeight="medium">
              Retour à l&apos;accueil
            </Text>
          </Link>
        </VStack>
      </Box>
    </>
  );
}
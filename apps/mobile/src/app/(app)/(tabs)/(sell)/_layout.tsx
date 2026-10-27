import { Stack } from 'expo-router';

export default function SellLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Sell' }} />
    </Stack>
  );
}

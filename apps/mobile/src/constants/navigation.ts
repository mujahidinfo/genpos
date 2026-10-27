import type { ComponentProps } from 'react';
import type { Stack } from 'expo-router';

/** Shared header style for each tab's stack. */
export const tabStackOptions: ComponentProps<typeof Stack>['screenOptions'] = {
  headerLargeTitle: true,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
};

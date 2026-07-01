import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { HabitsProvider } from './src/context/HabitsContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <HabitsProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </HabitsProvider>
    </SafeAreaProvider>
  );
}

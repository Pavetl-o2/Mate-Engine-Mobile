/**
 * Mate Engine Mobile - Main entry
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import AvatarSelectionScreen from './src/screens/AvatarSelectionScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { clawdbotService } from './src/services/ClawdbotService';

const Stack = createNativeStackNavigator();

const BG = '#0f1923';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    clawdbotService.configure({ sessionId: 'mobile-main' });
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <Stack.Navigator
          initialRouteName="AvatarSelection"
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BG } }}
        >
          <Stack.Screen name="AvatarSelection">
            {(props) => (
              <AvatarSelectionScreen
                {...props}
                selectedAvatar={selectedAvatar}
                setSelectedAvatar={setSelectedAvatar}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Chat" options={{ animation: 'fade' }}>
            {(props) => (
              <ChatScreen {...props} selectedAvatar={selectedAvatar} />
            )}
          </Stack.Screen>

          <Stack.Screen name="Settings" options={{ animation: 'slide_from_right' }}>
            {(props) => <SettingsScreen {...props} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
});

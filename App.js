/**
 * Mate Engine Mobile App
 * Main entry point with navigation
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Screens
import AvatarSelectionScreen from './src/screens/AvatarSelectionScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Services
import { clawdbotService } from './src/services/ClawdbotService';

const Stack = createNativeStackNavigator();

// App theme colors
export const theme = {
  background: '#1a1a2e',
  surface: '#16213e',
  primary: '#e94560',
  secondary: '#0f3460',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  success: '#4ade80',
  error: '#f87171'
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    // Initialize app
    const init = async () => {
      // Load saved config (you can use AsyncStorage for persistence)
      clawdbotService.configure({
        serverUrl: 'http://YOUR_EC2_IP:3000', // Will be configured in settings
        sessionId: 'mobile-main'
      });

      setIsLoading(false);
    };

    init();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="AvatarSelection"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.surface
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: 'bold'
          },
          contentStyle: {
            backgroundColor: theme.background
          }
        }}
      >
        <Stack.Screen
          name="AvatarSelection"
          options={{
            title: 'Select Avatar',
            headerRight: () => null
          }}
        >
          {(props) => (
            <AvatarSelectionScreen
              {...props}
              selectedAvatar={selectedAvatar}
              setSelectedAvatar={setSelectedAvatar}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Chat"
          options={{
            title: 'Chat'
          }}
        >
          {(props) => (
            <ChatScreen
              {...props}
              selectedAvatar={selectedAvatar}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background
  }
});

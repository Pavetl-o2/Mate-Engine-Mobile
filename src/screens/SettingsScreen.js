/**
 * Settings Screen
 * Configure Clawdbot server and API keys
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clawdbotService } from '../services/ClawdbotService';

// Theme
const theme = {
  background: '#1a1a2e',
  surface: '#16213e',
  primary: '#e94560',
  secondary: '#0f3460',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  success: '#4ade80',
  error: '#f87171'
};

export default function SettingsScreen({ navigation }) {
  const [serverUrl, setServerUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [deepgramKey, setDeepgramKey] = useState('');
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [elevenLabsVoice, setElevenLabsVoice] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Load current config
  useEffect(() => {
    const config = clawdbotService.getConfig();
    setServerUrl(config.serverUrl || '');
    setSessionId(config.sessionId || 'mobile-main');
    setElevenLabsVoice(config.elevenLabsVoiceId || 'k9294w367tNmQIywtFJI');
  }, []);

  // Test connection
  const testConnection = async () => {
    if (!serverUrl) {
      Alert.alert('Error', 'Please enter server URL');
      return;
    }

    setIsLoading(true);
    setConnectionStatus(null);

    // Temporarily configure to test
    clawdbotService.configure({ serverUrl, authToken });

    const result = await clawdbotService.healthCheck();

    setConnectionStatus(result.ok ? 'connected' : 'failed');
    setIsLoading(false);

    if (result.ok) {
      Alert.alert('Success', `Connected! Clawdbot: ${result.clawdbot}`);
    } else {
      Alert.alert('Failed', result.error || 'Could not connect to server');
    }
  };

  // Save settings
  const saveSettings = () => {
    clawdbotService.configure({
      serverUrl,
      authToken,
      sessionId,
      deepgramApiKey: deepgramKey,
      elevenLabsApiKey: elevenLabsKey,
      elevenLabsVoiceId: elevenLabsVoice
    });

    Alert.alert('Saved', 'Settings saved successfully', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const renderInput = (label, value, setter, placeholder, secure = false, icon) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        {icon && (
          <Ionicons name={icon} size={20} color={theme.textSecondary} style={styles.inputIcon} />
        )}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          value={value}
          onChangeText={setter}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Server Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="server-outline" size={18} /> Server Configuration
        </Text>

        {renderInput(
          'Clawdbot Server URL',
          serverUrl,
          setServerUrl,
          'http://your-ec2-ip:3000',
          false,
          'globe-outline'
        )}

        {renderInput(
          'Auth Token (optional)',
          authToken,
          setAuthToken,
          'Your authentication token',
          true,
          'key-outline'
        )}

        {renderInput(
          'Session ID',
          sessionId,
          setSessionId,
          'mobile-main',
          false,
          'chatbubbles-outline'
        )}

        {/* Test Connection Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={testConnection}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.text} size="small" />
          ) : (
            <>
              <Ionicons
                name={connectionStatus === 'connected' ? 'checkmark-circle' : 'pulse'}
                size={20}
                color={connectionStatus === 'connected' ? theme.success :
                       connectionStatus === 'failed' ? theme.error : theme.text}
              />
              <Text style={styles.testButtonText}>Test Connection</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Voice Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="mic-outline" size={18} /> Voice Configuration
        </Text>

        {renderInput(
          'Deepgram API Key',
          deepgramKey,
          setDeepgramKey,
          'For speech-to-text',
          true,
          'ear-outline'
        )}

        <Text style={styles.hint}>
          Get your key at: deepgram.com
        </Text>

        {renderInput(
          'ElevenLabs API Key',
          elevenLabsKey,
          setElevenLabsKey,
          'For text-to-speech',
          true,
          'volume-high-outline'
        )}

        {renderInput(
          'Voice ID',
          elevenLabsVoice,
          setElevenLabsVoice,
          'k9294w367tNmQIywtFJI (Jinx)',
          false,
          'person-outline'
        )}

        <Text style={styles.hint}>
          Get your key and voice IDs at: elevenlabs.io
        </Text>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
        <Ionicons name="save-outline" size={20} color={theme.text} />
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
        <Text style={styles.infoText}>
          Voice features require both Deepgram (speech-to-text) and ElevenLabs (text-to-speech) API keys.
          Text chat works with just the server URL.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  content: {
    padding: 16
  },
  section: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.secondary,
    borderRadius: 12
  },
  inputIcon: {
    paddingLeft: 12
  },
  input: {
    flex: 1,
    color: theme.text,
    padding: 12,
    fontSize: 15
  },
  inputWithIcon: {
    paddingLeft: 8
  },
  hint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: -8,
    marginBottom: 16
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.secondary,
    padding: 12,
    borderRadius: 12,
    marginTop: 8
  },
  testButtonText: {
    color: theme.text,
    marginLeft: 8,
    fontSize: 14
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  saveButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32
  },
  infoText: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: 13,
    marginLeft: 12,
    lineHeight: 18
  }
});

/**
 * Settings Screen - Clean minimalist config
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { clawdbotService } from '../services/ClawdbotService';

const palette = {
  bg: '#0f1923',
  card: '#172331',
  accent: '#6c63ff',
  white: '#f0f0f5',
  muted: 'rgba(240,240,245,0.45)',
  border: 'rgba(240,240,245,0.06)',
  inputBg: 'rgba(15,25,35,0.6)',
  success: '#4ade80',
  error: '#f87171',
};

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [serverUrl, setServerUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [deepgramKey, setDeepgramKey] = useState('');
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [elevenLabsVoice, setElevenLabsVoice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connStatus, setConnStatus] = useState(null); // null | 'ok' | 'fail'

  useEffect(() => {
    const c = clawdbotService.getConfig();
    setServerUrl(c.serverUrl || '');
    setSessionId(c.sessionId || 'mobile-main');
    setElevenLabsVoice(c.elevenLabsVoiceId || 'k9294w367tNmQIywtFJI');
  }, []);

  const testConnection = async () => {
    if (!serverUrl) { Alert.alert('Error', 'Ingresa la URL del servidor'); return; }
    setIsLoading(true);
    setConnStatus(null);
    clawdbotService.configure({ serverUrl, authToken });
    const r = await clawdbotService.healthCheck();
    setConnStatus(r.ok ? 'ok' : 'fail');
    setIsLoading(false);
    if (r.ok) Alert.alert('Conectado', `Clawdbot: ${r.clawdbot || 'OK'}`);
    else Alert.alert('Fallo', r.error || 'No se pudo conectar');
  };

  const save = () => {
    clawdbotService.configure({
      serverUrl, authToken, sessionId,
      deepgramApiKey: deepgramKey,
      elevenLabsApiKey: elevenLabsKey,
      elevenLabsVoiceId: elevenLabsVoice,
    });
    Alert.alert('Guardado', 'Configuracion guardada', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const Field = ({ label, value, onChangeText, placeholder, secure, icon }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        {icon && <Ionicons name={icon} size={18} color={palette.muted} style={{ marginLeft: 12 }} />}
        <TextInput
          style={[styles.input, icon && { paddingLeft: 8 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(240,240,245,0.2)"
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color={palette.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuracion</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Server */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SERVIDOR</Text>

        <Field label="URL del servidor" value={serverUrl} onChangeText={setServerUrl}
          placeholder="http://tu-ip:3000" icon="globe-outline" />
        <Field label="Token de autenticacion" value={authToken} onChangeText={setAuthToken}
          placeholder="mi-token-secreto-12345" secure icon="key-outline" />
        <Field label="Session ID" value={sessionId} onChangeText={setSessionId}
          placeholder="mobile-main" icon="chatbubble-outline" />

        <TouchableOpacity style={styles.testBtn} onPress={testConnection} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={palette.white} size="small" />
          ) : (
            <>
              <Ionicons
                name={connStatus === 'ok' ? 'checkmark-circle' : connStatus === 'fail' ? 'close-circle' : 'pulse'}
                size={18}
                color={connStatus === 'ok' ? palette.success : connStatus === 'fail' ? palette.error : palette.white}
              />
              <Text style={styles.testBtnText}>Probar conexion</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Voice */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>VOZ</Text>

        <Field label="Deepgram API Key" value={deepgramKey} onChangeText={setDeepgramKey}
          placeholder="Para speech-to-text" secure icon="ear-outline" />
        <Field label="ElevenLabs API Key" value={elevenLabsKey} onChangeText={setElevenLabsKey}
          placeholder="Para text-to-speech" secure icon="volume-high-outline" />
        <Field label="Voice ID" value={elevenLabsVoice} onChangeText={setElevenLabsVoice}
          placeholder="k9294w367tNmQIywtFJI" icon="person-outline" />
      </View>

      {/* Save */}
      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>Guardar</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        El chat de texto funciona solo con la URL del servidor.{'\n'}
        Para voz necesitas las keys de Deepgram y ElevenLabs.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerTitle: {
    color: palette.white,
    fontSize: 17,
    fontWeight: '600',
  },

  section: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.muted,
    letterSpacing: 1.2,
    marginBottom: 14,
  },

  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: 'rgba(240,240,245,0.6)',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  input: {
    flex: 1,
    color: palette.white,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },

  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(108,99,255,0.15)',
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
    gap: 8,
  },
  testBtnText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '500',
  },

  saveBtn: {
    backgroundColor: palette.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveBtnText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '700',
  },

  hint: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

/**
 * Chat Screen - Immersive full-screen design
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Easing
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { writeAsStringAsync, cacheDirectory } from 'expo-file-system/legacy';

import { clawdbotService } from '../services/ClawdbotService';
import Avatar3DRenderer from '../components/Avatar3DRenderer';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const palette = {
  bg: '#0f1923',
  card: 'rgba(15, 25, 35, 0.75)',
  accent: '#6c63ff',
  accentSoft: 'rgba(108, 99, 255, 0.15)',
  white: '#f0f0f5',
  muted: 'rgba(240, 240, 245, 0.5)',
  userBubble: 'rgba(108, 99, 255, 0.85)',
  aiBubble: 'rgba(30, 40, 55, 0.85)',
  inputBg: 'rgba(30, 40, 55, 0.9)',
  overlay: 'rgba(15, 25, 35, 0.6)',
};

export default function ChatScreen({ navigation, selectedAvatar }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isTalking, setIsTalking] = useState(false);
  const [sound, setSound] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [loadingStage, setLoadingStage] = useState(null);

  const flatListRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const messageAnims = useRef({}).current;

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();

    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    
    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => { 
      if (sound) sound.unloadAsync();
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startFadeOut = (messageId) => {
    messageAnims[messageId] = new Animated.Value(1);
    setTimeout(() => {
      Animated.timing(messageAnims[messageId], {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    }, 20000);
  };

  const playAudio = async (uri) => {
    try {
      const { sound: s } = await Audio.Sound.createAsync(
        { uri }, 
        { shouldPlay: true, rate: 1.0, shouldCorrectPitch: true }
      );
      setSound(s);
      setIsTalking(true);
      s.setOnPlaybackStatusUpdate(st => { 
        if (st.didJustFinish) {
          setIsTalking(false);
          s.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsTalking(false);
    }
  };

  const sendMessage = async (text, attachedFile = null) => {
    if (!text.trim() && !attachedFile) return;

    const messageId = Date.now().toString();
    const userMsg = { id: messageId, role: 'user', content: text, file: attachedFile, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    startFadeOut(messageId);
    setInputText('');
    setIsLoading(true);
    setLoadingStage('thinking');

    try {
      const result = attachedFile
        ? await clawdbotService.chatWithFile(text, attachedFile.uri, attachedFile.name, attachedFile.type)
        : await clawdbotService.chat(text);

      if (result.ok) {
        // Show message immediately (no streaming delay)
        const assistantMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { 
          id: assistantMessageId, 
          role: 'assistant', 
          content: result.response, 
          timestamp: new Date() 
        }]);
        startFadeOut(assistantMessageId);
        setIsLoading(false);
        setLoadingStage(null);

        // Start TTS immediately in parallel
        const config = clawdbotService.getConfig();
        if (config.hasCartesiaKey) {
          clawdbotService.textToSpeechCartesia(result.response).then(tts => {
            if (tts.ok && tts.audioBlob) {
              const reader = new FileReader();
              reader.onloadend = async () => {
                const b64 = reader.result.split(',')[1];
                const uri = cacheDirectory + 'tts_cartesia.mp3';
                await writeAsStringAsync(uri, b64, { encoding: 'base64' });
                await playAudio(uri);
              };
              reader.readAsDataURL(tts.audioBlob);
            }
          });
        } else if (config.hasElevenLabsKey) {
          clawdbotService.textToSpeech(result.response).then(tts => {
            if (tts.ok && tts.audioBlob) {
              const reader = new FileReader();
              reader.onloadend = async () => {
                const b64 = reader.result.split(',')[1];
                const uri = cacheDirectory + 'tts.mp3';
                await writeAsStringAsync(uri, b64, { encoding: 'base64' });
                await playAudio(uri);
              };
              reader.readAsDataURL(tts.audioBlob);
            }
          });
        }
      } else {
        Alert.alert('Error', result.error || 'No response');
        setIsLoading(false);
        setLoadingStage(null);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
      setIsLoading(false);
      setLoadingStage(null);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { 
        Alert.alert('Permiso requerido', 'Permite el acceso al microfono'); 
        return; 
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: r } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(r);
      setIsRecording(true);
    } catch { 
      Alert.alert('Error', 'No se pudo grabar'); 
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    setIsLoading(true);
    setLoadingStage('transcribing');
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      const result = await clawdbotService.processVoice(uri);
      
      if (result.ok) {
        const userMessageId = Date.now().toString();
        const assistantMessageId = (Date.now() + 1).toString();
        
        setMessages(prev => [
          ...prev,
          { id: userMessageId, role: 'user', content: result.transcription, isVoice: true, timestamp: new Date() },
          { id: assistantMessageId, role: 'assistant', content: result.response, timestamp: new Date() },
        ]);
        
        startFadeOut(userMessageId);
        startFadeOut(assistantMessageId);
        setIsLoading(false);
        setLoadingStage(null);
        
        // Play audio immediately if available
        if (result.audioBlob) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const b64 = reader.result.split(',')[1];
            const fUri = cacheDirectory + 'voice_response.mp3';
            await writeAsStringAsync(fUri, b64, { encoding: 'base64' });
            await playAudio(fUri);
          };
          reader.readAsDataURL(result.audioBlob);
        }
      } else {
        Alert.alert('Error', result.error || 'Fallo el procesamiento de voz');
        setIsLoading(false);
        setLoadingStage(null);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
      setIsLoading(false);
      setLoadingStage(null);
    }
  };

  const showAttachmentOptions = () => {
    Alert.alert('Adjuntar', 'Elige una opcion', [
      { text: 'Documento', onPress: async () => {
        try {
          const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
          if (!r.canceled && r.assets?.[0]) {
            sendMessage('', { uri: r.assets[0].uri, name: r.assets[0].name, type: r.assets[0].mimeType });
          }
        } catch {}
      }},
      { text: 'Foto', onPress: async () => {
        try {
          const r = await ImagePicker.launchImageLibraryAsync({ 
            mediaTypes: ImagePicker.MediaTypeOptions.Images, 
            quality: 0.8 
          });
          if (!r.canceled && r.assets?.[0]) {
            sendMessage('', { 
              uri: r.assets[0].uri, 
              name: r.assets[0].uri.split('/').pop(), 
              type: 'image/jpeg' 
            });
          }
        } catch {}
      }},
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const getLoadingText = () => {
    switch (loadingStage) {
      case 'transcribing': return 'Escuchando...';
      case 'thinking': return 'Pensando...';
      default: return 'Cargando...';
    }
  };

  const renderMessage = useCallback(({ item }) => {
    const isUser = item.role === 'user';
    const opacityAnim = messageAnims[item.id] || new Animated.Value(1);
    
    return (
      <Animated.View style={[
        styles.bubble, 
        isUser ? styles.userBubble : styles.aiBubble, 
        { opacity: opacityAnim }
      ]}>
        {item.isVoice && (
          <View style={styles.voiceBadge}>
            <Ionicons name="mic" size={10} color={palette.muted} />
            <Text style={styles.voiceBadgeText}>voz</Text>
          </View>
        )}
        {item.file && (
          <View style={styles.fileBadge}>
            <Ionicons name="document-attach" size={14} color={palette.accent} />
            <Text style={styles.fileText} numberOfLines={1}>{item.file.name}</Text>
          </View>
        )}
        <Text style={styles.msgText}>{item.content}</Text>
      </Animated.View>
    );
  }, []);

  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <View style={styles.root}>
      <View style={styles.avatarBg}>
        {selectedAvatar?.type === '3d' ? (
          <Avatar3DRenderer isTalking={isTalking} />
        ) : selectedAvatar?.thumbnail ? (
          <Image source={selectedAvatar.thumbnail} style={styles.avatarImg} resizeMode="contain" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={120} color="rgba(108,99,255,0.2)" />
          </View>
        )}
        {isTalking && (
          <View style={styles.talkingRing}>
            <View style={[styles.ringCircle, styles.ring1]} />
            <View style={[styles.ringCircle, styles.ring2]} />
          </View>
        )}
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={palette.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedAvatar?.name || 'Chat'}</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')} 
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="settings-outline" size={22} color={palette.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.msgList,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 80 }
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={null}
          keyboardShouldPersistTaps="handled"
        />

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={palette.accent} size="small" />
            <Text style={styles.loadingText}>{getLoadingText()}</Text>
          </View>
        )}

        <View style={[styles.inputBar, { paddingBottom: bottomPad, marginBottom: keyboardHeight }]}>
          <TouchableOpacity 
            style={styles.inputIcon} 
            onPress={showAttachmentOptions} 
            disabled={isLoading || isRecording}
          >
            <Ionicons name="add-circle-outline" size={26} color={palette.muted} />
          </TouchableOpacity>

          <View style={styles.inputField}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="rgba(240,240,245,0.3)"
              multiline
              maxLength={2000}
              editable={!isLoading && !isRecording}
            />
          </View>

          {inputText.trim() ? (
            <TouchableOpacity 
              style={styles.sendBtn} 
              onPress={() => sendMessage(inputText)} 
              disabled={isLoading}
            >
              <Ionicons name="arrow-up" size={20} color={palette.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.micBtn, isRecording && styles.micBtnActive]} 
              onPressIn={startRecording} 
              onPressOut={stopRecording} 
              disabled={isLoading}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons 
                  name={isRecording ? 'radio' : 'mic'} 
                  size={22} 
                  color={isRecording ? '#fff' : palette.muted} 
                />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  avatarBg: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: SCREEN_W * 0.85, height: SCREEN_H * 0.75 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', marginTop: -SCREEN_H * 0.08 },
  talkingRing: { position: 'absolute', bottom: SCREEN_H * 0.35, alignItems: 'center', justifyContent: 'center' },
  ringCircle: { position: 'absolute', borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(108,99,255,0.3)' },
  ring1: { width: 160, height: 160 },
  ring2: { width: 200, height: 200, borderColor: 'rgba(108,99,255,0.15)' },
  header: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingBottom: 12, 
    zIndex: 10 
  },
  headerTitle: { color: palette.white, fontSize: 17, fontWeight: '600', letterSpacing: 0.3 },
  container: { flex: 1, justifyContent: 'flex-end' },
  msgList: { paddingHorizontal: 16, paddingTop: SCREEN_H * 0.5 },
  bubble: { 
    maxWidth: '78%', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 18, 
    marginBottom: 6 
  },
  userBubble: { backgroundColor: palette.userBubble, alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  aiBubble: { backgroundColor: palette.aiBubble, alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
  msgText: { color: palette.white, fontSize: 15, lineHeight: 21 },
  voiceBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  voiceBadgeText: { fontSize: 10, color: palette.muted, marginLeft: 3 },
  fileBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: palette.accentSoft, 
    paddingHorizontal: 8, 
    paddingVertical: 5, 
    borderRadius: 8, 
    marginBottom: 6 
  },
  fileText: { fontSize: 11, color: palette.white, marginLeft: 6, flex: 1 },
  loadingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 6 
  },
  loadingText: { color: palette.muted, marginLeft: 8, fontSize: 13 },
  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 12, 
    paddingTop: 10 
  },
  inputIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  inputField: { 
    flex: 1, 
    backgroundColor: palette.inputBg, 
    borderRadius: 22, 
    marginHorizontal: 6, 
    borderWidth: 1, 
    borderColor: 'rgba(240,240,245,0.08)' 
  },
  textInput: { 
    color: palette.white, 
    fontSize: 15, 
    paddingHorizontal: 16, 
    paddingTop: 10, 
    paddingBottom: 10, 
    maxHeight: 100 
  },
  sendBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: palette.accent, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  micBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(30,40,55,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  micBtnActive: { backgroundColor: '#e04060' },
});

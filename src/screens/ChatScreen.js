/**
 * Chat Screen
 * Main chat interface with voice recording and file upload
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { clawdbotService } from '../services/ClawdbotService';
import AvatarDisplay from '../components/AvatarDisplay';

// Theme
const theme = {
  background: '#1a1a2e',
  surface: '#16213e',
  primary: '#e94560',
  secondary: '#0f3460',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  userBubble: '#0f3460',
  aiBubble: '#16213e'
};

export default function ChatScreen({ selectedAvatar }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isTalking, setIsTalking] = useState(false);
  const [sound, setSound] = useState(null);

  const flatListRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Send text message
  const sendMessage = async (text, attachedFile = null) => {
    if (!text.trim() && !attachedFile) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      file: attachedFile,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      let result;

      if (attachedFile) {
        result = await clawdbotService.chatWithFile(
          text,
          attachedFile.uri,
          attachedFile.name,
          attachedFile.type
        );
      } else {
        result = await clawdbotService.chat(text);
      }

      if (result.ok) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);

        // Play TTS if available
        if (clawdbotService.getConfig().hasElevenLabsKey) {
          playTTS(result.response);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to get response');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Play text-to-speech
  const playTTS = async (text) => {
    try {
      setIsTalking(true);
      const ttsResult = await clawdbotService.textToSpeech(text);

      if (ttsResult.ok && ttsResult.audioBlob) {
        // Convert blob to base64 and play
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result.split(',')[1];
          const fileUri = FileSystem.cacheDirectory + 'tts_response.mp3';

          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64
          });

          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: fileUri },
            { shouldPlay: true }
          );

          setSound(newSound);

          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              setIsTalking(false);
            }
          });
        };
        reader.readAsDataURL(ttsResult.audioBlob);
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsTalking(false);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant microphone permission');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  // Stop recording and send
  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsLoading(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Process voice
      const result = await clawdbotService.processVoice(uri);

      if (result.ok) {
        // Add user message (transcription)
        const userMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: result.transcription,
          isVoice: true,
          timestamp: new Date()
        };

        // Add AI response
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage, aiMessage]);

        // Play audio response
        if (result.audioBlob) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            setIsTalking(true);
            const base64 = reader.result.split(',')[1];
            const fileUri = FileSystem.cacheDirectory + 'voice_response.mp3';

            await FileSystem.writeAsStringAsync(fileUri, base64, {
              encoding: FileSystem.EncodingType.Base64
            });

            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: fileUri },
              { shouldPlay: true }
            );

            setSound(newSound);

            newSound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) {
                setIsTalking(false);
              }
            });
          };
          reader.readAsDataURL(result.audioBlob);
        }
      } else {
        Alert.alert('Error', result.error || 'Voice processing failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Pick document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets?.[0]) {
        const file = result.assets[0];
        Alert.prompt(
          'Add a message',
          `Sending: ${file.name}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send',
              onPress: (message) => sendMessage(message || '', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType
              })
            }
          ],
          'plain-text',
          ''
        );
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  // Pick image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8
      });

      if (!result.canceled && result.assets?.[0]) {
        const image = result.assets[0];
        const fileName = image.uri.split('/').pop();

        Alert.prompt(
          'Add a message',
          'Sending image',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send',
              onPress: (message) => sendMessage(message || '', {
                uri: image.uri,
                name: fileName,
                type: 'image/jpeg'
              })
            }
          ],
          'plain-text',
          ''
        );
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  // Show attachment options
  const showAttachmentOptions = () => {
    Alert.alert(
      'Attach File',
      'Choose an option',
      [
        { text: 'Document', onPress: pickDocument },
        { text: 'Photo', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Render message bubble
  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.aiBubble
      ]}>
        {item.isVoice && (
          <View style={styles.voiceIndicator}>
            <Ionicons name="mic" size={12} color={theme.textSecondary} />
            <Text style={styles.voiceText}>Voice message</Text>
          </View>
        )}

        {item.file && (
          <View style={styles.fileIndicator}>
            <Ionicons name="document" size={16} color={theme.primary} />
            <Text style={styles.fileName}>{item.file.name}</Text>
          </View>
        )}

        <Text style={styles.messageText}>{item.content}</Text>

        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Avatar Display */}
      <AvatarDisplay avatar={selectedAvatar} isTalking={isTalking} />

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.textSecondary} />
            <Text style={styles.emptyText}>Start a conversation!</Text>
          </View>
        }
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Thinking...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        {/* Attachment Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={showAttachmentOptions}
          disabled={isLoading || isRecording}
        >
          <Ionicons name="attach" size={24} color={theme.text} />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={2000}
          editable={!isLoading && !isRecording}
        />

        {/* Send or Record Button */}
        {inputText.trim() ? (
          <TouchableOpacity
            style={[styles.iconButton, styles.sendButton]}
            onPress={() => sendMessage(inputText)}
            disabled={isLoading}
          >
            <Ionicons name="send" size={20} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.recordButton,
              isRecording && styles.recordingActive
            ]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={isLoading}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={24}
                color={isRecording ? '#fff' : theme.text}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  messageList: {
    padding: 16,
    flexGrow: 1
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60
  },
  emptyText: {
    color: theme.textSecondary,
    marginTop: 12,
    fontSize: 16
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8
  },
  userBubble: {
    backgroundColor: theme.userBubble,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4
  },
  aiBubble: {
    backgroundColor: theme.aiBubble,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  voiceText: {
    fontSize: 10,
    color: theme.textSecondary,
    marginLeft: 4
  },
  fileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.secondary,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8
  },
  fileName: {
    fontSize: 12,
    color: theme.text,
    marginLeft: 8,
    flex: 1
  },
  messageText: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 20
  },
  timestamp: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  loadingText: {
    color: theme.textSecondary,
    marginLeft: 8
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.secondary
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.secondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 15,
    maxHeight: 100,
    marginHorizontal: 8
  },
  sendButton: {
    backgroundColor: theme.primary,
    borderRadius: 22
  },
  recordButton: {
    backgroundColor: theme.secondary,
    borderRadius: 22
  },
  recordingActive: {
    backgroundColor: theme.primary
  }
});

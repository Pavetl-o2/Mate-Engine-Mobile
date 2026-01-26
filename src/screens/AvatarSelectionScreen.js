/**
 * Avatar Selection Screen
 * Allows user to choose between 3D model and PNGTuber
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// Theme
const theme = {
  background: '#1a1a2e',
  surface: '#16213e',
  primary: '#e94560',
  secondary: '#0f3460',
  text: '#ffffff',
  textSecondary: '#a0a0a0'
};

// Avatar types
const AVATAR_TYPES = {
  MODEL_3D: '3d',
  PNGTUBER: 'pngtuber'
};

// Sample avatars (replace with actual assets)
const AVATARS = [
  {
    id: '3d-jinx',
    name: 'Jinx 3D',
    type: AVATAR_TYPES.MODEL_3D,
    thumbnail: null, // Will use placeholder
    modelPath: 'models/jinx.glb'
  },
  {
    id: 'png-jinx',
    name: 'Jinx PNGTuber',
    type: AVATAR_TYPES.PNGTUBER,
    thumbnail: null, // Will use placeholder
    imagePath: 'pngtuber/jinx.png'
  }
];

export default function AvatarSelectionScreen({ navigation, selectedAvatar, setSelectedAvatar }) {
  const [localSelection, setLocalSelection] = useState(selectedAvatar?.id || null);

  const handleSelect = (avatar) => {
    setLocalSelection(avatar.id);
  };

  const handleContinue = () => {
    const avatar = AVATARS.find(a => a.id === localSelection);
    if (avatar) {
      setSelectedAvatar(avatar);
      navigation.navigate('Chat');
    }
  };

  const renderAvatarCard = (avatar) => {
    const isSelected = localSelection === avatar.id;
    const is3D = avatar.type === AVATAR_TYPES.MODEL_3D;

    return (
      <TouchableOpacity
        key={avatar.id}
        style={[styles.avatarCard, isSelected && styles.avatarCardSelected]}
        onPress={() => handleSelect(avatar)}
        activeOpacity={0.7}
      >
        {/* Avatar Preview */}
        <View style={styles.avatarPreview}>
          {avatar.thumbnail ? (
            <Image source={avatar.thumbnail} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name={is3D ? 'cube-outline' : 'person-outline'}
                size={48}
                color={theme.primary}
              />
            </View>
          )}

          {/* Type Badge */}
          <View style={[styles.typeBadge, is3D ? styles.badge3D : styles.badgePNG]}>
            <Text style={styles.typeBadgeText}>
              {is3D ? '3D' : 'PNG'}
            </Text>
          </View>

          {/* Selection Indicator */}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
            </View>
          )}
        </View>

        {/* Avatar Name */}
        <Text style={styles.avatarName}>{avatar.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Avatar</Text>
        <Text style={styles.subtitle}>
          Select a 3D model or PNGTuber to chat with
        </Text>
      </View>

      {/* Avatar Grid */}
      <ScrollView
        contentContainerStyle={styles.avatarGrid}
        showsVerticalScrollIndicator={false}
      >
        {AVATARS.map(renderAvatarCard)}

        {/* Add More Placeholder */}
        <TouchableOpacity
          style={[styles.avatarCard, styles.addMoreCard]}
          onPress={() => {/* Future: Add custom avatar */}}
          activeOpacity={0.7}
        >
          <View style={styles.avatarPreview}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="add" size={48} color={theme.textSecondary} />
            </View>
          </View>
          <Text style={[styles.avatarName, styles.addMoreText]}>Add More</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Ionicons name="settings-outline" size={20} color={theme.text} />
        <Text style={styles.settingsButtonText}>Configure AI</Text>
      </TouchableOpacity>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          !localSelection && styles.continueButtonDisabled
        ]}
        onPress={handleContinue}
        disabled={!localSelection}
      >
        <Text style={styles.continueButtonText}>Continue to Chat</Text>
        <Ionicons name="arrow-forward" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 16
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 16
  },
  avatarCard: {
    width: CARD_WIDTH,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  avatarCardSelected: {
    borderColor: theme.primary
  },
  addMoreCard: {
    borderStyle: 'dashed',
    borderColor: theme.textSecondary,
    opacity: 0.6
  },
  avatarPreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.secondary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  badge3D: {
    backgroundColor: '#8b5cf6'
  },
  badgePNG: {
    backgroundColor: '#06b6d4'
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.text
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8
  },
  avatarName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center'
  },
  addMoreText: {
    color: theme.textSecondary
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12
  },
  settingsButtonText: {
    color: theme.text,
    marginLeft: 8,
    fontSize: 14
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 12
  },
  continueButtonDisabled: {
    opacity: 0.5
  },
  continueButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8
  }
});

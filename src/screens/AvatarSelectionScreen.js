/**
 * Avatar Selection Screen
 * Minimalist grid for choosing between 3D model and PNGTuber
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_W = (width - 56) / 2;

const palette = {
  bg: '#0f1923',
  card: '#172331',
  accent: '#6c63ff',
  white: '#f0f0f5',
  muted: 'rgba(240,240,245,0.45)',
  border: 'rgba(240,240,245,0.06)',
};

const AVATAR_TYPES = { MODEL_3D: '3d', PNGTUBER: 'pngtuber' };

// Avatars list - thumbnails can be require() images or null for placeholder
const AVATARS = [
  {
    id: '3d-avatar',
    name: 'Avatar 3D',
    type: AVATAR_TYPES.MODEL_3D,
    thumbnail: null,
    modelPath: 'assets/models/avatar.glb',
  },
  {
    id: 'png-avatar',
    name: 'PNGTuber',
    type: AVATAR_TYPES.PNGTUBER,
    thumbnail: null,
    imagePath: 'assets/pngtuber/',
  },
];

export default function AvatarSelectionScreen({ navigation, selectedAvatar, setSelectedAvatar }) {
  const insets = useSafeAreaInsets();
  const [localSel, setLocalSel] = useState(selectedAvatar?.id || null);

  const handleContinue = () => {
    const av = AVATARS.find(a => a.id === localSel);
    if (av) {
      setSelectedAvatar(av);
      navigation.navigate('Chat');
    }
  };

  const renderCard = (avatar) => {
    const selected = localSel === avatar.id;
    const is3D = avatar.type === AVATAR_TYPES.MODEL_3D;

    return (
      <TouchableOpacity
        key={avatar.id}
        style={[styles.card, selected && styles.cardSelected]}
        onPress={() => setLocalSel(avatar.id)}
        activeOpacity={0.8}
      >
        <View style={styles.preview}>
          {avatar.thumbnail ? (
            <Image source={avatar.thumbnail} style={styles.previewImg} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons
                name={is3D ? 'cube-outline' : 'image-outline'}
                size={40}
                color={selected ? palette.accent : palette.muted}
              />
            </View>
          )}
          <View style={[styles.badge, is3D ? styles.badge3D : styles.badgePNG]}>
            <Text style={styles.badgeText}>{is3D ? '3D' : 'PNG'}</Text>
          </View>
          {selected && (
            <View style={styles.check}>
              <Ionicons name="checkmark-circle" size={22} color={palette.accent} />
            </View>
          )}
        </View>
        <Text style={[styles.cardName, selected && styles.cardNameActive]}>{avatar.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      {/* Title */}
      <Text style={styles.title}>Elige tu Avatar</Text>
      <Text style={styles.subtitle}>Selecciona un modelo 3D o PNGTuber</Text>

      {/* Grid */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {AVATARS.map(renderCard)}

        {/* Add more */}
        <TouchableOpacity style={[styles.card, styles.addCard]} activeOpacity={0.6}>
          <View style={styles.preview}>
            <View style={styles.previewPlaceholder}>
              <Ionicons name="add" size={36} color={palette.muted} />
            </View>
          </View>
          <Text style={[styles.cardName, { color: palette.muted }]}>Agregar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={20} color={palette.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueBtn, !localSel && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!localSel}
        >
          <Text style={styles.continueBtnText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={18} color={palette.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: palette.white,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: palette.muted,
    marginTop: 6,
    marginBottom: 28,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  card: {
    width: CARD_W,
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  cardSelected: {
    borderColor: palette.accent,
    backgroundColor: 'rgba(108,99,255,0.06)',
  },
  addCard: {
    borderStyle: 'dashed',
    borderColor: 'rgba(240,240,245,0.12)',
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(15,25,35,0.5)',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badge3D: { backgroundColor: 'rgba(139,92,246,0.85)' },
  badgePNG: { backgroundColor: 'rgba(6,182,212,0.85)' },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.white,
    textAlign: 'center',
  },
  cardNameActive: {
    color: palette.accent,
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: palette.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  continueBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: palette.accent,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  continueBtnDisabled: {
    opacity: 0.35,
  },
  continueBtnText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

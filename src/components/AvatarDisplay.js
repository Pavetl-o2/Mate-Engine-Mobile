/**
 * Avatar Display Component
 * Shows either 3D model or PNGTuber with talking animation
 */

import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Theme
const theme = {
  background: '#1a1a2e',
  surface: '#16213e',
  primary: '#e94560',
  secondary: '#0f3460'
};

const AVATAR_TYPES = {
  MODEL_3D: '3d',
  PNGTUBER: 'pngtuber'
};

export default function AvatarDisplay({ avatar, isTalking }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const mouthAnim = useRef(new Animated.Value(0)).current;

  // Bounce animation when talking
  useEffect(() => {
    if (isTalking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          })
        ])
      ).start();

      // Mouth animation for PNGTuber
      Animated.loop(
        Animated.sequence([
          Animated.timing(mouthAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.timing(mouthAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      bounceAnim.setValue(0);
      mouthAnim.setValue(0);
    }
  }, [isTalking]);

  const render3DAvatar = () => {
    // For 3D models, we'd use expo-three or react-three-fiber
    // For now, showing a placeholder with animation
    return (
      <Animated.View
        style={[
          styles.avatarContainer,
          { transform: [{ translateY: bounceAnim }] }
        ]}
      >
        <View style={styles.placeholder3D}>
          <Ionicons name="cube" size={64} color={theme.primary} />
          {isTalking && (
            <View style={styles.talkingIndicator}>
              <View style={[styles.soundWave, styles.wave1]} />
              <View style={[styles.soundWave, styles.wave2]} />
              <View style={[styles.soundWave, styles.wave3]} />
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderPNGTuber = () => {
    // PNGTuber with simple mouth animation
    const mouthScale = mouthAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.1]
    });

    return (
      <Animated.View
        style={[
          styles.avatarContainer,
          { transform: [{ translateY: bounceAnim }] }
        ]}
      >
        {avatar?.thumbnail ? (
          <Animated.Image
            source={avatar.thumbnail}
            style={[
              styles.pngTuberImage,
              { transform: [{ scale: mouthScale }] }
            ]}
          />
        ) : (
          <View style={styles.placeholderPNG}>
            <Ionicons name="person" size={64} color={theme.primary} />
            {isTalking && (
              <Animated.View
                style={[
                  styles.mouthOverlay,
                  { transform: [{ scaleY: mouthScale }] }
                ]}
              />
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  if (!avatar) {
    return (
      <View style={styles.container}>
        <View style={styles.noAvatar}>
          <Ionicons name="person-outline" size={48} color={theme.textSecondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {avatar.type === AVATAR_TYPES.MODEL_3D ? render3DAvatar() : renderPNGTuber()}

      {/* Talking indicator */}
      {isTalking && (
        <View style={styles.speakingBadge}>
          <Ionicons name="volume-high" size={12} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.secondary
  },
  avatarContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholder3D: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.secondary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderPNG: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: theme.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  pngTuberImage: {
    width: 100,
    height: 100,
    borderRadius: 16
  },
  noAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.secondary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  talkingIndicator: {
    position: 'absolute',
    bottom: -20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20
  },
  soundWave: {
    width: 4,
    backgroundColor: theme.primary,
    marginHorizontal: 2,
    borderRadius: 2
  },
  wave1: {
    height: 8
  },
  wave2: {
    height: 16
  },
  wave3: {
    height: 12
  },
  mouthOverlay: {
    position: 'absolute',
    bottom: 20,
    width: 20,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4
  },
  speakingBadge: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center'
  }
});

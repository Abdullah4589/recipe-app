import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { defaultTheme } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function AppSplashScreen({ onFinish }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.75)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade + scale in logo & name
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Fade in tagline slightly after
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(900),
      // Fade everything out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        {/* Logo mark */}
        <View style={styles.logoCircle}>
          <View style={styles.logoInner}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <View style={styles.leafAccent} />
        </View>

        {/* App name */}
        <Text style={styles.appName}>MealPlanner</Text>
      </Animated.View>

      {/* Tagline fades in separately */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Plan your week, eat better
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 38,
    fontWeight: '800',
    color: defaultTheme.primary,
    letterSpacing: -1,
  },
  leafAccent: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    position: 'absolute',
    bottom: 80,
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
});

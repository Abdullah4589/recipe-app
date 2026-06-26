import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, cardShadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function StepCard({ number, step }) {
  const { theme } = useTheme();
  return (
    <View style={[cardShadow, styles.card]}>
      <View style={[styles.circle, { backgroundColor: theme.primary }]}>
        <Text style={styles.circleText}>{number}</Text>
      </View>
      <Text style={styles.step}>{step}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    flexShrink: 0,
  },
  circleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  step: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
    flex: 1,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, useColors } from '../context/ThemeContext';

export default function StepCard({ number, step }) {
  const { theme } = useTheme();
  const colors    = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.circle, { backgroundColor: theme.primary }]}>
        <Text style={styles.circleText}>{number}</Text>
      </View>
      <Text style={[styles.step, { color: colors.textPrimary }]}>{step}</Text>
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
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    lineHeight: 22,
    flex: 1,
  },
});

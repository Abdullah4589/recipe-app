import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function DayPill({ label, active, onPress }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active && { borderColor: theme.primary, backgroundColor: theme.primary }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, active && { color: '#FFFFFF', fontWeight: '600' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: Colors.surface,
    flexShrink: 0,
    minWidth: 52,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});

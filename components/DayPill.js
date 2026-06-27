import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, useColors } from '../context/ThemeContext';

export default function DayPill({ label, active, onPress }) {
  const { theme } = useTheme();
  const colors    = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pill,
        { borderColor: colors.border, backgroundColor: colors.surface },
        active && { borderColor: theme.primary, backgroundColor: theme.primary },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, { color: colors.textSecondary }, active && { color: '#FFFFFF', fontWeight: '600' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    flexShrink: 0,
    minWidth: 52,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, useColors } from '../context/ThemeContext';

export default function DietChip({ label, selected, onPress }) {
  const { theme } = useTheme();
  const colors    = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.border, backgroundColor: colors.surface },
        selected && { borderColor: theme.primary, backgroundColor: theme.primary },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, { color: colors.textSecondary }, selected && { color: '#FFFFFF', fontWeight: '600' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});

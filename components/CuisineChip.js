import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function CuisineChip({ label, selected, onPress }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && { borderColor: theme.primary, backgroundColor: theme.primaryLight }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, selected && { color: theme.primary, fontWeight: '600' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    margin: 4,
    backgroundColor: Colors.surface,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

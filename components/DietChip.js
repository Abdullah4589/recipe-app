import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, useColors } from '../context/ThemeContext';

export default function DietChip({ label, selected, onPress }) {
  const { theme } = useTheme();
  const colors    = useColors();
  return (
    <TouchableOpacity
      // See CuisineChip — selection must be readable by assistive tech and by
      // tests, not only visible as a colour change, and on web it has to be in
      // the label because aria-selected is dropped on role="button".
      testID={`diet-chip-${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={`${label} diet${selected ? ', selected' : ''}`}
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

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, useColors } from '../context/ThemeContext';

export default function CuisineChip({ label, selected, onPress }) {
  const { theme } = useTheme();
  const colors    = useColors();
  return (
    <TouchableOpacity
      // Selection is communicated by border/background colour alone, which
      // neither a screen reader nor a test can read.
      //
      // accessibilityState covers native. On web it is NOT enough:
      // react-native-web drops aria-selected on role="button" (correctly —
      // ARIA does not allow it there), so the selected state has to live in
      // the accessible name as well. That label is what e2e asserts on.
      testID={`cuisine-chip-${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={`${label} cuisine${selected ? ', selected' : ''}`}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.border, backgroundColor: colors.surface },
        selected && { borderColor: theme.primary, backgroundColor: theme.primaryLight },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, { color: colors.textSecondary }, selected && { color: theme.primary, fontWeight: '600' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    margin: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});

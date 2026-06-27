import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme, useColors } from '../context/ThemeContext';

export default function IngredientItem({ ingredient, checked, onToggle }) {
  const { theme } = useTheme();
  const colors    = useColors();
  const label = ingredient.displayText || [
    ingredient.amount ? String(ingredient.amount % 1 === 0 ? Math.floor(ingredient.amount) : ingredient.amount.toFixed(1)) : '',
    ingredient.unit || '',
    ingredient.name || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[
        styles.checkbox,
        { borderColor: colors.border, backgroundColor: colors.surface },
        checked && { backgroundColor: theme.primary, borderColor: theme.primary },
      ]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.label, { color: colors.textPrimary }, checked && { textDecorationLine: 'line-through', color: colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

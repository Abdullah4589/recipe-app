import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function IngredientItem({ ingredient, checked, onToggle }) {
  const { theme } = useTheme();
  const label = ingredient.displayText || [
    ingredient.amount ? String(ingredient.amount % 1 === 0 ? Math.floor(ingredient.amount) : ingredient.amount.toFixed(1)) : '',
    ingredient.unit || '',
    ingredient.name || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: Colors.surface,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  labelChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
});

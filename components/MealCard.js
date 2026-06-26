import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, CuisineBadge, cardShadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

function MetaChip({ label, bgColor, textColor }) {
  return (
    <View style={[styles.metaChip, { backgroundColor: bgColor }]}>
      <Text style={[styles.metaChipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export default function MealCard({ meal, mealType, onPress, onShuffle }) {
  const { theme } = useTheme();
  if (!meal) return null;

  const badge = CuisineBadge[meal.cuisine] || { bg: theme.primaryLight, text: theme.primary };
  const dietLabel = meal.diets?.[0];

  return (
    <TouchableOpacity style={[cardShadow, styles.card]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        {meal.image ? (
          <Image source={{ uri: meal.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: badge.bg }]}>
            <Text style={[styles.placeholderText, { color: badge.text }]} numberOfLines={3}>
              {meal.title}
            </Text>
          </View>
        )}
        <View style={[styles.cuisineBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.cuisineBadgeText, { color: badge.text }]}>{meal.cuisine}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{meal.title}</Text>
        <View style={styles.metaRow}>
          <MetaChip label={meal.cuisine} bgColor={badge.bg} textColor={badge.text} />
          {dietLabel ? (
            <MetaChip label={dietLabel} bgColor={theme.primaryLight} textColor={theme.primary} />
          ) : null}
          {meal.readyInMinutes ? (
            <MetaChip label={`${meal.readyInMinutes} min`} bgColor={Colors.background} textColor={Colors.textSecondary} />
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onShuffle} style={styles.shuffleBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.shuffleIcon, { color: theme.primary }]}>⟳</Text>
        </TouchableOpacity>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },
  cuisineBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cuisineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    padding: 12,
    paddingBottom: 4,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  metaChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  shuffleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shuffleIcon: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  arrow: {
    fontSize: 22,
    color: Colors.textSecondary,
  },
});

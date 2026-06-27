import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, CuisineBadge } from '../constants/theme';
import { useTheme, useColors } from '../context/ThemeContext';
import IngredientItem from '../components/IngredientItem';
import StepCard from '../components/StepCard';
import { favouritesAPI } from '../api/backend';

function InfoChip({ label, value, colors }) {
  if (!value) return null;
  return (
    <View style={[styles.infoChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.infoChipLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoChipValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

export default function RecipeDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = useColors();
  const { recipe } = route.params;
  const [checked, setChecked]       = useState({});
  const [favSaved, setFavSaved]     = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const toggleIngredient = useCallback((id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const openSource = async () => {
    if (!recipe.sourceUrl) return;
    const supported = await Linking.canOpenURL(recipe.sourceUrl);
    if (supported) {
      await Linking.openURL(recipe.sourceUrl);
    } else {
      Alert.alert('Cannot open URL', recipe.sourceUrl);
    }
  };

  const handleFavourite = async () => {
    if (favSaved) return;
    setFavLoading(true);
    try {
      await favouritesAPI.add(recipe);
      setFavSaved(true);
    } catch (_e) {
      Alert.alert('Error', 'Could not save to favourites.');
    } finally {
      setFavLoading(false);
    }
  };

  const badge    = CuisineBadge[recipe.cuisine] || { bg: theme.primaryLight, text: theme.primary };
  const dietLabel = recipe.diets?.[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Floating back button */}
      <TouchableOpacity
        style={[styles.backBtnFloat, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>‹</Text>
      </TouchableOpacity>

      {/* Floating favourite button */}
      <TouchableOpacity
        style={[styles.favBtnFloat, { top: insets.top + 8 }]}
        onPress={handleFavourite}
        disabled={favLoading || favSaved}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {favLoading
          ? <ActivityIndicator size="small" color={theme.primary} />
          : <Text style={[styles.favBtnText, { color: colors.textSecondary }, favSaved && { color: '#E53935' }]}>
              {favSaved ? '♥' : '♡'}
            </Text>
        }
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Hero image */}
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder, { backgroundColor: badge.bg }]}>
            <Text style={[styles.heroPlaceholderText, { color: badge.text }]} numberOfLines={4}>
              {recipe.title}
            </Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{recipe.title}</Text>

          {/* Info chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.infoRow}
            contentContainerStyle={styles.infoRowContent}
          >
            <InfoChip label="Cuisine"   value={recipe.cuisine} colors={colors} />
            {dietLabel ? <InfoChip label="Diet"     value={dietLabel} colors={colors} /> : null}
            {recipe.readyInMinutes ? <InfoChip label="Time" value={`${recipe.readyInMinutes} min`} colors={colors} /> : null}
            {recipe.servings ? <InfoChip label="Servings" value={String(recipe.servings)} colors={colors} /> : null}
          </ScrollView>

          {/* Source link */}
          {recipe.sourceUrl ? (
            <TouchableOpacity
              style={[styles.sourceBtn, { backgroundColor: theme.primary }]}
              onPress={openSource}
              activeOpacity={0.8}
            >
              <Text style={styles.sourceBtnText}>View Full Recipe ↗</Text>
            </TouchableOpacity>
          ) : null}

          {/* Ingredients */}
          {recipe.ingredients?.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Ingredients</Text>
              {recipe.ingredients.map((ing) => (
                <IngredientItem
                  key={`${ing.id}-${ing.name}`}
                  ingredient={ing}
                  checked={!!checked[`${ing.id}-${ing.name}`]}
                  onToggle={() => toggleIngredient(`${ing.id}-${ing.name}`)}
                />
              ))}
            </View>
          )}

          {/* Instructions */}
          {recipe.steps?.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Instructions</Text>
              {recipe.steps.map((s) => (
                <StepCard key={s.number} number={s.number} step={s.step} />
              ))}
            </View>
          )}

          {recipe.ingredients?.length === 0 && recipe.steps?.length === 0 && (
            <View style={[styles.noDetail, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.noDetailText, { color: colors.textSecondary }]}>
                Full recipe details not available. Tap "View Full Recipe" for the source.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtnFloat: {
    position: 'absolute', left: 12, zIndex: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  backBtnText: { fontSize: 28, fontWeight: '300', lineHeight: 34 },
  favBtnFloat: {
    position: 'absolute', right: 12, zIndex: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  favBtnText: { fontSize: 20, lineHeight: 24 },
  hero: { width: '100%', height: 240 },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  heroPlaceholderText: { fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 32 },
  content: { padding: Spacing.md },
  title: {
    ...Typography.heading1, fontSize: 24,
    marginTop: 12, marginBottom: 14, lineHeight: 32,
  },
  infoRow: { flexGrow: 0, marginBottom: 16 },
  infoRowContent: { gap: 8, paddingRight: 8 },
  infoChip: {
    borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center',
  },
  infoChipLabel: {
    fontSize: 10, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  infoChipValue: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  sourceBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  sourceBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  section: { marginBottom: 28 },
  sectionHeading: { ...Typography.heading2, marginBottom: 12 },
  noDetail: {
    padding: 16,
    borderRadius: 12, borderWidth: 1,
  },
  noDetailText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
});

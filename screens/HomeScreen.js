import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, themes } from '../constants/theme';
import { useTheme, useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import CuisineChip from '../components/CuisineChip';
import DietChip from '../components/DietChip';
import { saveCuisines, loadCuisines, saveDiet, loadDiet } from '../utils/storage';
import { preferencesAPI } from '../api/backend';

const ALL_CUISINES = [
  'Pakistani', 'Indian', 'Arabic', 'Italian', 'Mexican', 'Mediterranean',
  'Chinese', 'Japanese', 'American', 'Middle Eastern', 'Thai', 'French', 'Greek',
];

const DIET_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Gluten Free', 'High Protein'];
const DEFAULT_CUISINES = ['Pakistani', 'Mediterranean'];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, setTheme, isDark, toggleDark } = useTheme();
  const colors = useColors();
  const { user, logout } = useAuth();

  const [selectedCuisines, setSelectedCuisines] = useState(new Set(DEFAULT_CUISINES));
  const [selectedDiet, setSelectedDiet]         = useState('None');

  useEffect(() => {
    (async () => {
      try {
        const cloudPrefs = await preferencesAPI.get();
        if (cloudPrefs) {
          if (cloudPrefs.cuisines?.length) setSelectedCuisines(new Set(cloudPrefs.cuisines));
          if (cloudPrefs.diet) setSelectedDiet(cloudPrefs.diet);
          return;
        }
      } catch (_e) {}
      try {
        const cuisines = await loadCuisines();
        if (cuisines?.length) setSelectedCuisines(new Set(cuisines));
        const diet = await loadDiet();
        if (diet) setSelectedDiet(diet);
      } catch (_e) {}
    })();
  }, []);

  const toggleCuisine = useCallback((cuisine) => {
    setSelectedCuisines((prev) => {
      if (prev.has(cuisine)) {
        if (prev.size === 1) return prev;
        const next = new Set(prev);
        next.delete(cuisine);
        return next;
      }
      return new Set([...prev, cuisine]);
    });
  }, []);

  const handlePlanMyWeek = async () => {
    const cuisineArr = [...selectedCuisines];
    await saveCuisines(cuisineArr);
    await saveDiet(selectedDiet);
    preferencesAPI.save(cuisineArr, selectedDiet).catch(() => {});
    navigation.navigate('WeeklyPlan', { cuisines: cuisineArr, diet: selectedDiet });
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.appName, { color: theme.primary }]}>MealPlanner</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Plan your week, eat better</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={toggleDark}
                style={styles.headerBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.headerBtnIcon, { color: theme.primary }]}>
                  {isDark ? '☀' : '☽'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Favourites')}
                style={styles.headerBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.headerBtnIcon, { color: theme.primary }]}>♥</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('CustomRecipes')}
                style={styles.headerBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.headerBtnIcon, { color: theme.primary }]}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.headerBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.headerBtnIcon, { color: colors.textSecondary }]}>⏻</Text>
              </TouchableOpacity>
            </View>
          </View>
          {user?.email ? (
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
          ) : null}
        </View>

        {/* Theme selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Theme</Text>
          <View style={styles.swatchRow}>
            {Object.values(themes).map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTheme(t.key)}
                style={styles.swatchWrap}
                activeOpacity={0.8}
              >
                <View style={[styles.swatch, { backgroundColor: t.primary }]}>
                  {theme.key === t.key && <Text style={styles.swatchCheck}>✓</Text>}
                </View>
                <Text style={[styles.swatchLabel, { color: colors.textSecondary }, theme.key === t.key && { color: theme.primary, fontWeight: '600' }]}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cuisine selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Select Cuisines</Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>At least one required</Text>
          <View style={styles.chipsWrap}>
            {ALL_CUISINES.map((c) => (
              <CuisineChip
                key={c}
                label={c}
                selected={selectedCuisines.has(c)}
                onPress={() => toggleCuisine(c)}
              />
            ))}
          </View>
        </View>

        {/* Diet selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Dietary Preference</Text>
          <View style={styles.chipsWrap}>
            {DIET_OPTIONS.map((d) => (
              <DietChip
                key={d}
                label={d}
                selected={selectedDiet === d}
                onPress={() => setSelectedDiet(d)}
              />
            ))}
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.planBtn, { backgroundColor: theme.primary }]}
          onPress={handlePlanMyWeek}
          activeOpacity={0.85}
        >
          <Text style={styles.planBtnText}>Plan My Week</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
  header: { marginTop: 20, marginBottom: 28 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  appName: { ...Typography.heading1, letterSpacing: -0.5 },
  subtitle: { ...Typography.body, marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  headerBtn: { padding: 6 },
  headerBtnIcon: { fontSize: 20 },
  userEmail: { fontSize: 12, marginTop: 6 },
  section: { marginBottom: 24 },
  sectionLabel: { ...Typography.heading3, marginBottom: 4 },
  sectionHint: { fontSize: 12, marginBottom: 10 },
  swatchRow: { flexDirection: 'row', marginTop: 8, gap: 12 },
  swatchWrap: { alignItems: 'center', gap: 6 },
  swatch: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  swatchCheck: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  swatchLabel: { fontSize: 11, fontWeight: '400' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  spacer: { height: 24 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.md, paddingTop: 12,
    borderTopWidth: 1,
  },
  planBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  planBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});

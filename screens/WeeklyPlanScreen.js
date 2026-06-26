import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import DayPill from '../components/DayPill';
import MealCard from '../components/MealCard';
import { generateWeekPlan, shuffleSingleMeal } from '../api/gemini';
import { saveMealPlan, loadMealPlan } from '../utils/storage';
import { mealPlanAPI } from '../api/backend';

const DAYS       = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function persistPlan(plan, cuisines, diet) {
  await saveMealPlan(plan);
  mealPlanAPI.save(plan, cuisines, diet).catch(() => {});
}

export default function WeeklyPlanScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { cuisines, diet } = route.params;

  const [selectedDay, setSelectedDay]   = useState('Mon');
  const [plan, setPlan]                 = useState(null);
  const [savedAt, setSavedAt]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [errorDetail, setErrorDetail]   = useState('');
  const [shufflingSlot, setShufflingSlot] = useState(null);

  const generateFresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorDetail('');
    try {
      const freshPlan = await generateWeekPlan(cuisines, diet);
      const now = new Date().toISOString();
      await persistPlan(freshPlan, cuisines, diet);
      setPlan(freshPlan);
      setSavedAt(now);
    } catch (e) {
      console.error('[WeeklyPlan] generation error:', e.message);
      if (e.code === 'QUOTA_EXCEEDED') {
        setError('quota');
      } else {
        setError('network');
        setErrorDetail(e.message || 'Unknown error');
        Alert.alert('Error', e.message || 'Could not load recipes. Check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [cuisines, diet]);

  // On mount: try cloud → local cache → generate fresh
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // 1. Try cloud
      try {
        const cloud = await mealPlanAPI.get();
        if (cloud?.plan) {
          setPlan(cloud.plan);
          setSavedAt(cloud.savedAt);
          setLoading(false);
          return;
        }
      } catch (_e) {}
      // 2. Try local cache
      try {
        const cached = await loadMealPlan();
        if (cached?.plan) {
          setPlan(cached.plan);
          setSavedAt(cached.savedAt);
          setLoading(false);
          return;
        }
      } catch (_e) {}
      // 3. Generate fresh
      generateFresh();
    };
    init();
  }, []);

  const handleRegenerate = () => generateFresh();

  const handleShuffle = async (day, mealType) => {
    const slotKey = `${day}-${mealType}`;
    setShufflingSlot(slotKey);
    try {
      const currentMeal = plan?.[day]?.[mealType];
      const excludeIds  = currentMeal?.id ? [currentMeal.id] : [];
      const mealCuisine = currentMeal?.cuisine || cuisines[Math.floor(Math.random() * cuisines.length)];
      const newMeal     = await shuffleSingleMeal(mealCuisine, mealType, diet, excludeIds);
      if (newMeal) {
        const updated = { ...plan, [day]: { ...plan[day], [mealType]: newMeal } };
        setPlan(updated);
        await persistPlan(updated, cuisines, diet);
      }
    } catch (e) {
      if (e.code === 'QUOTA_EXCEEDED') {
        Alert.alert('Limit Reached', 'API rate limit reached. Please try again in a moment.');
      } else {
        Alert.alert('Error', 'Could not load a new recipe. Please try again.');
      }
    } finally {
      setShufflingSlot(null);
    }
  };

  const dayMeals = plan?.[selectedDay] ?? {};

  const renderMeal = ({ item: mealType }) => {
    const meal     = dayMeals[mealType];
    const slotKey  = `${selectedDay}-${mealType}`;
    const isShuffling = shufflingSlot === slotKey;

    return (
      <View style={styles.mealSection}>
        <Text style={styles.mealTypeLabel}>{mealType}</Text>
        {isShuffling ? (
          <View style={styles.mealShuffling}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.shufflingText}>Finding a new recipe…</Text>
          </View>
        ) : meal ? (
          <MealCard
            meal={meal}
            mealType={mealType}
            onPress={() => navigation.navigate('RecipeDetail', { recipe: meal, day: selectedDay })}
            onShuffle={() => handleShuffle(selectedDay, mealType)}
          />
        ) : (
          <View style={styles.emptyMeal}>
            <Text style={styles.emptyText}>No recipe found</Text>
            <TouchableOpacity onPress={() => handleShuffle(selectedDay, mealType)}>
              <Text style={[styles.retryText, { color: theme.primary }]}>Try another</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>This Week</Text>
        <TouchableOpacity
          onPress={handleRegenerate}
          style={styles.regenBtn}
          disabled={loading}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.regenIcon, { color: loading ? Colors.border : theme.primary }]}>↻</Text>
        </TouchableOpacity>
      </View>

      {savedAt ? (
        <Text style={styles.lastUpdated}>Last updated: {formatDate(savedAt)}</Text>
      ) : null}

      {/* Day pills */}
      <FlatList
        horizontal
        data={DAYS}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
        contentContainerStyle={styles.dayScrollContent}
        renderItem={({ item: day }) => (
          <DayPill label={day} active={selectedDay === day} onPress={() => setSelectedDay(day)} />
        )}
      />

      {/* Quota error */}
      {error === 'quota' && plan && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>API limit reached. Showing your saved plan.</Text>
        </View>
      )}
      {error === 'quota' && !plan && (
        <View style={styles.errorFull}>
          <Text style={styles.errorFullText}>API rate limit reached.</Text>
          <Text style={styles.errorDetailText}>Wait a moment then tap Retry.</Text>
          <TouchableOpacity onPress={handleRegenerate} style={[styles.retryBtn, { backgroundColor: theme.primary }]}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Network error */}
      {error === 'network' && !plan && (
        <View style={styles.errorFull}>
          <Text style={styles.errorFullText}>Could not load recipes.</Text>
          {errorDetail ? <Text style={styles.errorDetailText}>{errorDetail}</Text> : null}
          <TouchableOpacity onPress={handleRegenerate} style={[styles.retryBtn, { backgroundColor: theme.primary }]}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading (no plan yet) */}
      {loading && !plan && (
        <View style={styles.loadingFull}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Building your week… (20–30 sec)</Text>
        </View>
      )}

      {/* Meal list */}
      {plan && (
        <FlatList
          data={MEAL_TYPES}
          keyExtractor={item => item}
          renderItem={renderMeal}
          contentContainerStyle={styles.mealList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Loading overlay while regenerating */}
      {loading && plan && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Building your week… (20–30 sec)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  backIcon: { fontSize: 28, color: Colors.textPrimary, fontWeight: '300', lineHeight: 32 },
  topTitle: { ...Typography.heading2, color: Colors.textPrimary },
  regenBtn: { width: 36, alignItems: 'flex-end' },
  regenIcon: { fontSize: 24, fontWeight: '600' },
  lastUpdated: {
    fontSize: 11, color: Colors.textSecondary, textAlign: 'center',
    paddingVertical: 6, backgroundColor: Colors.surface,
  },
  dayScroll: {
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    maxHeight: 60, minHeight: 60,
  },
  dayScrollContent: { alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  mealList: { padding: Spacing.md, paddingBottom: 32 },
  mealSection: { marginBottom: 8 },
  mealTypeLabel: {
    ...Typography.heading3, color: Colors.textSecondary,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 12,
  },
  mealShuffling: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  shufflingText: { marginLeft: 12, color: Colors.textSecondary, fontSize: 14 },
  emptyMeal: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  emptyText: { color: Colors.textSecondary, marginBottom: 8 },
  retryText: { fontWeight: '600' },
  loadingFull: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,248,246,0.85)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  loadingText: { marginTop: 12, fontSize: 15, color: Colors.textSecondary },
  errorBanner: { backgroundColor: Colors.amber, paddingHorizontal: Spacing.md, paddingVertical: 10 },
  errorBannerText: { color: Colors.amberText, fontSize: 13, textAlign: 'center' },
  errorFull: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  errorFullText: { fontSize: 15, color: Colors.textSecondary, marginBottom: 16, textAlign: 'center' },
  errorDetailText: {
    fontSize: 11, color: Colors.textSecondary, marginBottom: 16, textAlign: 'center', paddingHorizontal: 8,
  },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});

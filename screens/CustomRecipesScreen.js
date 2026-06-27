import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, CuisineBadge } from '../constants/theme';
import { useTheme, useColors } from '../context/ThemeContext';
import { customRecipesAPI } from '../api/backend';

const EMPTY_FORM = { title: '', cuisine: '', readyInMinutes: '', servings: '', ingredientsText: '', stepsText: '' };

function parseIngredients(text) {
  return text.split('\n').map(l => l.trim()).filter(Boolean)
    .map((line, i) => ({ id: i, name: line, amount: null, unit: '', displayText: line }));
}

function parseSteps(text) {
  return text.split('\n').map(l => l.trim()).filter(Boolean)
    .map((step, i) => ({ number: i + 1, step }));
}

function toFormValues(r) {
  return {
    title: r.title || '',
    cuisine: r.cuisine || '',
    readyInMinutes: r.readyInMinutes ? String(r.readyInMinutes) : '',
    servings: r.servings ? String(r.servings) : '',
    ingredientsText: (r.ingredients || []).map(i => i.displayText || i.name).join('\n'),
    stepsText: (r.steps || []).map(s => s.step).join('\n'),
  };
}

export default function CustomRecipesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = useColors();
  const [recipes, setRecipes]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modalVisible, setModal]      = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecipes(await customRecipesAPI.getAll());
    } catch (e) {
      Alert.alert('Error', 'Could not load recipes: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (r) => { setEditingId(r._id); setForm(toFormValues(r)); setModal(true); };
  const closeModal = () => { setModal(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.title.trim()) return Alert.alert('Error', 'Recipe title is required.');
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      cuisine: form.cuisine.trim(),
      readyInMinutes: form.readyInMinutes ? parseInt(form.readyInMinutes, 10) : null,
      servings: form.servings ? parseInt(form.servings, 10) : 4,
      ingredients: parseIngredients(form.ingredientsText),
      steps: parseSteps(form.stepsText),
    };
    try {
      if (editingId) {
        const updated = await customRecipesAPI.update(editingId, payload);
        setRecipes(prev => prev.map(r => r._id === editingId ? updated : r));
      } else {
        const created = await customRecipesAPI.create(payload);
        setRecipes(prev => [created, ...prev]);
      }
      closeModal();
    } catch (e) {
      Alert.alert('Error', 'Could not save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await customRecipesAPI.remove(id);
            setRecipes(prev => prev.filter(r => r._id !== id));
          } catch (_e) {
            Alert.alert('Error', 'Could not delete recipe.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const badge = CuisineBadge[item.cuisine] || { bg: theme.primaryLight, text: theme.primary };
    const recipe = {
      id: item._id, title: item.title, image: item.image || null,
      readyInMinutes: item.readyInMinutes, servings: item.servings,
      cuisine: item.cuisine, diets: item.diets || [],
      sourceUrl: null, ingredients: item.ingredients || [], steps: item.steps || [],
    };
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('RecipeDetail', { recipe })}
        activeOpacity={0.8}
      >
        <View style={[styles.cardAccent, { backgroundColor: badge.bg }]}>
          <Text style={[styles.cardLetter, { color: badge.text }]}>
            {item.title.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            {item.cuisine ? (
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.text }]}>{item.cuisine}</Text>
              </View>
            ) : null}
            {item.readyInMinutes ? (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.readyInMinutes} min</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => openEdit(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.editIcon, { color: colors.textSecondary }]}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item._id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.deleteIcon, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>My Recipes</Text>
        <TouchableOpacity
          onPress={openAdd}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.addIcon, { color: theme.primary }]}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No recipes yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Tap + to add your own recipe</Text>
          <TouchableOpacity style={[styles.addCta, { backgroundColor: theme.primary }]} onPress={openAdd}>
            <Text style={styles.addCtaText}>Add Recipe</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add / Edit modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modal, { backgroundColor: colors.background, paddingTop: insets.top }]}
        >
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={closeModal} disabled={saving}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{editingId ? 'Edit Recipe' : 'New Recipe'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={theme.primary} />
                : <Text style={[styles.saveText, { color: theme.primary }]}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title *</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. Mum's Biryani"
              placeholderTextColor={colors.textSecondary}
              value={form.title}
              onChangeText={v => setField('title', v)}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Cuisine</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. Pakistani"
              placeholderTextColor={colors.textSecondary}
              value={form.cuisine}
              onChangeText={v => setField('cuisine', v)}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Time (min)</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="30"
                  placeholderTextColor={colors.textSecondary}
                  value={form.readyInMinutes}
                  onChangeText={v => setField('readyInMinutes', v)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Servings</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="4"
                  placeholderTextColor={colors.textSecondary}
                  value={form.servings}
                  onChangeText={v => setField('servings', v)}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Ingredients</Text>
            <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>One per line — e.g. "2 cups rice"</Text>
            <TextInput
              style={[styles.fieldInput, styles.multiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={'2 cups basmati rice\n500g chicken\n1 tsp cumin'}
              placeholderTextColor={colors.textSecondary}
              value={form.ingredientsText}
              onChangeText={v => setField('ingredientsText', v)}
              multiline
              textAlignVertical="top"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Instructions</Text>
            <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>One step per line</Text>
            <TextInput
              style={[styles.fieldInput, styles.multiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={'Wash the rice and soak for 30 minutes.\nFry onions until golden.\nAdd chicken and spices.'}
              placeholderTextColor={colors.textSecondary}
              value={form.stepsText}
              onChangeText={v => setField('stepsText', v)}
              multiline
              textAlignVertical="top"
            />

            <View style={{ height: 48 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36 },
  backIcon: { fontSize: 28, fontWeight: '300', lineHeight: 32 },
  topTitle: { ...Typography.heading2 },
  addIcon: { fontSize: 28, fontWeight: '300', lineHeight: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { ...Typography.heading2, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
  addCta: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addCtaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { padding: Spacing.md, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    borderRadius: 16, borderWidth: 1,
    marginBottom: 12, overflow: 'hidden', alignItems: 'center',
  },
  cardAccent: { width: 64, height: 80, alignItems: 'center', justifyContent: 'center' },
  cardLetter: { fontSize: 28, fontWeight: '700' },
  cardBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 12 },
  cardActions: { flexDirection: 'column', paddingRight: 14, gap: 12 },
  editIcon: { fontSize: 18 },
  deleteIcon: { fontSize: 16 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  cancelText: { fontSize: 15, width: 64 },
  modalTitle: { fontSize: 16, fontWeight: '600' },
  saveText: { fontSize: 15, fontWeight: '700', width: 64, textAlign: 'right' },
  modalBody: { padding: Spacing.md },
  fieldLabel: {
    fontSize: 13, fontWeight: '600',
    marginBottom: 6, marginTop: 18, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  fieldHint: { fontSize: 12, marginBottom: 6, marginTop: -4 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15,
  },
  multiline: { minHeight: 120, paddingTop: 12 },
  row: { flexDirection: 'row', marginTop: 0 },
});

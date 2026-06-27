import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, CuisineBadge } from '../constants/theme';
import { useTheme, useColors } from '../context/ThemeContext';
import { favouritesAPI } from '../api/backend';

export default function FavouritesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = useColors();
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await favouritesAPI.getAll();
      setFavourites(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load favourites: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (id) => {
    try {
      await favouritesAPI.remove(id);
      setFavourites(prev => prev.filter(f => f._id !== id));
    } catch (_e) {
      Alert.alert('Error', 'Could not remove favourite.');
    }
  };

  const renderItem = ({ item }) => {
    const recipe = item.recipe;
    const badge = CuisineBadge[recipe.cuisine] || { bg: theme.primaryLight, text: theme.primary };
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('RecipeDetail', { recipe })}
        activeOpacity={0.8}
      >
        {recipe.image
          ? <Image source={{ uri: recipe.image }} style={styles.thumb} />
          : (
            <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: badge.bg }]}>
              <Text style={[styles.thumbText, { color: badge.text }]} numberOfLines={3}>
                {recipe.title}
              </Text>
            </View>
          )
        }
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>{recipe.title}</Text>
          {recipe.cuisine ? (
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>{recipe.cuisine}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(item._id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.removeIcon, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Favourites</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : favourites.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>♡</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No favourites yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Tap the heart on any recipe to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={favourites}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { ...Typography.heading2, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  list: { padding: Spacing.md, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    borderRadius: 16, borderWidth: 1,
    marginBottom: 12, overflow: 'hidden', alignItems: 'center',
  },
  thumb: { width: 80, height: 80 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  thumbText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  cardBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  removeBtn: { paddingRight: 16, paddingLeft: 8 },
  removeIcon: { fontSize: 16 },
});

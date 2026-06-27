import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '../constants/theme';
import { useTheme, useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/backend';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors    = useColors();
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Error', 'Please enter your email and password.');
    }
    if (password !== confirm) {
      return Alert.alert('Error', 'Passwords do not match.');
    }
    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters.');
    }
    setLoading(true);
    try {
      const data = await authAPI.register(email.trim().toLowerCase(), password);
      await login(data);
    } catch (e) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: colors.textPrimary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>Create Account</Text>
          <View style={{ width: 36 }} />
        </View>

        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Join MealPlanner</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Sync your meals across all devices</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Min. 6 characters"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Confirm Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Repeat your password"
            placeholderTextColor={colors.textSecondary}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.primary }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create Account</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchLink}>
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
            <Text style={[styles.switchAction, { color: theme.primary }]}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 16, marginBottom: 24,
  },
  backBtn: { width: 36 },
  backIcon: { fontSize: 28, fontWeight: '300', lineHeight: 32 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  pageSubtitle: { fontSize: 14, marginBottom: 28 },
  card: {
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 13, fontWeight: '600',
    marginBottom: 6, marginTop: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15,
  },
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  switchLink: { alignItems: 'center', paddingVertical: 8 },
  switchText: { fontSize: 14 },
  switchAction: { fontWeight: '600' },
});

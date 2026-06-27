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

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors    = useColors();
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Error', 'Please enter your email and password.');
    }
    setLoading(true);
    try {
      const data = await authAPI.login(email.trim().toLowerCase(), password);
      await login(data);
    } catch (e) {
      Alert.alert('Sign In Failed', e.message);
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
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={[styles.appName, { color: theme.primary }]}>MealPlanner</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Sign in to sync across devices</Text>
        </View>

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
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchLink}>
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
            <Text style={[styles.switchAction, { color: theme.primary }]}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  logoArea: { alignItems: 'center', paddingTop: 32, paddingBottom: 36 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoLetter: { color: '#fff', fontSize: 32, fontWeight: '800' },
  appName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  tagline: { fontSize: 14 },
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

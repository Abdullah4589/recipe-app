import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/backend';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
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
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Back header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>Create Account</Text>
          <View style={{ width: 36 }} />
        </View>

        <Text style={styles.pageTitle}>Join MealPlanner</Text>
        <Text style={styles.pageSubtitle}>Sync your meals across all devices</Text>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 6 characters"
            placeholderTextColor={Colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <Text style={styles.fieldLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat your password"
            placeholderTextColor={Colors.textSecondary}
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
          <Text style={styles.switchText}>
            Already have an account?{' '}
            <Text style={[styles.switchAction, { color: theme.primary }]}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 16, marginBottom: 24,
  },
  backBtn: { width: 36 },
  backIcon: { fontSize: 28, color: Colors.textPrimary, fontWeight: '300', lineHeight: 32 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  pageTitle: {
    fontSize: 28, fontWeight: '800', color: Colors.textPrimary,
    letterSpacing: -0.5, marginBottom: 8,
  },
  pageSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 28 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textSecondary,
    marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary,
  },
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  switchLink: { alignItems: 'center', paddingVertical: 8 },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchAction: { fontWeight: '600' },
});

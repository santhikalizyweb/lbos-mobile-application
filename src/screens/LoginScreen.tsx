import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountType, useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';
import { Button, Field } from '../components/ui';
import { colors, radius, space } from '../theme';

const TYPES: { value: AccountType; label: string; hint: string }[] = [
  { value: 'admin', label: 'Admin', hint: 'Full access to OMS, Partnership and Website admin.' },
  { value: 'employee', label: 'Employee', hint: 'Your orders, leads, tasks and reminders.' },
  { value: 'partner', label: 'Partner', hint: 'Partner portal: earnings and work assigned to you.' },
];

export default function LoginScreen() {
  const { signIn, serverUrl, notice } = useAuth();
  const [server, setServer] = useState(serverUrl);
  const [accountType, setAccountType] = useState<AccountType>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showServer, setShowServer] = useState(!serverUrl);

  const submit = async () => {
    if (!server.trim()) {
      setShowServer(true);
      setError('Enter the server address.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(server, accountType, email, password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.brand}>
            <View style={s.logo}>
              <Text style={s.logoText}>L</Text>
            </View>
            <Text style={s.appName}>LBOS</Text>
            <Text style={s.tagline}>Lizy Business Operating System</Text>
          </View>

          <View style={s.card}>
            <Text style={s.heading}>Sign in</Text>

            <View style={s.segment}>
              {TYPES.map(t => (
                <Pressable
                  key={t.value}
                  onPress={() => setAccountType(t.value)}
                  style={[s.segmentItem, accountType === t.value && s.segmentActive]}>
                  <Text style={[s.segmentText, accountType === t.value && s.segmentTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.hint}>{TYPES.find(t => t.value === accountType)?.hint}</Text>

            {notice ? <Text style={s.notice}>{notice}</Text> : null}

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@company.com"
            />
            <View>
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="••••••••"
                onSubmitEditing={submit}
                returnKeyType="go"
              />
              <Pressable style={s.eye} onPress={() => setShowPassword(v => !v)} hitSlop={10}>
                <Text style={s.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>

            {showServer ? (
              <Field
                label="Server address"
                value={server}
                onChangeText={setServer}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="https://api.example.com or 192.168.1.10:8000"
              />
            ) : (
              <Pressable onPress={() => setShowServer(true)} style={s.serverRow}>
                <Text style={s.serverText} numberOfLines={1}>
                  Server: {server}
                </Text>
                <Text style={s.serverChange}>Change</Text>
              </Pressable>
            )}

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Button title="Sign in" onPress={submit} loading={busy} style={{ marginTop: space.sm }} />
          </View>
          <Text style={s.footer}>One sign-in for OMS, Partnership and Website admin.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { flexGrow: 1, justifyContent: 'center', padding: space.xl },
  brand: { alignItems: 'center', marginBottom: space.xl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  logoText: { fontSize: 34, fontWeight: '900', color: colors.primary },
  appName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  tagline: { fontSize: 13, color: '#E0E7FF', marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.xl },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: space.lg },
  segment: { flexDirection: 'row', backgroundColor: colors.neutralSoft, borderRadius: radius.sm, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: colors.card, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  segmentTextActive: { color: colors.primary, fontWeight: '800' },
  hint: { fontSize: 12, color: colors.muted, marginTop: space.sm, marginBottom: space.lg },
  notice: { backgroundColor: colors.warningSoft, color: colors.warning, padding: space.md, borderRadius: radius.sm, marginBottom: space.md, fontSize: 13 },
  eye: { position: 'absolute', right: 12, top: 36 },
  eyeText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  serverRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  serverText: { flex: 1, fontSize: 12, color: colors.muted },
  serverChange: { fontSize: 12, color: colors.primary, fontWeight: '700', marginLeft: space.sm },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: space.md, borderRadius: radius.sm, marginBottom: space.md, fontSize: 13 },
  footer: { textAlign: 'center', color: '#E0E7FF', fontSize: 12, marginTop: space.lg },
});

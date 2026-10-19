import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, space, statusTone, tone } from '../theme';
import { label as toLabel } from '../utils/format';

// ---------------------------------------------------------------- layout

export function Screen({
  children,
  refreshing,
  onRefresh,
  contentStyle,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        ) : undefined
      }>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: colors.border }}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Title({ children, style, numberOfLines }: { children: React.ReactNode; style?: any; numberOfLines?: number }) {
  return (
    <Text style={[styles.title, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Body({ children, style, numberOfLines }: { children: React.ReactNode; style?: any; numberOfLines?: number }) {
  return (
    <Text style={[styles.body, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }: { children: React.ReactNode; style?: any; numberOfLines?: number }) {
  return (
    <Text style={[styles.muted, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

// ---------------------------------------------------------------- data display

export function Badge({ status, text, color }: { status?: string | null; text?: string; color?: string | null }) {
  if (color) {
    return (
      <View style={[styles.badge, { backgroundColor: color + '22' }]}>
        <Text style={[styles.badgeText, { color }]}>{text ?? toLabel(status)}</Text>
      </View>
    );
  }
  const t = tone(statusTone(status));
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{text ?? toLabel(status)}</Text>
    </View>
  );
}

export function KeyValue({ k, v, onPress }: { k: string; v?: React.ReactNode; onPress?: () => void }) {
  const empty = v === undefined || v === null || v === '';
  return (
    <View style={styles.kv}>
      <Text style={styles.kvKey}>{k}</Text>
      {typeof v === 'string' || typeof v === 'number' || empty ? (
        <Text style={[styles.kvValue, onPress && styles.link]} onPress={onPress} selectable>
          {empty ? '—' : v}
        </Text>
      ) : (
        <View style={styles.kvValueBox}>{v}</View>
      )}
    </View>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = colors.primary,
  onPress,
  active,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
  onPress?: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.stat,
        { borderLeftColor: accent },
        active && { backgroundColor: colors.primarySoft, borderColor: colors.primary },
        pressed && styles.pressed,
      ]}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? (
        <Text style={styles.statSub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.statGrid}>{children}</View>;
}

export function Avatar({ text, size = 40 }: { text: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{text}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- states

export function Loading({ text }: { text?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {text ? <Muted style={{ marginTop: space.md }}>{text}</Muted> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.stateIcon}>⚠️</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: space.lg }} /> : null}
    </View>
  );
}

export function Empty({ text = 'Nothing here yet.', icon = '📭' }: { text?: string; icon?: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.stateIcon}>{icon}</Text>
      <Text style={styles.stateText}>{text}</Text>
    </View>
  );
}

export function ListFooter({ loading }: { loading: boolean }) {
  return loading ? <ActivityIndicator style={{ marginVertical: space.lg }} color={colors.primary} /> : <View style={{ height: space.xl }} />;
}

// ---------------------------------------------------------------- inputs

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  small,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && { opacity: 0.55 },
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: v.fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const buttonVariants = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
  secondary: { bg: colors.card, fg: colors.primary, border: colors.primary },
  danger: { bg: colors.danger, fg: '#fff', border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
};

export function Field({ label, error, style, ...props }: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        style={[styles.input, props.multiline && styles.inputMultiline, error && { borderColor: colors.danger }, style]}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function SearchBar(props: TextInputProps) {
  return (
    <View style={styles.searchWrap}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        placeholderTextColor={colors.faint}
        style={styles.searchInput}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
        {...props}
      />
    </View>
  );
}

export function Chip({ text, selected, onPress, count }: { text: string; selected?: boolean; onPress: () => void; count?: number }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {text}
        {count !== undefined ? `  ${count}` : ''}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.chipRowWrap}>
      {children}
    </ScrollView>
  );
}

export type Option = { value: string; label: string; color?: string | null };

/** Bottom sheet listing options; used for status pickers. */
export function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: Option[];
  selected?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView style={{ maxHeight: 420 }}>
          {options.map(o => (
            <Pressable
              key={o.value}
              onPress={() => onSelect(o.value)}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
              {o.color ? <View style={[styles.optionDot, { backgroundColor: o.color }]} /> : null}
              <Text style={[styles.optionText, o.value === selected && styles.optionSelected]}>{o.label}</Text>
              {o.value === selected ? <Text style={styles.optionCheck}>✓</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Bottom sheet holding a small form. */
export function FormSheet({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Fab({ onPress, label = '+' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}>
      <Text style={styles.fabText}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------- contact helpers

export function call(phone?: string | null) {
  if (phone) {
    Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => {});
  }
}

export function whatsapp(phone?: string | null) {
  if (!phone) {
    return;
  }
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  Linking.openURL(`https://wa.me/${digits}`).catch(() => {});
}

export function ContactActions({ phone, email }: { phone?: string | null; email?: string | null }) {
  if (!phone && !email) {
    return null;
  }
  return (
    <Row style={{ gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' }}>
      {phone ? <Button small variant="secondary" title="📞 Call" onPress={() => call(phone)} /> : null}
      {phone ? <Button small variant="secondary" title="💬 WhatsApp" onPress={() => whatsapp(phone)} /> : null}
      {email ? (
        <Button small variant="secondary" title="✉️ Email" onPress={() => Linking.openURL(`mailto:${email}`).catch(() => {})} />
      ) : null}
    </Row>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: space.lg, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.75 },
  row: { flexDirection: 'row', alignItems: 'center' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md, marginBottom: space.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  muted: { fontSize: 13, color: colors.muted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space.md },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  kv: { flexDirection: 'row', paddingVertical: 6, alignItems: 'flex-start' },
  kvKey: { width: 120, fontSize: 13, color: colors.muted },
  kvValue: { flex: 1, fontSize: 14, color: colors.text },
  kvValueBox: { flex: 1, alignItems: 'flex-start' },
  stat: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.md,
    borderLeftWidth: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  statValue: { fontSize: 22, color: colors.text, fontWeight: '800', marginTop: 4 },
  statSub: { fontSize: 11, color: colors.faint, marginTop: 2 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  avatar: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.bg },
  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: space.xl, marginTop: space.xl },
  stateIcon: { fontSize: 36, marginBottom: space.sm },
  stateText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  button: {
    minHeight: 46,
    borderRadius: radius.sm,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  buttonSmall: { minHeight: 34, paddingHorizontal: space.md },
  buttonText: { fontSize: 15, fontWeight: '700' },
  buttonTextSmall: { fontSize: 13 },
  field: { marginBottom: space.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  fieldError: { fontSize: 12, color: colors.danger, marginTop: 4 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: colors.text,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    marginHorizontal: space.lg,
    marginTop: space.md,
  },
  searchIcon: { fontSize: 14, marginRight: space.sm },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: Platform.OS === 'ios' ? 10 : 6 },
  chipRowWrap: { flexGrow: 0 },
  chipRow: { paddingHorizontal: space.lg, paddingVertical: space.sm, gap: space.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: space.md },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: space.md },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  optionDot: { width: 10, height: 10, borderRadius: 5, marginRight: space.md },
  optionText: { flex: 1, fontSize: 15, color: colors.text },
  optionSelected: { color: colors.primary, fontWeight: '700' },
  optionCheck: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  fab: {
    position: 'absolute',
    right: space.xl,
    bottom: space.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '500', marginTop: -2 },
  listContent: { padding: space.lg, paddingTop: space.sm },
});

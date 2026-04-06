import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../../theme';
import { RootStackParamList } from '../../types';
import { useExposeStore } from '../../store/useExposeStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LeadStep1Screen() {
  const navigation = useNavigation<Nav>();
  const { leadData, updateLeadData } = useExposeStore();

  const [name, setName] = useState(leadData.name ?? '');
  const [email, setEmail] = useState(leadData.email ?? '');
  const [mobile, setMobile] = useState(leadData.mobile ?? '');
  const [company, setCompany] = useState(leadData.company ?? '');

  function next() {
    if (!name.trim() || !email.trim() || !mobile.trim()) {
      Alert.alert('Required fields', 'Please fill in your name, email and mobile number.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    updateLeadData({ name: name.trim(), email: email.trim(), mobile: mobile.trim(), company: company.trim() });
    navigation.navigate('LeadStep2');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.progress}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={[styles.progressDot, s === 1 && styles.progressDotActive]} />
            ))}
          </View>
          <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
          <Text style={styles.title}>Your Contact{'\n'}Details</Text>
          <Text style={styles.subtitle}>We'll use these to get back to you about your review.</Text>

          <Field label="FULL NAME *" value={name} onChange={setName} placeholder="Jane Smith" />
          <Field label="EMAIL ADDRESS *" value={email} onChange={setEmail} placeholder="jane@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="MOBILE NUMBER *" value={mobile} onChange={setMobile} placeholder="+44 7700 900123" keyboardType="phone-pad" />
          <Field label="COMPANY NAME (OPTIONAL)" value={company} onChange={setCompany} placeholder="Smith Ltd" />

          <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>CONTINUE</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.black} />
          </TouchableOpacity>

          <Text style={styles.privacy}>
            Your details are protected under our Privacy Policy. We will never share your information without consent.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType = 'default', autoCapitalize = 'words',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={fStyles.label}>{label}</Text>
      <TextInput
        style={fStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  label: { fontSize: typography.xs, color: colors.textDim, letterSpacing: 1.2, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.base,
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.black },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.page, paddingBottom: spacing.xxxl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md, marginBottom: spacing.xl },
  backText: { fontSize: typography.sm, color: colors.text },
  progress: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  progressDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: colors.surface3 },
  progressDotActive: { backgroundColor: colors.accent },
  stepLabel: { fontSize: typography.xs, color: colors.accent, fontWeight: typography.semibold, letterSpacing: 1, marginBottom: spacing.sm },
  title: { fontSize: typography.xxl, fontWeight: typography.black, color: colors.text, lineHeight: 34, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.sm, color: colors.textMuted, marginBottom: spacing.xl },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: spacing.lg, marginTop: spacing.lg,
  },
  nextBtnText: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.black, letterSpacing: 1 },
  privacy: { fontSize: typography.xs, color: colors.textDim, textAlign: 'center', marginTop: spacing.md, lineHeight: 16 },
});

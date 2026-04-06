import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../../theme';
import { RootStackParamList } from '../../types';
import { useExposeStore } from '../../store/useExposeStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function generateRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'VE-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function LeadStep3Screen() {
  const navigation = useNavigation<Nav>();
  const { updateLeadData } = useExposeStore();

  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!consent) {
      Alert.alert('Consent required', 'Please agree to be contacted regarding your review.');
      return;
    }
    setSubmitting(true);
    const refNumber = generateRef();
    updateLeadData({ consent, marketingConsent: marketing, refNumber });
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    navigation.replace('LeadSuccess');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.progress}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.progressDot, styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>STEP 3 OF 3</Text>
        <Text style={styles.title}>Almost{'\n'}There</Text>
        <Text style={styles.subtitle}>Confirm your consent and we'll begin your free review.</Text>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>WHAT HAPPENS NEXT</Text>
          {[
            { n: '01', text: 'A specialist reviews your analysis within 24 hours' },
            { n: '02', text: 'We contact you to discuss your specific agreement' },
            { n: '03', text: 'If you have a valid claim, we proceed on a no-win, no-fee basis' },
          ].map((step) => (
            <View key={step.n} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.n}</Text>
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.consentCard}>
          <TouchableOpacity style={styles.checkRow} onPress={() => setConsent((v) => !v)} activeOpacity={0.7}>
            <View style={[styles.checkbox, consent && styles.checkboxActive]}>
              {consent && <Ionicons name="checkmark" size={14} color={colors.black} />}
            </View>
            <Text style={styles.checkLabel}>
              I agree to be contacted by Veltro or their appointed advisers regarding a review of my finance agreement. *
            </Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.checkRow} onPress={() => setMarketing((v) => !v)} activeOpacity={0.7}>
            <View style={[styles.checkbox, marketing && styles.checkboxActive]}>
              {marketing && <Ionicons name="checkmark" size={14} color={colors.black} />}
            </View>
            <Text style={styles.checkLabel}>
              I'd like to receive updates on finance claim developments from Veltro. (Optional)
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legalNote}>
          By submitting, you agree to our Terms of Service and Privacy Policy. Claims are handled by FCA-authorised partner firms.
        </Text>

        <TouchableOpacity
          style={[styles.submitBtn, (!consent || submitting) && styles.submitBtnDisabled]}
          onPress={submit}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'SUBMITTING...' : 'SUBMIT FOR REVIEW'}
          </Text>
          {!submitting && <Ionicons name="arrow-forward" size={16} color={colors.black} />}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  stepsCard: { backgroundColor: colors.surface2, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  stepsTitle: { fontSize: typography.xs, color: colors.textDim, letterSpacing: 1.2, marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: typography.xs, color: colors.accent, fontWeight: typography.bold },
  stepText: { flex: 1, fontSize: typography.sm, color: colors.textMuted, lineHeight: 18 },
  consentCard: { backgroundColor: colors.surface2, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkLabel: { flex: 1, fontSize: typography.sm, color: colors.textMuted, lineHeight: 18 },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  legalNote: { fontSize: typography.xs, color: colors.textDim, lineHeight: 16, marginBottom: spacing.lg },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.lg,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.black, letterSpacing: 1 },
});

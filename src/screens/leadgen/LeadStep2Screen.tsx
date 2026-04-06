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
import { AgreementType, RootStackParamList } from '../../types';
import { useExposeStore } from '../../store/useExposeStore';
import AgreementTypeSelector from '../../components/AgreementTypeSelector';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LeadStep2Screen() {
  const navigation = useNavigation<Nav>();
  const { leadData, updateLeadData } = useExposeStore();

  const [lender, setLender] = useState(leadData.lenderName ?? '');
  const [agrType, setAgrType] = useState<AgreementType>(
    (leadData.agreementType as AgreementType) || 'business_loan',
  );
  const [value, setValue] = useState(leadData.agreementValue ?? '');
  const [date, setDate] = useState(leadData.agreementDate ?? '');

  function next() {
    if (!lender.trim()) {
      Alert.alert('Required', 'Please enter the lender / broker name.');
      return;
    }
    updateLeadData({
      lenderName: lender.trim(),
      agreementType: agrType,
      agreementValue: value.trim(),
      agreementDate: date.trim(),
    });
    navigation.navigate('LeadStep3');
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
              <View key={s} style={[styles.progressDot, s <= 2 && styles.progressDotActive]} />
            ))}
          </View>
          <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
          <Text style={styles.title}>Agreement{'\n'}Details</Text>
          <Text style={styles.subtitle}>Tell us about the finance agreement you want reviewed.</Text>

          <Text style={styles.label}>AGREEMENT TYPE</Text>
          <AgreementTypeSelector selected={agrType} onSelect={setAgrType} />

          <View style={{ marginTop: spacing.md }} />
          <Text style={styles.label}>LENDER / BROKER NAME *</Text>
          <TextInput
            style={styles.input}
            value={lender}
            onChangeText={setLender}
            placeholder="e.g. Close Brothers, Nucleus"
            placeholderTextColor={colors.textDim}
          />

          <Text style={styles.label}>AGREEMENT VALUE (OPTIONAL)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencySign}>£</Text>
            <TextInput
              style={styles.inputInner}
              value={value}
              onChangeText={setValue}
              placeholder="85000"
              placeholderTextColor={colors.textDim}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.label}>AGREEMENT DATE (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="e.g. March 2022"
            placeholderTextColor={colors.textDim}
          />

          <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>CONTINUE</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.black} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  label: { fontSize: typography.xs, color: colors.textDim, letterSpacing: 1.2, marginBottom: spacing.xs, marginTop: spacing.md },
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  currencySign: { fontSize: typography.md, color: colors.textMuted, marginRight: spacing.xs },
  inputInner: { flex: 1, fontSize: typography.base, color: colors.text, paddingVertical: spacing.md },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: spacing.lg, marginTop: spacing.xl,
  },
  nextBtnText: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.black, letterSpacing: 1 },
});

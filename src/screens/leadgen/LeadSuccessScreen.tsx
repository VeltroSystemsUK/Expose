import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../../theme';
import { RootStackParamList } from '../../types';
import { useExposeStore } from '../../store/useExposeStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LeadSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const { leadData, resetLead } = useExposeStore();

  function goHome() {
    resetLead();
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconRing}>
            <Ionicons name="checkmark" size={40} color={colors.accent} />
          </View>
        </View>

        <Text style={styles.title}>Review{'\n'}Submitted</Text>
        <Text style={styles.subtitle}>
          Thank you {leadData.name?.split(' ')[0] ?? ''}. We've received your details and will be in touch within 24 hours.
        </Text>

        {/* Ref number */}
        {leadData.refNumber && (
          <View style={styles.refCard}>
            <Text style={styles.refLabel}>YOUR REFERENCE NUMBER</Text>
            <Text style={styles.refNumber}>{leadData.refNumber}</Text>
            <Text style={styles.refNote}>Quote this if you contact us</Text>
          </View>
        )}

        {/* Next steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>WHAT HAPPENS NEXT</Text>
          {[
            { icon: 'mail-outline' as const, title: 'Confirmation email', desc: `Sent to ${leadData.email ?? 'your email'}` },
            { icon: 'call-outline' as const, title: 'Specialist review', desc: 'Within 24 working hours' },
            { icon: 'document-text-outline' as const, title: 'Assessment report', desc: 'We\'ll outline your options clearly' },
            { icon: 'cash-outline' as const, title: 'No-win, no-fee', desc: 'You only pay if your claim succeeds' },
          ].map((item, i) => (
            <View key={i} style={styles.nextRow}>
              <View style={styles.nextIcon}>
                <Ionicons name={item.icon} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextTitle}>{item.title}</Text>
                <Text style={styles.nextDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={goHome} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={18} color={colors.black} />
          <Text style={styles.homeBtnText}>BACK TO HOME</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.black },
  content: { paddingHorizontal: spacing.page, paddingTop: spacing.xxxl, paddingBottom: spacing.xxxl, alignItems: 'center' },
  iconWrap: { marginBottom: spacing.xl },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: typography.xxl + 4, fontWeight: typography.black, color: colors.text, textAlign: 'center', lineHeight: 38, marginBottom: spacing.md },
  subtitle: { fontSize: typography.base, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  refCard: {
    width: '100%',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  refLabel: { fontSize: typography.xs, color: colors.accent, letterSpacing: 1.2, marginBottom: spacing.sm },
  refNumber: { fontSize: typography.xl, fontWeight: typography.black, color: colors.accent, letterSpacing: 2 },
  refNote: { fontSize: typography.xs, color: colors.textMuted, marginTop: spacing.xs },
  stepsCard: {
    width: '100%',
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  stepsTitle: { fontSize: typography.xs, color: colors.textDim, letterSpacing: 1.2, marginBottom: spacing.md },
  nextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextTitle: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.text },
  nextDesc: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  homeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
  },
  homeBtnText: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.black, letterSpacing: 1 },
});

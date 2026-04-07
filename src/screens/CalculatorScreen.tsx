import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, radius, typography } from '../theme';
import { DisclosureStatus, LenderProfile, RootStackParamList, ClaimStrength } from '../types';
import { useExposeStore } from '../store/useExposeStore';
import { calculate } from '../services/calculator';
import AgreementTypeSelector from '../components/AgreementTypeSelector';
import LenderPicker from '../components/LenderPicker';
import { getLenderById } from '../data/lenders';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── External links ──────────────────────────────────────────────────────────

const LINKS = {
  trustpilot: (name: string, slug?: string) =>
    slug
      ? `https://uk.trustpilot.com/review/${slug}`
      : `https://www.trustpilot.com/search?query=${encodeURIComponent(name)}`,
  feefo: (name: string, slug?: string) =>
    slug
      ? `https://www.feefo.com/en-GB/reviews/${slug}`
      : `https://www.feefo.com/en-GB/search?q=${encodeURIComponent(name)}`,
  fos: 'https://www.financial-ombudsman.org.uk/contact-us/complain-online',
  fca: 'https://www.fca.org.uk/consumers/report-information-about-a-firm',
};

async function openLink(url: string) {
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
    else Alert.alert('Unable to open link', url);
  } catch {
    Alert.alert('Unable to open link', url);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DISCLOSURE_OPTIONS: { key: DisclosureStatus; label: string }[] = [
  { key: 'none', label: 'No / Unclear' },
  { key: 'partial', label: 'Partial' },
  { key: 'full', label: 'Yes, fully' },
];

function fmt(n: number) {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
}
function fmtAPR(n: number) {
  return `${n.toFixed(1)}%`;
}

const STRENGTH_CONFIG: Record<ClaimStrength, { label: string; color: string; bg: string; icon: string }> = {
  none:     { label: 'No Claim Basis',     color: colors.textMuted, bg: colors.surface3,   icon: 'remove-circle-outline' },
  possible: { label: 'Possible Claim',     color: colors.amber,     bg: colors.amberSoft,  icon: 'alert-circle-outline' },
  probable: { label: 'Probable Claim',     color: colors.amber,     bg: colors.amberSoft,  icon: 'warning-outline' },
  strong:   { label: 'Strong Grounds',     color: colors.danger,    bg: 'rgba(232,64,42,0.12)', icon: 'warning' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return <Text style={sStyles.label}>{children}</Text>;
}
const sStyles = StyleSheet.create({
  label: {
    fontSize: typography.xs,
    color: colors.textDim,
    fontWeight: typography.semibold,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
});

function ResultRow({
  label, value, valueColor, sub,
}: { label: string; value: string; valueColor?: string; sub?: string }) {
  return (
    <View style={rrStyles.row}>
      <Text style={rrStyles.label}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[rrStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
        {sub && <Text style={rrStyles.sub}>{sub}</Text>}
      </View>
    </View>
  );
}
const rrStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  label: { fontSize: typography.sm, color: colors.textMuted, flex: 1, marginRight: spacing.sm },
  value: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.text },
  sub: { fontSize: typography.xs, color: colors.textDim, marginTop: 1 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CalculatorScreen() {
  const navigation = useNavigation<Nav>();
  const { calcInput, setCalcInput, calcResult, setCalcResult, brokerInvolved, setBrokerInvolved } = useExposeStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  // Form state
  const [selectedLender, setSelectedLender] = useState<LenderProfile | null>(
    calcInput.lenderId ? (getLenderById(calcInput.lenderId) ?? null) : null,
  );
  const [brokerName, setBrokerName] = useState(calcInput.brokerName ?? '');
  const [borrowed, setBorrowed] = useState(calcInput.amountBorrowed > 0 ? String(calcInput.amountBorrowed) : '');
  const [monthly, setMonthly] = useState(calcInput.monthlyPayment > 0 ? String(calcInput.monthlyPayment) : '');
  const [term, setTerm] = useState(calcInput.termMonths > 0 ? String(calcInput.termMonths) : '');
  const [quotedRate, setQuotedRate] = useState(
    calcInput.quotedRate != null ? String(calcInput.quotedRate) : '',
  );
  const [disclosure, setDisclosure] = useState<DisclosureStatus>(calcInput.disclosureStatus);
  const [hasCalculated, setHasCalculated] = useState(!!calcResult);

  function recalculate() {
    const input = {
      ...calcInput,
      lenderId: selectedLender?.id ?? null,
      brokerName: brokerName.trim(),
      amountBorrowed: parseFloat(borrowed) || 0,
      monthlyPayment: parseFloat(monthly) || 0,
      termMonths: parseInt(term, 10) || 0,
      quotedRate: quotedRate.trim() ? parseFloat(quotedRate) : null,
      disclosureStatus: disclosure,
    };
    setCalcInput(input);
    const result = calculate(input);
    setCalcResult(result);
    setHasCalculated(true);
  }

  const result = calcResult;
  const validAPR = (result?.actualAPR ?? 0) > 0.1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MODE 02</Text>
          </View>
          <Text style={styles.title}>Commission{'\n'}Calculator</Text>
          <Text style={styles.subtitle}>
            {brokerInvolved ? 'Expose what the broker really earned' : 'Assess excessive lender charges'}
          </Text>

          {/* ── Broker involvement ── */}
          <View style={styles.brokerCard}>
            <View style={styles.brokerCardHeader}>
              <Ionicons name="person-outline" size={15} color={colors.accent} />
              <Text style={styles.brokerCardTitle}>Was a broker involved?</Text>
            </View>
            <Text style={styles.brokerCardDesc}>
              If a broker or introducer arranged this finance on your behalf, we can assess hidden commission.
              If you dealt directly with the lender, we'll focus on excessive charges instead.
            </Text>
            <View style={[styles.brokerOptions, isMobile && { flexDirection: 'column' }]}>
              <TouchableOpacity
                style={[styles.brokerOption, brokerInvolved && styles.brokerOptionYes, isMobile && { flex: 0 }]}
                onPress={() => setBrokerInvolved(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={brokerInvolved ? colors.black : colors.textDim}
                />
                <View>
                  <Text style={[styles.brokerOptionLabel, brokerInvolved && styles.brokerOptionLabelActive]}>
                    Yes — broker arranged it
                  </Text>
                  <Text style={[styles.brokerOptionSub, brokerInvolved && { color: colors.black }]}>
                    Hidden commission analysis
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.brokerOption, !brokerInvolved && styles.brokerOptionNo, isMobile && { flex: 0 }]}
                onPress={() => setBrokerInvolved(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={!brokerInvolved ? colors.black : colors.textDim}
                />
                <View>
                  <Text style={[styles.brokerOptionLabel, !brokerInvolved && styles.brokerOptionLabelActive]}>
                    No — direct with lender
                  </Text>
                  <Text style={[styles.brokerOptionSub, !brokerInvolved && { color: colors.black }]}>
                    Excessive charges analysis
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            {!brokerInvolved && (
              <View style={styles.brokerDirectNote}>
                <Ionicons name="information-circle" size={14} color={colors.amber} />
                <Text style={styles.brokerDirectNoteText}>
                  Direct lender mode: we will assess whether the lender's rate, fees and charges were
                  excessive or unfair — no broker commission analysis will be applied.
                </Text>
              </View>
            )}
          </View>

          {/* ── Agreement type ── */}
          <SectionLabel>AGREEMENT TYPE</SectionLabel>
          <AgreementTypeSelector
            selected={calcInput.agreementType}
            onSelect={(t) => { setCalcInput({ agreementType: t }); setSelectedLender(null); }}
          />

          {/* ── Lender ── */}
          <SectionLabel>LENDER</SectionLabel>
          <LenderPicker
            selected={selectedLender}
            agreementType={calcInput.agreementType}
            onSelect={setSelectedLender}
          />
          {selectedLender && (
            <View style={styles.lenderInfo}>
              <Ionicons name="information-circle-outline" size={13} color={colors.textDim} />
              <Text style={styles.lenderInfoText}>
                Typical rate {selectedLender.buyRateMin}–{selectedLender.buyRateMax}%
                {brokerInvolved ? ` · Max broker commission up to ${selectedLender.maxCommission}% of deal value` : ''}
                {selectedLender.fcaRef ? ` · FCA ${selectedLender.fcaRef}` : ''}
              </Text>
            </View>
          )}

          {/* ── Broker name ── */}
          {brokerInvolved && (
            <>
              <SectionLabel>BROKER / INTRODUCER NAME</SectionLabel>
              <TextInput
                style={styles.input}
                value={brokerName}
                onChangeText={setBrokerName}
                placeholder="e.g. Smith Commercial Finance Ltd"
                placeholderTextColor={colors.textDim}
              />
            </>
          )}

          {/* ── Deal figures ── */}
          <SectionLabel>AMOUNT BORROWED</SectionLabel>
          <View style={styles.inputRow}>
            <Text style={styles.currencySign}>£</Text>
            <TextInput
              style={styles.inputInner}
              value={borrowed}
              onChangeText={setBorrowed}
              placeholder="85000"
              placeholderTextColor={colors.textDim}
              keyboardType="numeric"
            />
          </View>

          <SectionLabel>MONTHLY PAYMENT</SectionLabel>
          <View style={styles.inputRow}>
            <Text style={styles.currencySign}>£</Text>
            <TextInput
              style={styles.inputInner}
              value={monthly}
              onChangeText={setMonthly}
              placeholder="2340"
              placeholderTextColor={colors.textDim}
              keyboardType="numeric"
            />
          </View>

          <SectionLabel>TERM</SectionLabel>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputInner, { flex: 1 }]}
              value={term}
              onChangeText={setTerm}
              placeholder="36"
              placeholderTextColor={colors.textDim}
              keyboardType="numeric"
            />
            <Text style={styles.unitLabel}>months</Text>
          </View>

          {/* ── The smoking gun ── */}
          <View style={styles.smokingGunCard}>
            <View style={styles.smokingGunHeader}>
              <Ionicons name="warning" size={16} color={colors.accent} />
              <Text style={styles.smokingGunTitle}>RATE QUOTED AT SALE</Text>
            </View>
            <Text style={styles.smokingGunDesc}>
              {brokerInvolved
                ? 'If the broker told you a specific interest rate or APR during the sales process, enter it here. A significant difference between this and your actual agreement rate is evidence of misrepresentation.'
                : 'If the lender quoted you a specific rate during the application process, enter it here. A significant discrepancy may indicate unfair or misleading pricing.'}
            </Text>
            <View style={[styles.inputRow, { marginTop: spacing.sm }]}>
              <TextInput
                style={[styles.inputInner, { flex: 1 }]}
                value={quotedRate}
                onChangeText={setQuotedRate}
                placeholder="Leave blank if not quoted"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
              />
              <Text style={styles.unitLabel}>% APR</Text>
            </View>
          </View>

          {/* ── Disclosure ── */}
          {brokerInvolved && (
            <>
              <SectionLabel>WAS BROKER COMMISSION DISCLOSED?</SectionLabel>
              <View style={styles.disclosureRow}>
                {DISCLOSURE_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.key}
                    style={[styles.disclosureBtn, disclosure === o.key && styles.disclosureBtnActive]}
                    onPress={() => setDisclosure(o.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.disclosureBtnText, disclosure === o.key && styles.disclosureBtnTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── Calculate ── */}
          <TouchableOpacity style={styles.calcBtn} onPress={recalculate} activeOpacity={0.85}>
            <Text style={styles.calcBtnText}>ANALYSE</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.black} />
          </TouchableOpacity>

          {/* ════════════════════════════════════════════════
              RESULTS
          ════════════════════════════════════════════════ */}
          {hasCalculated && result && (
            <>
              {/* Invalid inputs warning */}
              {!validAPR && (
                <View style={styles.warningCard}>
                  <Ionicons name="alert-circle" size={18} color={colors.amber} />
                  <Text style={styles.warningText}>
                    The total repaid (£{fmt(result.totalRepaid)}) is ≤ the amount borrowed — no interest found. Check your figures: enter the original loan amount, actual monthly payment, and full term in months.
                  </Text>
                </View>
              )}

              {/* ── Claim verdict ── */}
              {validAPR && (() => {
                const cfg = STRENGTH_CONFIG[result.claimStrength];
                return (
                  <View style={[styles.verdictCard, { borderColor: cfg.color + '50' }]}>
                    <View style={[styles.verdictBadge, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon as never} size={14} color={cfg.color} />
                      <Text style={[styles.verdictBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>

                    {/* Misrepresentation flag */}
                    {result.quotedRateMismatch && (
                      <View style={styles.mismatchAlert}>
                        <Ionicons name="warning" size={16} color={colors.danger} />
                        <Text style={styles.mismatchText}>
                          RATE MISMATCH DETECTED — broker quoted{' '}
                          {fmtAPR(calcInput.quotedRate ?? 0)} but your agreement shows{' '}
                          {fmtAPR(result.actualAPR)} — a {fmtAPR(result.rateDelta)} discrepancy.
                          This may constitute misrepresentation.
                        </Text>
                      </View>
                    )}

                    <Text style={styles.verdictSummary}>{result.claimSummary}</Text>
                  </View>
                );
              })()}

              {/* ── Repayment breakdown ── */}
              {validAPR && (
                <>
                  <Text style={styles.sectionTitle}>REPAYMENT BREAKDOWN</Text>
                  <View style={styles.resultCard}>
                    <Text style={styles.totalRepaid}>£{fmt(result.totalRepaid)}</Text>
                    <Text style={styles.totalRepaidSub}>
                      total repaid on £{fmt(calcInput.amountBorrowed)} borrowed
                    </Text>
                    <View style={styles.divider} />
                    <ResultRow label="Capital" value={`£${fmt(calcInput.amountBorrowed)}`} />
                    <ResultRow
                      label="Interest charged"
                      value={`£${fmt(result.totalInterest)}`}
                      valueColor={colors.danger}
                    />
                    <ResultRow
                      label="True APR on this agreement"
                      value={fmtAPR(result.actualAPR)}
                      sub={selectedLender ? `${selectedLender.name} typical buy rate: ${selectedLender.buyRateMin}–${selectedLender.buyRateMax}%` : undefined}
                    />
                    {calcInput.quotedRate != null && calcInput.quotedRate > 0 && (
                      <ResultRow
                        label="Rate you were quoted"
                        value={fmtAPR(calcInput.quotedRate)}
                        valueColor={result.quotedRateMismatch ? colors.danger : colors.green}
                        sub={result.quotedRateMismatch ? `${fmtAPR(result.rateDelta)} higher than quoted` : 'Matches agreement'}
                      />
                    )}
                  </View>
                </>
              )}

              {/* ── Commission analysis ── */}
              {validAPR && brokerInvolved && (
                <>
                  <Text style={styles.sectionTitle}>COMMISSION ANALYSIS</Text>
                  <View style={styles.resultCard}>
                    <View style={styles.spreadRow}>
                      <View style={styles.spreadItem}>
                        <Text style={styles.spreadLabel}>
                          {selectedLender ? 'Lender buy rate (min)' : 'Est. market buy rate'}
                        </Text>
                        <Text style={styles.spreadValue}>
                          {selectedLender
                            ? fmtAPR(selectedLender.buyRateMin)
                            : fmtAPR(result.commissionEstimate.spread > 0
                                ? result.actualAPR - result.commissionEstimate.spread
                                : 0)
                          }
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={colors.textDim} style={{ marginTop: 18 }} />
                      <View style={styles.spreadItem}>
                        <Text style={styles.spreadLabel}>Your rate (sell rate)</Text>
                        <Text style={[styles.spreadValue, { color: colors.danger }]}>
                          {fmtAPR(result.actualAPR)}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={colors.textDim} style={{ marginTop: 18 }} />
                      <View style={styles.spreadItem}>
                        <Text style={styles.spreadLabel}>Rate spread</Text>
                        <Text style={[styles.spreadValue, {
                          color: result.commissionEstimate.tier === 'negligible' ? colors.green :
                                 result.commissionEstimate.tier === 'low' ? colors.amber :
                                 colors.danger,
                        }]}>
                          +{fmtAPR(result.commissionEstimate.spread)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <TierBadge tier={result.commissionEstimate.tier} />

                    <View style={styles.divider} />

                    <ResultRow
                      label="Estimated broker commission"
                      value={`£${fmt(result.commissionEstimate.min)} – £${fmt(result.commissionEstimate.max)}`}
                      valueColor={colors.amber}
                      sub={`${result.commissionEstimate.rateMin}–${result.commissionEstimate.rateMax}% of deal value`}
                    />
                  </View>
                </>
              )}

              {/* ── Disclosure gap ── */}
              {validAPR && brokerInvolved && (
                <>
                  <Text style={styles.sectionTitle}>DISCLOSURE GAP</Text>
                  <View style={styles.resultCard}>
                    <View style={styles.disclosureGapRow}>
                      <Text style={styles.disclosureGapLabel}>Commission Disclosed</Text>
                      <Text style={[
                        styles.disclosureGapValue,
                        disclosure === 'none' ? { color: colors.danger } :
                        disclosure === 'partial' ? { color: colors.amber } :
                        { color: colors.green },
                      ]}>
                        {disclosure === 'none' ? '0%' : disclosure === 'partial' ? '~50%' : '100%'}
                      </Text>
                    </View>
                    <Text style={styles.disclosureNote}>
                      {disclosure === 'none'
                        ? 'No commission disclosure was made at the point of sale'
                        : disclosure === 'partial'
                        ? 'Commission was partially disclosed — full amount not revealed'
                        : 'Commission was fully disclosed at the point of sale'}
                    </Text>
                    <View style={styles.divider} />
                    <ResultRow
                      label="Basis of potential claim"
                      value={
                        result.claimBasis === 'misrepresentation' ? 'Misrepresentation' :
                        result.claimBasis === 'non_disclosure' ? 'Non-disclosure' :
                        result.claimBasis === 'inflated_rate' ? 'Inflated rate / conflict of interest' :
                        'None identified'
                      }
                      valueColor={
                        result.claimBasis === 'misrepresentation' ? colors.danger :
                        result.claimBasis !== 'none' ? colors.amber : colors.textMuted
                      }
                    />
                    <ResultRow
                      label="Potential claim value"
                      value={
                        result.potentialClaimValue > 0
                          ? `Up to £${fmt(result.potentialClaimValue)}`
                          : '£0'
                      }
                      valueColor={result.potentialClaimValue > 0 ? colors.accent : colors.textMuted}
                    />
                  </View>
                </>
              )}

              {/* ── CTA ── */}
              {validAPR && result.claimStrength !== 'none' && (
                <View style={styles.ctaCard}>
                  <Text style={styles.ctaTitle}>Take Action</Text>
                  <Text style={styles.ctaDesc}>
                    Get a free, no-obligation assessment or report your broker directly.
                  </Text>
                  <TouchableOpacity
                    style={styles.ctaBtn}
                    onPress={() => navigation.navigate('LeadStep1')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.ctaBtnText}>GET FREE REVIEW</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.black} />
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Review / report links ── */}
              {validAPR && result.claimStrength !== 'none' && (
                <>
                  <Text style={styles.sectionTitle}>REPORT &amp; REVIEW</Text>
                  <Text style={styles.reportIntro}>
                    Leave a public record and report your broker to the relevant authorities.
                    Every review helps others avoid the same outcome.
                  </Text>

                  <View style={styles.reportGrid}>
                    {brokerName.trim() && (
                      <>
                        <ReportButton
                          icon="star-outline"
                          label="Review on Trustpilot"
                          sub={brokerName.trim()}
                          color="#00B67A"
                          onPress={() => openLink(LINKS.trustpilot(
                            brokerName.trim(),
                            selectedLender?.trustpilotSlug,
                          ))}
                        />
                        <ReportButton
                          icon="chatbubble-outline"
                          label="Review on Feefo"
                          sub={brokerName.trim()}
                          color="#FC0"
                          onPress={() => openLink(LINKS.feefo(
                            brokerName.trim(),
                            selectedLender?.feefoSlug,
                          ))}
                        />
                      </>
                    )}
                    <ReportButton
                      icon="shield-outline"
                      label="Complain to FOS"
                      sub="Financial Ombudsman Service"
                      color={colors.blue}
                      onPress={() => openLink(LINKS.fos)}
                    />
                    <ReportButton
                      icon="alert-circle-outline"
                      label="Report to FCA"
                      sub="Financial Conduct Authority"
                      color={colors.blue}
                      onPress={() => openLink(LINKS.fca)}
                    />
                  </View>
                </>
              )}
            </>
          )}

          <Text style={styles.legalNote}>
            Estimates are based on known lender parameters and market data. Not financial or legal advice.
            Engage an FCA-authorised claims adviser before taking action.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const configs: Record<string, { label: string; color: string; bg: string; desc: string }> = {
    negligible: {
      label: 'Negligible markup',
      color: colors.green,
      bg: colors.greenSoft,
      desc: 'Rate spread <2% — broker commission is likely minimal. Limited grounds for a rate-based claim.',
    },
    low: {
      label: 'Low markup',
      color: colors.green,
      bg: colors.greenSoft,
      desc: 'Spread of 2–6% — some commission likely but within normal market range. Non-disclosure remains relevant.',
    },
    medium: {
      label: 'Significant markup',
      color: colors.amber,
      bg: colors.amberSoft,
      desc: 'Spread of 6–15% — the broker has materially inflated the rate. This is a meaningful basis for a claim.',
    },
    high: {
      label: 'Substantial markup',
      color: colors.danger,
      bg: 'rgba(232,64,42,0.1)',
      desc: 'Spread of 15–30% — the broker has applied a large markup above the lender\'s cost of funds. Strong non-disclosure claim.',
    },
    very_high: {
      label: 'Extreme markup',
      color: colors.danger,
      bg: 'rgba(232,64,42,0.1)',
      desc: 'Spread >30% — typically seen in MCA and high-risk lending. The hidden commission could constitute the majority of the cost.',
    },
  };

  const cfg = configs[tier] ?? configs.negligible;

  return (
    <View style={[tbStyles.card, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
      <View style={tbStyles.header}>
        <View style={[tbStyles.dot, { backgroundColor: cfg.color }]} />
        <Text style={[tbStyles.label, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
      </View>
      <Text style={tbStyles.desc}>{cfg.desc}</Text>
    </View>
  );
}

const tbStyles = StyleSheet.create({
  card: { borderRadius: radius.sm, padding: spacing.md, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: typography.xs, fontWeight: typography.bold, letterSpacing: 0.8 },
  desc: { fontSize: typography.xs, color: colors.textMuted, lineHeight: 16 },
});

// ─── Report button ────────────────────────────────────────────────────────────

function ReportButton({
  icon, label, sub, color, onPress,
}: { icon: string; label: string; sub: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={rbStyles.btn} onPress={onPress} activeOpacity={0.7}>
      <View style={[rbStyles.icon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as never} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={rbStyles.label}>{label}</Text>
        <Text style={rbStyles.sub} numberOfLines={1}>{sub}</Text>
      </View>
      <Ionicons name="open-outline" size={14} color={colors.textDim} />
    </TouchableOpacity>
  );
}

const rbStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.text },
  sub: { fontSize: typography.xs, color: colors.textMuted, marginTop: 1 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.black },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.page, paddingBottom: spacing.xxxl, maxWidth: 600, alignSelf: 'center', width: '100%' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  badgeText: { fontSize: typography.xs, color: colors.accent, fontWeight: typography.semibold, letterSpacing: 1 },
  title: { fontSize: typography.xxl, fontWeight: typography.black, color: colors.text, lineHeight: 34, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sm, color: colors.textMuted, marginBottom: spacing.sm },

  brokerCard: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  brokerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  brokerCardTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.text,
    letterSpacing: 0.3,
  },
  brokerCardDesc: {
    fontSize: typography.xs,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  brokerOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  brokerOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface3,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brokerOptionYes: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  brokerOptionNo: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  brokerOptionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textMuted,
  },
  brokerOptionLabelActive: {
    color: colors.black,
  },
  brokerOptionSub: {
    fontSize: 9,
    color: colors.textDim,
    marginTop: 1,
  },
  brokerDirectNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  brokerDirectNoteText: {
    flex: 1,
    fontSize: typography.xs,
    color: colors.amber,
    lineHeight: 15,
  },

  lenderInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },
  lenderInfoText: { flex: 1, fontSize: typography.xs, color: colors.textDim, lineHeight: 16 },

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
  inputInner: { flex: 1, fontSize: typography.base, color: colors.text, paddingVertical: spacing.md },
  currencySign: { fontSize: typography.md, color: colors.textMuted, marginRight: spacing.xs },
  unitLabel: { fontSize: typography.sm, color: colors.textDim, marginLeft: spacing.xs },

  smokingGunCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  smokingGunHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  smokingGunTitle: { fontSize: typography.xs, color: colors.accent, fontWeight: typography.bold, letterSpacing: 1 },
  smokingGunDesc: { fontSize: typography.xs, color: colors.textMuted, lineHeight: 16, marginBottom: spacing.xs },

  disclosureRow: { flexDirection: 'row', gap: spacing.sm },
  disclosureBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.md,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2,
  },
  disclosureBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  disclosureBtnText: { fontSize: typography.xs, color: colors.textMuted, fontWeight: typography.medium },
  disclosureBtnTextActive: { color: colors.black },

  calcBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.xl,
  },
  calcBtnText: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.black, letterSpacing: 1 },

  warningCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.amberSoft, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.amberBorder, marginBottom: spacing.md,
  },
  warningText: { flex: 1, fontSize: typography.sm, color: colors.amber, lineHeight: 18 },

  verdictCard: {
    backgroundColor: colors.surface2, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, marginBottom: spacing.md,
  },
  verdictBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, marginBottom: spacing.md,
  },
  verdictBadgeText: { fontSize: typography.xs, fontWeight: typography.bold, letterSpacing: 0.8 },
  mismatchAlert: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: 'rgba(232,64,42,0.08)', borderRadius: radius.sm, padding: spacing.sm,
    marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(232,64,42,0.2)',
  },
  mismatchText: { flex: 1, fontSize: typography.xs, color: colors.danger, lineHeight: 16, fontWeight: typography.semibold },
  verdictSummary: { fontSize: typography.sm, color: colors.textMuted, lineHeight: 20 },

  sectionTitle: {
    fontSize: typography.xs, color: colors.textDim, fontWeight: typography.semibold,
    letterSpacing: 1.2, marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  resultCard: {
    backgroundColor: colors.surface2, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
  },
  totalRepaid: { fontSize: typography.xxl + 4, fontWeight: typography.black, color: colors.text },
  totalRepaidSub: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  spreadRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm },
  spreadItem: { flex: 1, alignItems: 'center' },
  spreadLabel: { fontSize: typography.xs, color: colors.textDim, textAlign: 'center', marginBottom: spacing.xs, lineHeight: 14 },
  spreadValue: { fontSize: typography.md, fontWeight: typography.black, color: colors.text },

  disclosureGapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  disclosureGapLabel: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  disclosureGapValue: { fontSize: typography.xl, fontWeight: typography.black },
  disclosureNote: { fontSize: typography.xs, color: colors.textMuted, marginBottom: spacing.xs },

  ctaCard: {
    backgroundColor: colors.surface2, borderRadius: radius.lg, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.accentBorder, marginTop: spacing.lg, alignItems: 'center',
  },
  ctaTitle: { fontSize: typography.lg, fontWeight: typography.black, color: colors.text, marginBottom: spacing.sm },
  ctaDesc: { fontSize: typography.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: spacing.lg },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
  },
  ctaBtnText: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.black, letterSpacing: 1 },

  reportIntro: { fontSize: typography.sm, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.md },
  reportGrid: {},

  legalNote: {
    fontSize: typography.xs, color: colors.textDim, textAlign: 'center',
    lineHeight: 16, marginTop: spacing.xl,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../theme';
import { DealFact, FactFlag, RootStackParamList, Severity } from '../types';
import { useExposeStore } from '../store/useExposeStore';
import { AGREEMENT_LABELS } from '../services/anthropic';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Config maps ─────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; border: string; icon: keyof typeof Ionicons.glyphMap }> = {
  high:   { color: colors.danger, bg: 'rgba(232,64,42,0.10)', border: 'rgba(232,64,42,0.25)', icon: 'warning' },
  medium: { color: colors.amber,  bg: colors.amberSoft,       border: colors.amberBorder,      icon: 'alert-circle' },
  low:    { color: colors.green,  bg: colors.greenSoft,       border: colors.greenBorder,      icon: 'information-circle' },
};

const FLAG_COLOR: Record<FactFlag, string> = {
  danger:  colors.danger,
  warning: colors.amber,
  ok:      colors.green,
  neutral: colors.textMuted,
};

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'High Concern',     color: colors.danger };
  if (score >= 40) return { label: 'Moderate Concern', color: colors.amber };
  return                  { label: 'Low Concern',      color: colors.green };
}

type OutcomeTier = 'clean' | 'moderate' | 'action';

function getOutcomeTier(score: number, highCount: number): OutcomeTier {
  if (highCount > 0 || score >= 70) return 'action';
  if (score >= 40)                  return 'moderate';
  return                                   'clean';
}

function fmt(n: number) {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Segmented concern meter — green / amber / red track with score cursor */
function ConcernMeter({ score, color }: { score: number; color: string }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <View style={meter.wrap}>
      {/* Track */}
      <View style={meter.track}>
        <View style={[meter.zone, { flex: 40, backgroundColor: 'rgba(46,204,113,0.25)' }]} />
        <View style={[meter.zone, { flex: 30, backgroundColor: 'rgba(245,166,35,0.25)', marginHorizontal: 2 }]} />
        <View style={[meter.zone, { flex: 30, backgroundColor: 'rgba(232,64,42,0.25)' }]} />
      </View>
      {/* Filled portion */}
      <View style={[meter.fill, { width: `${pct}%` as `${number}%`, backgroundColor: color + '60' }]} />
      {/* Cursor */}
      <View style={[meter.cursor, { left: `${pct}%` as `${number}%`, borderColor: color }]}>
        <View style={[meter.cursorDot, { backgroundColor: color }]} />
      </View>
      {/* Labels */}
      <View style={meter.labels}>
        <Text style={meter.labelText}>LOW</Text>
        <Text style={meter.labelText}>MODERATE</Text>
        <Text style={meter.labelText}>HIGH</Text>
      </View>
    </View>
  );
}

const meter = StyleSheet.create({
  wrap:       { marginTop: spacing.md, marginBottom: spacing.lg },
  track:      { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden', position: 'relative' },
  zone:       { height: 10 },
  fill:       { position: 'absolute', top: 0, left: 0, height: 10, borderRadius: 5 },
  cursor:     { position: 'absolute', top: -4, width: 18, height: 18, borderRadius: 9, borderWidth: 2, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center', marginLeft: -9 },
  cursorDot:  { width: 6, height: 6, borderRadius: 3 },
  labels:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  labelText:  { fontSize: typography.xs, color: colors.textDim, letterSpacing: 0.8 },
});

/** Stacked cost breakdown bar */
function CostBar({
  capital,
  totalCost,
  hiddenCost,
}: {
  capital: number | null | undefined;
  totalCost: number | null | undefined;
  hiddenCost: number | null | undefined;
}) {
  if (!totalCost || totalCost <= 0) return null;

  const cap   = Math.max(0, capital ?? totalCost * 0.7);
  const hid   = Math.max(0, hiddenCost ?? 0);
  const known = Math.max(0, totalCost - cap - hid);
  const total = cap + known + hid;

  const capPct   = (cap   / total) * 100;
  const knownPct = (known / total) * 100;
  const hidPct   = (hid   / total) * 100;

  return (
    <View style={bar.wrap}>
      <Text style={bar.sectionLabel}>COST BREAKDOWN</Text>

      {/* Stacked bar */}
      <View style={bar.track}>
        <View style={[bar.seg, { flex: capPct,   backgroundColor: colors.green,  borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }]} />
        {knownPct > 0 && (
          <View style={[bar.seg, { flex: knownPct, backgroundColor: colors.amber, marginHorizontal: 1 }]} />
        )}
        {hidPct > 0 && (
          <View style={[bar.seg, { flex: hidPct,   backgroundColor: colors.danger, borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
        )}
      </View>

      {/* Legend */}
      <View style={bar.legend}>
        <View style={bar.legendItem}>
          <View style={[bar.dot, { backgroundColor: colors.green }]} />
          <View>
            <Text style={bar.legendLabel}>Capital</Text>
            <Text style={bar.legendValue}>£{fmt(cap)}</Text>
          </View>
        </View>
        {knownPct > 0 && (
          <View style={bar.legendItem}>
            <View style={[bar.dot, { backgroundColor: colors.amber }]} />
            <View>
              <Text style={bar.legendLabel}>Interest / Fees</Text>
              <Text style={bar.legendValue}>£{fmt(known)}</Text>
            </View>
          </View>
        )}
        {hidPct > 0 && (
          <View style={bar.legendItem}>
            <View style={[bar.dot, { backgroundColor: colors.danger }]} />
            <View>
              <Text style={bar.legendLabel}>Suspected Hidden</Text>
              <Text style={[bar.legendValue, { color: colors.danger }]}>£{fmt(hid)}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const bar = StyleSheet.create({
  wrap:         { marginTop: spacing.lg },
  sectionLabel: { fontSize: typography.xs, color: colors.textDim, fontWeight: typography.semibold, letterSpacing: 1.2, marginBottom: spacing.sm },
  track:        { height: 28, flexDirection: 'row', borderRadius: 6, overflow: 'hidden' },
  seg:          { height: 28 },
  legend:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  legendItem:   { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  dot:          { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  legendLabel:  { fontSize: typography.xs, color: colors.textDim },
  legendValue:  { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.text, marginTop: 1 },
});

/** 2-column key facts grid */
function KeyFactsGrid({ facts }: { facts: DealFact[] }) {
  if (!facts || facts.length === 0) return null;
  return (
    <View style={grid.wrap}>
      <Text style={grid.sectionLabel}>KEY FACTS</Text>
      <View style={grid.grid}>
        {facts.map((f, i) => {
          const col = FLAG_COLOR[f.flag];
          return (
            <View key={i} style={[grid.cell, { borderColor: col + '30' }]}>
              <Text style={grid.cellLabel} numberOfLines={1}>{f.label}</Text>
              <Text style={[grid.cellValue, { color: f.flag === 'neutral' ? colors.text : col }]} numberOfLines={2}>
                {f.value}
              </Text>
              {f.flag !== 'neutral' && f.flag !== 'ok' && (
                <View style={[grid.flagDot, { backgroundColor: col }]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const grid = StyleSheet.create({
  wrap:         { marginTop: spacing.lg },
  sectionLabel: { fontSize: typography.xs, color: colors.textDim, fontWeight: typography.semibold, letterSpacing: 1.2, marginBottom: spacing.sm },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    width: '48%',
    backgroundColor: colors.surface3,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  cellLabel: { fontSize: typography.xs, color: colors.textDim, marginBottom: spacing.xs },
  cellValue: { fontSize: typography.md, fontWeight: typography.bold, lineHeight: 20 },
  flagDot: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 7, height: 7, borderRadius: 4 },
});

/** Risk breakdown — H/M/L horizontal bars */
function RiskBreakdown({ high, medium, low }: { high: number; medium: number; low: number }) {
  const total = high + medium + low;
  if (total === 0) return null;

  const rows = [
    { label: 'HIGH',   count: high,   color: colors.danger, icon: 'warning' as const },
    { label: 'MEDIUM', count: medium, color: colors.amber,  icon: 'alert-circle' as const },
    { label: 'LOW',    count: low,    color: colors.green,  icon: 'information-circle' as const },
  ];

  return (
    <View style={risk.wrap}>
      <Text style={risk.sectionLabel}>RISK BREAKDOWN</Text>
      {rows.map(({ label, count, color, icon }) => (
        <View key={label} style={risk.row}>
          <View style={risk.rowLeft}>
            <Ionicons name={icon} size={14} color={color} />
            <Text style={[risk.rowLabel, { color }]}>{label}</Text>
          </View>
          <View style={risk.barTrack}>
            <View
              style={[
                risk.barFill,
                {
                  width: count > 0 ? `${(count / Math.max(high, medium, low)) * 100}%` as `${number}%` : 0,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <Text style={[risk.count, { color: count > 0 ? color : colors.textDim }]}>
            {count} {count === 1 ? 'issue' : 'issues'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const risk = StyleSheet.create({
  wrap:         { marginTop: spacing.lg },
  sectionLabel: { fontSize: typography.xs, color: colors.textDim, fontWeight: typography.semibold, letterSpacing: 1.2, marginBottom: spacing.md },
  row:          { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  rowLeft:      { flexDirection: 'row', alignItems: 'center', gap: 5, width: 70 },
  rowLabel:     { fontSize: typography.xs, fontWeight: typography.bold, letterSpacing: 0.8 },
  barTrack:     { flex: 1, height: 8, backgroundColor: colors.surface3, borderRadius: 4, overflow: 'hidden' },
  barFill:      { height: 8, borderRadius: 4 },
  count:        { fontSize: typography.xs, width: 54, textAlign: 'right' },
});

// ─── Outcome card ────────────────────────────────────────────────────────────

const OUTCOME_CONFIG = {
  clean: {
    icon:       'checkmark-circle' as const,
    iconColor:  colors.green,
    iconBg:     colors.greenSoft,
    border:     colors.greenBorder,
    bg:         'rgba(46,204,113,0.06)',
    badge:      'AGREEMENT LOOKS FAIR',
    badgeColor: colors.green,
    title:      'Great news — your funding is competitive',
    desc:       'Based on our analysis, you appear to have secured fair, sustainable and competitive funding for your business. We found no significant red flags in this agreement.',
    btnLabel:   'SCAN ANOTHER DOCUMENT',
    btnIcon:    'scan-outline' as const,
    btnBg:      colors.green,
    isReview:   false,
  },
  moderate: {
    icon:       'alert-circle' as const,
    iconColor:  colors.amber,
    iconBg:     colors.amberSoft,
    border:     colors.amberBorder,
    bg:         'rgba(245,166,35,0.06)',
    badge:      'SOME POINTS TO CONSIDER',
    badgeColor: colors.amber,
    title:      'Worth a second opinion',
    desc:       'Your agreement has some terms that could work against you over time. While these may not constitute grounds for a formal claim, understanding what you have signed is important.',
    btnLabel:   'GET FREE SECOND OPINION',
    btnIcon:    'chatbubble-ellipses-outline' as const,
    btnBg:      colors.amber,
    isReview:   true,
  },
  action: {
    icon:       'warning' as const,
    iconColor:  colors.danger,
    iconBg:     'rgba(232,64,42,0.12)',
    border:     colors.dangerBorder,
    bg:         'rgba(232,64,42,0.06)',
    badge:      'ACTION RECOMMENDED',
    badgeColor: colors.danger,
    title:      'You may have grounds for a review',
    desc:       'Our analysis has identified significant concerns with this agreement. You may be entitled to recover hidden charges or commission. Get a free, no-obligation assessment now.',
    btnLabel:   'GET FREE REVIEW',
    btnIcon:    'arrow-forward' as const,
    btnBg:      colors.accent,
    isReview:   true,
  },
} as const;

function OutcomeCard({ tier, onReview }: { tier: OutcomeTier; onReview: () => void }) {
  const cfg = OUTCOME_CONFIG[tier];
  return (
    <View style={[oc.card, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
      {/* Badge */}
      <View style={[oc.badge, { backgroundColor: cfg.iconBg }]}>
        <Ionicons name={cfg.icon} size={11} color={cfg.iconColor} />
        <Text style={[oc.badgeText, { color: cfg.iconColor }]}>{cfg.badge}</Text>
      </View>

      {/* Icon */}
      <View style={[oc.iconWrap, { backgroundColor: cfg.iconBg }]}>
        <Ionicons name={cfg.icon} size={28} color={cfg.iconColor} />
      </View>

      <Text style={oc.title}>{cfg.title}</Text>
      <Text style={oc.desc}>{cfg.desc}</Text>

      <TouchableOpacity
        style={[oc.btn, { backgroundColor: cfg.btnBg }]}
        onPress={onReview}
        activeOpacity={0.85}
      >
        <Text style={[oc.btnText, { color: tier === 'action' ? colors.black : colors.black }]}>
          {cfg.btnLabel}
        </Text>
        <Ionicons name={cfg.btnIcon} size={16} color={colors.black} />
      </TouchableOpacity>

      {tier === 'clean' && (
        <Text style={oc.cleanNote}>
          Keep a copy of this report for your records. If your circumstances change, you can re-scan at any time.
        </Text>
      )}
    </View>
  );
}

const oc = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.lg,
  },
  badgeText:  { fontSize: typography.xs, fontWeight: typography.bold, letterSpacing: 1 },
  iconWrap:   { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title:      { fontSize: typography.lg, fontWeight: typography.black, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  desc:       { fontSize: typography.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: spacing.xl },
  btn:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  btnText:    { fontSize: typography.sm, fontWeight: typography.bold, letterSpacing: 1 },
  cleanNote:  { fontSize: typography.xs, color: colors.textDim, textAlign: 'center', lineHeight: 16, marginTop: spacing.md },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ResultsScreen() {
  const navigation = useNavigation<Nav>();
  const { currentScan } = useExposeStore();

  if (!currentScan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textMuted }}>No results available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    concernScore, findings, agreementType, timestamp,
    keyFacts, estimatedCapital, estimatedTotalCost, estimatedHiddenCost, advisorSummary,
  } = currentScan;

  const { label: sLabel, color: sColor } = scoreLabel(concernScore);
  const highCount   = findings.filter((f) => f.severity === 'high').length;
  const mediumCount = findings.filter((f) => f.severity === 'medium').length;
  const lowCount    = findings.filter((f) => f.severity === 'low').length;
  const tier        = getOutcomeTier(concernScore, highCount);

  const hasCostData = !!estimatedTotalCost && estimatedTotalCost > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Nav ── */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>ANALYSIS RESULTS</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* ── Score card ── */}
        <View style={[styles.scoreCard, { borderColor: sColor + '40' }]}>
          <Text style={styles.scoreMeta}>
            {AGREEMENT_LABELS[agreementType]} · {new Date(timestamp).toLocaleDateString('en-GB')}
          </Text>

          <View style={styles.scoreRow}>
            <View>
              <Text style={[styles.scoreNumber, { color: sColor }]}>{concernScore}</Text>
              <Text style={styles.scoreOutOf}>/100 concern score</Text>
            </View>
            <View style={[styles.scoreLabelBadge, { backgroundColor: sColor + '18' }]}>
              <Text style={[styles.scoreLabelText, { color: sColor }]}>{sLabel}</Text>
            </View>
          </View>

          <ConcernMeter score={concernScore} color={sColor} />

          {highCount > 0 && (
            <View style={styles.alertRow}>
              <Ionicons name="warning" size={13} color={colors.danger} />
              <Text style={styles.alertText}>
                {highCount} high-severity {highCount === 1 ? 'issue' : 'issues'} require immediate attention
              </Text>
            </View>
          )}
        </View>

        {/* ── Advisor summary ── */}
        {!!advisorSummary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="chatbubble-ellipses" size={14} color={colors.accent} />
              <Text style={styles.summaryLabel}>AI ADVISOR SUMMARY</Text>
            </View>
            <Text style={styles.summaryText}>"{advisorSummary}"</Text>
          </View>
        )}

        {/* ── Deal breakdown visual ── */}
        {(hasCostData || (keyFacts && keyFacts.length > 0)) && (
          <View style={styles.dealCard}>
            <View style={styles.dealCardHeader}>
              <Ionicons name="pie-chart-outline" size={15} color={colors.accent} />
              <Text style={styles.dealCardTitle}>DEAL AT A GLANCE</Text>
            </View>

            <CostBar
              capital={estimatedCapital}
              totalCost={estimatedTotalCost}
              hiddenCost={estimatedHiddenCost}
            />

            {hasCostData && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Repayable</Text>
                <Text style={styles.totalValue}>£{fmt(estimatedTotalCost!)}</Text>
              </View>
            )}

            {estimatedHiddenCost != null && estimatedHiddenCost > 0 && (
              <View style={styles.hiddenAlert}>
                <Ionicons name="eye-off-outline" size={14} color={colors.danger} />
                <Text style={styles.hiddenAlertText}>
                  Est. £{fmt(estimatedHiddenCost)} in suspected hidden costs / undisclosed commission
                </Text>
              </View>
            )}

            <KeyFactsGrid facts={keyFacts ?? []} />

            <RiskBreakdown high={highCount} medium={mediumCount} low={lowCount} />
          </View>
        )}

        {/* If no cost data, still show risk breakdown */}
        {!hasCostData && !(keyFacts && keyFacts.length > 0) && findings.length > 0 && (
          <View style={styles.dealCard}>
            <View style={styles.dealCardHeader}>
              <Ionicons name="bar-chart-outline" size={15} color={colors.accent} />
              <Text style={styles.dealCardTitle}>RISK OVERVIEW</Text>
            </View>
            <RiskBreakdown high={highCount} medium={mediumCount} low={lowCount} />
          </View>
        )}

        {/* ── Findings ── */}
        <Text style={styles.sectionTitle}>FINDINGS ({findings.length})</Text>
        {findings.length === 0 ? (
          <View style={styles.emptyFindings}>
            <Ionicons name="checkmark-circle" size={32} color={colors.green} />
            <Text style={styles.emptyText}>No significant issues found</Text>
          </View>
        ) : (
          findings.map((f, i) => {
            const cfg = SEVERITY_CONFIG[f.severity];
            return (
              <View key={i} style={[styles.finding, { borderLeftColor: cfg.color, borderColor: cfg.border, backgroundColor: cfg.bg }]}>
                <View style={styles.findingHeader}>
                  <View style={[styles.findingBadge, { backgroundColor: cfg.color + '20' }]}>
                    <Ionicons name={cfg.icon} size={11} color={cfg.color} />
                    <Text style={[styles.findingBadgeText, { color: cfg.color }]}>
                      {f.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.findingTitle}>{f.title}</Text>
                <Text style={styles.findingDetail}>{f.detail}</Text>
              </View>
            );
          })
        )}

        {/* ── Outcome card ── */}
        <OutcomeCard tier={tier} onReview={() => navigation.navigate('LeadStep1')} />

        <Text style={styles.legal}>
          AI analysis is indicative only and does not constitute legal or financial advice.
          Engage an FCA-authorised adviser before taking action.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.black },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: spacing.page, paddingBottom: spacing.xxxl, maxWidth: 600, alignSelf: 'center', width: '100%' },

  navRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, marginTop: spacing.sm },
  backBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, width: 60 },
  backText:  { fontSize: typography.sm, color: colors.text },
  navTitle:  { fontSize: typography.xs, fontWeight: typography.bold, color: colors.textDim, letterSpacing: 1.5 },

  scoreCard: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  scoreMeta:       { fontSize: typography.xs, color: colors.textDim, letterSpacing: 0.5, marginBottom: spacing.md },
  scoreRow:        { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: spacing.sm },
  scoreNumber:     { fontSize: typography.hero, fontWeight: typography.black, lineHeight: 50 },
  scoreOutOf:      { fontSize: typography.sm, color: colors.textMuted },
  scoreLabelBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  scoreLabelText:  { fontSize: typography.sm, fontWeight: typography.bold },
  alertRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  alertText:       { fontSize: typography.xs, color: colors.danger, flex: 1, lineHeight: 15 },

  summaryCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    marginBottom: spacing.md,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  summaryLabel:  { fontSize: typography.xs, color: colors.accent, fontWeight: typography.bold, letterSpacing: 1 },
  summaryText:   { fontSize: typography.sm, color: colors.text, lineHeight: 18, fontStyle: 'italic' },

  dealCard: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  dealCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  dealCardTitle:  { fontSize: typography.xs, color: colors.accent, fontWeight: typography.bold, letterSpacing: 1.2 },

  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: typography.sm, color: colors.textMuted },
  totalValue: { fontSize: typography.lg, fontWeight: typography.black, color: colors.text },

  hiddenAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: 'rgba(232,64,42,0.08)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(232,64,42,0.2)',
  },
  hiddenAlertText: { flex: 1, fontSize: typography.xs, color: colors.danger, lineHeight: 15 },

  sectionTitle: { fontSize: typography.xs, color: colors.textDim, fontWeight: typography.semibold, letterSpacing: 1.2, marginBottom: spacing.md },

  emptyFindings: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText:     { fontSize: typography.base, color: colors.textMuted },

  finding: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  findingHeader:    { marginBottom: spacing.xs },
  findingBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: radius.sm, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  findingBadgeText: { fontSize: typography.xs, fontWeight: typography.bold, letterSpacing: 0.8 },
  findingTitle:     { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text, marginBottom: spacing.xs },
  findingDetail:    { fontSize: typography.sm, color: colors.textMuted, lineHeight: 18 },

  cta: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
  },
  ctaIcon:    { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  ctaTitle:   { fontSize: typography.lg, fontWeight: typography.black, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  ctaDesc:    { fontSize: typography.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: spacing.xl },
  ctaBtn:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  ctaBtnText: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.black, letterSpacing: 1 },

  legal: { fontSize: typography.xs, color: colors.textDim, textAlign: 'center', lineHeight: 16, marginTop: spacing.xl },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, spacing, radius, typography } from '../theme';
import { TabParamList } from '../types';
import { useExposeStore } from '../store/useExposeStore';
import { AGREEMENT_LABELS } from '../services/anthropic';

type Nav = BottomTabNavigationProp<TabParamList>;

const ROTATING_STATS = [
  { value: '£50bn+', label: 'Estimated value of hidden commissions across UK finance agreements' },
  { value: '3 in 4', label: 'SME "broker arranged" finance deals may contain undisclosed fees' },
  { value: '2024', label: 'Supreme Court Ruling: undisclosed commissions are unlawful' },
  { value: '2026', label: 'Unscrupulous Call Centre Brokers: still ripping off UK businesses' },
  { value: '15%',  label: 'Capital Balance Advance: Some Lenders advertise paying this to brokers' },
];

// Per-stat background theme — different color + watermark symbol each rotation
const STAT_THEMES = [
  { circle1: 'rgba(205,254,0,0.09)',  circle2: 'rgba(205,254,0,0.04)',  circle3: 'rgba(205,254,0,0.06)',  glyph: 'rgba(205,254,0,0.06)',  border: 'rgba(205,254,0,0.3)',  symbol: '£' },
  { circle1: 'rgba(245,166,35,0.11)', circle2: 'rgba(245,166,35,0.05)', circle3: 'rgba(245,166,35,0.08)', glyph: 'rgba(245,166,35,0.07)', border: 'rgba(245,166,35,0.35)', symbol: '¾' },
  { circle1: 'rgba(74,158,255,0.11)', circle2: 'rgba(74,158,255,0.05)', circle3: 'rgba(74,158,255,0.08)', glyph: 'rgba(74,158,255,0.07)', border: 'rgba(74,158,255,0.35)',  symbol: '⚖' },
  { circle1: 'rgba(232,64,42,0.11)',  circle2: 'rgba(232,64,42,0.05)',  circle3: 'rgba(232,64,42,0.08)',  glyph: 'rgba(232,64,42,0.07)',  border: 'rgba(232,64,42,0.35)',  symbol: '!' },
  { circle1: 'rgba(74,158,255,0.09)', circle2: 'rgba(245,166,35,0.05)', circle3: 'rgba(205,254,0,0.06)',  glyph: 'rgba(205,254,0,0.06)',  border: 'rgba(205,254,0,0.3)',   symbol: '%' },
];

const HOW_IT_WORKS = [
  {
    icon: 'cloud-upload-outline' as const,
    step: '01',
    title: 'Upload or Enter',
    desc: 'Scan your finance agreement PDF or photo, or enter your loan details manually',
  },
  {
    icon: 'hardware-chip-outline' as const,
    step: '02',
    title: 'AI Analysis',
    desc: 'Agentic AI reads the small print searching for hidden fees, usury terms, inflated rates and possible FCA breaches',
  },
  {
    icon: 'alert-circle-outline' as const,
    step: '03',
    title: 'Get Your Exposure Score',
    desc: 'Receive a clear summary and our specific findings to guide your next steps',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { scanHistory } = useExposeStore();
  const [statIndex, setStatIndex] = useState(0);
  const [commissionWidth, setCommissionWidth] = useState(0);

  const { width } = useWindowDimensions();
  const rs = (sm: number, md: number, lg: number = md) =>
    width < 400 ? sm : width < 600 ? md : lg;

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const heroAnim   = useRef(new Animated.Value(0)).current;
  const statAnim   = useRef(new Animated.Value(0)).current;
  const howAnim    = useRef(new Animated.Value(0)).current;
  const card1Anim  = useRef(new Animated.Value(0)).current;
  const card2Anim  = useRef(new Animated.Value(0)).current;

  // Looping effects
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const statFadeAnim = useRef(new Animated.Value(1)).current;
  const floatAnim          = useRef(new Animated.Value(0)).current;
  const rotateAnim         = useRef(new Animated.Value(0)).current;
  const heroUnderlineAnim  = useRef(new Animated.Value(0)).current;
  const chromaAnim         = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.stagger(100, [
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }),
      Animated.spring(heroAnim,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }),
      Animated.spring(statAnim,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }),
      Animated.spring(howAnim,    { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }),
      Animated.spring(card1Anim,  { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }),
      Animated.spring(card2Anim,  { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }),
    ]).start();

    // Pulse glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    // Scan line loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();

    // Chroma shift on COMMISSIONS gradient
    Animated.loop(
      Animated.timing(chromaAnim, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: false })
    ).start();

    // Hero underline paint stroke — delayed left-to-right reveal
    // useNativeDriver:false required to animate width (layout prop)
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(heroUnderlineAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();

    // Float loop — background circles bob up/down
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Rotate loop — large decorative circle slowly spins
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Rotating stats
    const timer = setInterval(() => {
      Animated.timing(statFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setStatIndex(i => (i + 1) % ROTATING_STATS.length);
        Animated.timing(statFadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      });
    }, 3800);

    return () => clearInterval(timer);
  }, []);

  const slideIn = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }),
    }],
  });

  const currentStat  = ROTATING_STATS[statIndex];
  const currentTheme = STAT_THEMES[statIndex];
  const strokeColor  = ['#CDFE00', '#F5A623', '#4A9EFF', '#E8402A', '#CDFE00'][statIndex];

  const rotateInterp = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const floatInterp  = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
  const floatSlowInterp = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Logo row ─────────────────────────────────────── */}
        <Animated.View style={[styles.logoRow, slideIn(headerAnim)]}>
          <View style={styles.logoTextRow}>
            <Text style={styles.brand}>VELTRO</Text>
            <Text style={styles.brandSub}>EXPOSE</Text>
          </View>
        </Animated.View>

        {/* ── Hero statement ───────────────────────────────── */}
        <Animated.View style={[styles.hero, slideIn(heroAnim)]}>

          {/* Line 1: "Hidden." */}
          <Text style={[styles.heroTitle, { fontSize: rs(28, 38, 50), lineHeight: rs(32, 42, 56), marginBottom: spacing.sm }]}>
            Hidden.
          </Text>

          {/* Line 2: "COMMISSIONS." — chromaphase gradient */}
          <View
            style={styles.heroAccentBlock}
            onLayout={e => setCommissionWidth(e.nativeEvent.layout.width)}
          >
            <MaskedView
              maskElement={
                <Text style={[
                  styles.heroTitle,
                  styles.heroAccent,
                  { fontSize: rs(32, 44, 58), lineHeight: rs(36, 48, 64), marginBottom: 0, backgroundColor: 'transparent' },
                ]}>
                  COMMISSIONS.
                </Text>
              }
            >
              <Animated.View
                style={{
                  width: commissionWidth * 3 || 900,
                  height: rs(40, 52, 68),
                  transform: [{
                    translateX: chromaAnim.interpolate({
                      inputRange:  [0, 1],
                      outputRange: [0, -(commissionWidth * 2 || 600)],
                    }),
                  }],
                }}
              >
                <LinearGradient
                  colors={['#ff2d55', '#ff6a00', '#ffcc00', '#00e5ff', '#a259ff', '#ff2d55', '#ff6a00', '#ffcc00']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </MaskedView>

            {/* Paint stroke underline */}
            <View style={styles.heroStrokeTilt}>
              <Animated.View style={[styles.heroStrokeReveal, {
                width: heroUnderlineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, commissionWidth] }),
              }]}>
                <View style={[styles.heroStrokeBody, { backgroundColor: strokeColor }]} />
                <View style={styles.heroStrokeSheen} />
              </Animated.View>
            </View>
          </View>

          {/* Line 3: "Exposed." */}
          <Text style={[styles.heroTitle, { fontSize: rs(28, 38, 50), lineHeight: rs(32, 42, 56), marginBottom: spacing.md }]}>
            Exposed.
          </Text>

          {/* Subhead */}
          <Text style={styles.heroSub}>
            Find out what's buried in your finance agreement.{' '}
            <Text style={styles.heroSubBold}>Johnson v Firstrand Bank Ltd</Text>
            {' '}confirmed: undisclosed broker commissions are unlawful.
          </Text>

        </Animated.View>

        {/* ── Animated insight panel ───────────────────────── */}
        <Animated.View style={[styles.insightPanel, slideIn(statAnim), { borderColor: currentTheme.border }]}>

          {/* Decorative background circles — animated + per-stat color */}
          <Animated.View style={[
            styles.panelCircle1,
            { backgroundColor: currentTheme.circle1, transform: [{ rotate: rotateInterp }] },
          ]} />
          <Animated.View style={[
            styles.panelCircle2,
            { backgroundColor: currentTheme.circle2, transform: [{ translateY: floatInterp }] },
          ]} />
          <Animated.View style={[
            styles.panelCircle3,
            { backgroundColor: currentTheme.circle3, transform: [{ scale: pulseAnim }, { translateY: floatSlowInterp }] },
          ]} />

          {/* Background watermark glyph — floats gently, symbol changes per stat */}
          <Animated.Text style={[
            styles.panelGlyph,
            { color: currentTheme.glyph, transform: [{ translateY: floatInterp }] },
          ]}>
            {currentTheme.symbol}
          </Animated.Text>

          {/* Live badge */}
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDot, {
              opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [1, 0.25] }),
            }]} />
            <Text style={styles.liveBadgeText}>What <Text style={styles.liveBadgeYou}>YOU</Text> should know</Text>
          </View>

          {/* Stat value */}
          <Animated.Text style={[styles.insightValue, { opacity: statFadeAnim }]}>
            {currentStat.value}
          </Animated.Text>

          {/* Progress track */}
          <View style={styles.insightProgressBg}>
            <View style={[styles.insightProgressFill, {
              width: `${((statIndex + 1) / ROTATING_STATS.length) * 100}%` as `${number}%`,
              backgroundColor: currentTheme.border,
            }]} />
          </View>

          {/* Stat label */}
          <Animated.Text style={[styles.insightLabel, { opacity: statFadeAnim }]}>
            {currentStat.label}
          </Animated.Text>

          {/* Pagination dots */}
          <View style={styles.insightDots}>
            {ROTATING_STATS.map((_, i) => (
              <View key={i} style={[styles.dot, i === statIndex && styles.dotActive]} />
            ))}
          </View>

        </Animated.View>

        {/* ── How it works ─────────────────────────────────── */}
        <Animated.View style={[styles.section, slideIn(howAnim)]}>
          <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
          {HOW_IT_WORKS.map((item, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepLeft}>
                <View style={styles.stepIcon}>
                  <Ionicons name={item.icon} size={16} color={colors.accent} />
                </View>
                {i < HOW_IT_WORKS.length - 1 && <View style={styles.stepConnector} />}
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepNum}>{item.step}</Text>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── Mode cards ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>CHOOSE YOUR MODE</Text>

        {/* Scanner card */}
        <Animated.View style={[{ marginTop: spacing.md }, slideIn(card1Anim)]}>
          <TouchableOpacity
            style={[styles.card, styles.cardPrimary]}
            onPress={() => navigation.navigate('Scanner')}
            activeOpacity={0.82}
          >
            {/* Pulsing glow behind icon */}
            <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />

            <View style={styles.cardTopRow}>
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>MODE 01</Text>
              </View>
              <View style={styles.cardIconCircle}>
                <Ionicons name="scan" size={20} color={colors.black} />
              </View>
            </View>

            <Text style={styles.cardTitle}>Document{'\n'}Scanner</Text>
            <Text style={styles.cardDesc}>
              Upload a PDF or photo of your finance agreement. Our AI reads the small print in seconds and surfaces hidden commissions, inflated interest rates and FCA compliance issues.
            </Text>

            {/* Animated scan preview */}
            <View style={styles.scanPreview}>
              {[80, 65, 95, 72, 50].map((w, i) => (
                <View key={i} style={[styles.docLine, { width: `${w}%` as any, opacity: 0.25 + i * 0.08 }]} />
              ))}
              <Animated.View
                style={[
                  styles.scanCursor,
                  {
                    transform: [{
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 60],
                      }),
                    }],
                  },
                ]}
              />
            </View>

            <View style={styles.cardCta}>
              <Text style={styles.cardCtaText}>SCAN NOW</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.black} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Calculator card */}
        <Animated.View style={[{ marginTop: spacing.md }, slideIn(card2Anim)]}>
          <TouchableOpacity
            style={[styles.card, styles.cardSecondary]}
            onPress={() => navigation.navigate('Calculator')}
            activeOpacity={0.82}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.modeBadge, styles.modeBadgeMuted]}>
                <Text style={[styles.modeBadgeText, { color: colors.textMuted }]}>MODE 02</Text>
              </View>
              <View style={[styles.cardIconCircle, styles.cardIconCircleMuted]}>
                <Ionicons name="calculator" size={20} color={colors.accent} />
              </View>
            </View>

            <Text style={styles.cardTitle}>Commission{'\n'}Calculator</Text>
            <Text style={styles.cardDesc}>
              No document? Enter your loan amount, term and monthly repayments to estimate hidden broker commissions and compare your rate against the market.
            </Text>

            {/* Mini rate comparison preview */}
            <View style={styles.rateRow}>
              <View style={styles.rateCell}>
                <Text style={styles.rateCellLabel}>YOUR RATE</Text>
                <Text style={styles.rateCellValue}>— %</Text>
              </View>
              <View style={styles.rateSep} />
              <View style={styles.rateCell}>
                <Text style={styles.rateCellLabel}>MARKET RATE</Text>
                <Text style={[styles.rateCellValue, { color: colors.green }]}>— %</Text>
              </View>
              <View style={styles.rateSep} />
              <View style={styles.rateCell}>
                <Text style={styles.rateCellLabel}>HIDDEN FEES</Text>
                <Text style={[styles.rateCellValue, { color: colors.danger }]}>£ —</Text>
              </View>
            </View>

            <View style={styles.cardCta}>
              <Text style={styles.cardCtaText}>CALCULATE</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.accent} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Recent analyses ──────────────────────────────── */}
        {scanHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT ANALYSES</Text>
            {scanHistory.slice(0, 5).map((scan) => (
              <View key={scan.id} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Ionicons name="document-text-outline" size={17} color={colors.textMuted} />
                  <View style={{ marginLeft: spacing.sm }}>
                    <Text style={styles.historyLabel}>{AGREEMENT_LABELS[scan.agreementType]}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(scan.timestamp).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.scorePill,
                  scan.concernScore >= 70 ? styles.scoreHigh :
                  scan.concernScore >= 40 ? styles.scoreMed : styles.scoreLow,
                ]}>
                  <Text style={[
                    styles.scoreText,
                    { color: scan.concernScore >= 70 ? colors.danger : scan.concernScore >= 40 ? colors.amber : colors.green },
                  ]}>
                    {scan.concernScore}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Legal ruling callout ─────────────────────────── */}
        <View style={styles.rulingBox}>
          <View style={styles.rulingHeader}>
            <Ionicons name="library-outline" size={14} color={colors.textMuted} />
            <Text style={styles.rulingCase}>Johnson v Firstrand Bank Ltd [2024]</Text>
          </View>
          <Text style={styles.rulingText}>
            The Supreme Court held that brokers who receive commissions from lenders owe a fiduciary duty to the borrower, and must obtain informed consent. Where they don't, borrowers may be entitled to reclaim the commission paid. However, when commissions paid are excessive, the likelihood of disclosure is remote due to the sums involved. We are here to educate, inform and expose these practices. 
          </Text>
        </View>

        {/* ── Disclaimer ───────────────────────────────────── */}
        <Text style={styles.disclaimer}>
          Veltro Expose is an information tool only. It does not constitute legal or financial advice. Results are indicative. Seek qualified legal counsel or the assistance of a credible finance broker before taking action.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.black },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: spacing.page, paddingBottom: 48 },

  // Logo
  logoRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl },
  logoTextRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  brand:        { fontSize: typography.xl, fontWeight: typography.black, color: colors.text, letterSpacing: 2 },
  brandSub:     { fontSize: typography.xl, fontWeight: typography.black, color: colors.accent, letterSpacing: 2 },
  fcaBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: colors.accentBorder },
  fcaBadgeText: { fontSize: 8, fontWeight: typography.bold, color: colors.accent, letterSpacing: 1 },

  // Hero
  hero:        { marginTop: spacing.xxl, marginBottom: spacing.lg },
  heroEyebrow: { fontSize: typography.xs, color: colors.accent, fontWeight: typography.semibold, letterSpacing: 1.5, marginBottom: spacing.sm },
  heroTitle:   { fontSize: 38, fontWeight: typography.black, color: colors.text, lineHeight: 42 },
  heroAccent:  { color: colors.accent },
  heroSub:     { fontSize: typography.base, color: colors.textMuted, lineHeight: 20 },
  heroSubBold: { color: colors.text, fontWeight: typography.medium },

  // COMMISSION paint-stroke underline
  heroAccentBlock: {
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  heroStrokeTilt: {
    marginTop: 3,
    transform: [{ rotate: '-1.5deg' }],
  },
  heroStrokeReveal: {
    overflow: 'hidden',
  },
  heroStrokeBody: {
    width: '100%',
    height: 10,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 3,
  },
  heroStrokeSheen: {
    position: 'absolute',
    top: 2,
    left: '20%',
    width: '55%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 2,
  },

  // Animated insight panel
  insightPanel: {
    minHeight: 220,
    backgroundColor: colors.surface2,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    overflow: 'hidden',
    position: 'relative',
  },
  // Decorative circles
  panelCircle1: {
    position: 'absolute', top: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: colors.accentSoft,
  },
  panelCircle2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(205,254,0,0.04)',
  },
  panelCircle3: {
    position: 'absolute', top: '40%', right: 60,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(205,254,0,0.06)',
  },
  panelGlyph: {
    position: 'absolute', bottom: -16, right: 16,
    fontSize: 120, fontWeight: typography.black,
    color: 'rgba(205,254,0,0.04)',
    lineHeight: 120,
  },
  // Live badge
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.accentBorder,
    marginBottom: spacing.md,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.accent,
  },
  liveBadgeText: { fontSize: typography.xs, color: colors.accent, fontWeight: typography.semibold, letterSpacing: 0.5 },
  liveBadgeYou:  { fontWeight: typography.black, color: colors.accent },
  // Stat
  insightValue: {
    fontSize: 56, fontWeight: typography.black,
    color: colors.text, lineHeight: 60,
    marginBottom: spacing.sm,
  },
  insightProgressBg: {
    height: 3, backgroundColor: colors.surface3,
    borderRadius: 2, marginBottom: spacing.md, overflow: 'hidden',
  },
  insightProgressFill: {
    height: 3, backgroundColor: colors.accent, borderRadius: 2,
  },
  insightLabel: {
    fontSize: typography.sm, color: colors.textMuted,
    lineHeight: 18, marginBottom: spacing.md,
  },
  insightDots: { flexDirection: 'row', gap: 5 },
  dot:         { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
  dotActive:   { backgroundColor: colors.accent, width: 16 },

  // How it works
  section:      { marginTop: spacing.xxl, marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.xs, color: colors.textDim, fontWeight: typography.semibold, letterSpacing: 1.4, marginBottom: spacing.lg },
  step:         { flexDirection: 'row', marginBottom: 0 },
  stepLeft:     { alignItems: 'center', marginRight: spacing.md, width: 36 },
  stepIcon:     { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder, alignItems: 'center', justifyContent: 'center' },
  stepConnector:{ width: 1, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  stepBody:     { flex: 1, paddingBottom: spacing.lg },
  stepNum:      { fontSize: typography.xs, color: colors.textDim, fontWeight: typography.bold, letterSpacing: 1, marginBottom: 2 },
  stepTitle:    { fontSize: typography.md, fontWeight: typography.bold, color: colors.text, marginBottom: 4 },
  stepDesc:     { fontSize: typography.sm, color: colors.textMuted, lineHeight: 17 },

  // Cards shared
  card:           { borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, overflow: 'hidden' },
  cardPrimary:    { backgroundColor: colors.surface2, borderColor: colors.accentBorder },
  cardSecondary:  { backgroundColor: colors.surface2, borderColor: colors.border },
  cardTopRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  modeBadge:      { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  modeBadgeText:  { fontSize: typography.xs, color: colors.accent, fontWeight: typography.semibold, letterSpacing: 1 },
  modeBadgeMuted: { backgroundColor: colors.surface3 },
  cardIconCircle:      { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  cardIconCircleMuted: { backgroundColor: colors.surface3, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: typography.xxl, fontWeight: typography.black, color: colors.text, lineHeight: 34, marginBottom: spacing.sm },
  cardDesc:  { fontSize: typography.sm, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.lg },
  cardCta:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  cardCtaText: { fontSize: typography.xs, color: colors.accent, fontWeight: typography.bold, letterSpacing: 1.2 },

  // Glow ring on scanner card
  glowRing: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },

  // Scan preview animation
  scanPreview: {
    height: 72,
    backgroundColor: colors.surface3,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    gap: spacing.xs,
    justifyContent: 'space-evenly',
  },
  docLine:    { height: 2, backgroundColor: colors.textDim, borderRadius: 1 },
  scanCursor: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },

  // Rate comparison preview
  rateRow:         { flexDirection: 'row', backgroundColor: colors.surface3, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.md, gap: 0 },
  rateCell:        { flex: 1, alignItems: 'center' },
  rateCellLabel:   { fontSize: 8, color: colors.textDim, fontWeight: typography.semibold, letterSpacing: 0.8, marginBottom: 4 },
  rateCellValue:   { fontSize: typography.md, fontWeight: typography.black, color: colors.textMuted },
  rateSep:         { width: 1, backgroundColor: colors.border, marginVertical: 2 },

  // History
  historyRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyLabel:{ fontSize: typography.sm, color: colors.text, fontWeight: typography.medium },
  historyDate: { fontSize: typography.xs, color: colors.textDim, marginTop: 2 },
  scorePill:   { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, minWidth: 36, alignItems: 'center' },
  scoreHigh:   { backgroundColor: 'rgba(232,64,42,0.12)' },
  scoreMed:    { backgroundColor: 'rgba(245,166,35,0.12)' },
  scoreLow:    { backgroundColor: 'rgba(46,204,113,0.12)' },
  scoreText:   { fontSize: typography.sm, fontWeight: typography.black },

  // Ruling callout
  rulingBox:    { marginTop: spacing.xxl, backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl },
  rulingHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  rulingCase:   { fontSize: typography.sm, fontWeight: typography.bold, color: colors.text },
  rulingText:   { fontSize: typography.sm, color: colors.textMuted, lineHeight: 18 },

  // Disclaimer
  disclaimer: { marginTop: spacing.xl, fontSize: typography.xs, color: colors.textDim, lineHeight: 16, textAlign: 'center' },
});

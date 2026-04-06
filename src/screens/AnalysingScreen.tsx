import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';
import { RootStackParamList } from '../types';
import { useExposeStore } from '../store/useExposeStore';
import { analyseDocument } from '../services/anthropic';

const ND = Platform.OS !== 'web';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STEPS = [
  'Reading document structure...',
  'Identifying agreement terms...',
  'Checking commission disclosures...',
  'Analysing interest rate calculations...',
  'Reviewing FCA compliance...',
  'Generating report...',
];

export default function AnalysingScreen() {
  const navigation = useNavigation<Nav>();
  const { documentUri, documentMime, selectedAgreementType, setScanResult } = useExposeStore();
  const pulse = useRef(new Animated.Value(0.4)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const [step, setStep] = React.useState(0);

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: ND }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: ND }),
      ]),
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 2000, useNativeDriver: ND }),
    ).start();

    // Step cycling
    const stepInterval = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 2200);

    // Run analysis
    async function run() {
      try {
        if (!documentUri || !documentMime) {
          throw new Error('No document selected.');
        }
        const result = await analyseDocument(documentUri, documentMime, selectedAgreementType);
        setScanResult(result);
        navigation.replace('Results');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
        Alert.alert('Analysis Failed', message, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    }
    run();

    return () => clearInterval(stepInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Animated ring */}
        <View style={styles.ringWrapper}>
          <Animated.View style={[styles.ring, styles.ringOuter, { opacity: pulse }]} />
          <Animated.View style={[styles.ring, styles.ringMid, { opacity: pulse, transform: [{ rotate: spin }] }]} />
          <View style={styles.ringInner}>
            <Text style={styles.ringLabel}>AI</Text>
          </View>
        </View>

        <Text style={styles.title}>Analysing Document</Text>
        <Text style={styles.subtitle}>Powered by Claude AI</Text>

        <Animated.Text style={[styles.step, { opacity: pulse }]}>
          {STEPS[step]}
        </Animated.Text>

        <Text style={styles.disclaimer}>
          This may take up to 30 seconds{'\n'}for complex documents
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.black },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.page },
  ringWrapper: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxxl },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1 },
  ringOuter: { width: 140, height: 140, borderColor: colors.accentBorder },
  ringMid: { width: 110, height: 110, borderColor: colors.accent, borderStyle: 'dashed' },
  ringInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: { fontSize: typography.base, fontWeight: typography.black, color: colors.accent, letterSpacing: 1 },
  title: { fontSize: typography.xl, fontWeight: typography.black, color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sm, color: colors.accent, marginBottom: spacing.xxl, letterSpacing: 0.5 },
  step: { fontSize: typography.sm, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xxxl },
  disclaimer: { fontSize: typography.xs, color: colors.textDim, textAlign: 'center', lineHeight: 18 },
});

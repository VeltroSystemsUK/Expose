import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, radius, typography } from '../theme';
import { RootStackParamList } from '../types';
import { useExposeStore } from '../store/useExposeStore';
import AgreementTypeSelector from '../components/AgreementTypeSelector';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ScannerScreen() {
  const navigation = useNavigation<Nav>();
  const { selectedAgreementType, setAgreementType, setDocument, documentUri, documentMime } = useExposeStore();
  const [previewUri, setPreviewUri] = useState<string | null>(documentUri);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      setDocument(asset.uri, mime);
      setPreviewUri(asset.uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setDocument(asset.uri, 'image/jpeg');
      setPreviewUri(asset.uri);
    }
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setDocument(asset.uri, 'application/pdf');
      setPreviewUri(null);
    }
  }

  function analyse() {
    if (!documentUri) {
      Alert.alert('No document', 'Please select a document or take a photo first.');
      return;
    }
    navigation.navigate('Analysing');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MODE 01</Text>
        </View>
        <Text style={styles.title}>Document{'\n'}Scanner</Text>
        <Text style={styles.subtitle}>Upload your finance agreement for AI analysis</Text>

        {/* Agreement type */}
        <Text style={styles.label}>AGREEMENT TYPE</Text>
        <AgreementTypeSelector selected={selectedAgreementType} onSelect={setAgreementType} />

        {/* Upload area */}
        <Text style={[styles.label, { marginTop: spacing.xl }]}>DOCUMENT</Text>

        {previewUri ? (
          <View style={styles.preview}>
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity style={styles.previewRemove} onPress={() => { setPreviewUri(null); setDocument('', ''); }}>
              <Ionicons name="close-circle" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ) : documentUri && !previewUri ? (
          <View style={styles.pdfRow}>
            <Ionicons name="document-text" size={32} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.pdfName} numberOfLines={1}>PDF document selected</Text>
              <Text style={styles.pdfSub}>Ready for analysis</Text>
            </View>
            <TouchableOpacity onPress={() => { setDocument('', ''); }}>
              <Ionicons name="close-circle" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadArea}>
            <Ionicons name="cloud-upload-outline" size={40} color={colors.textDim} />
            <Text style={styles.uploadText}>No document selected</Text>
            <Text style={styles.uploadSub}>PDF or image of your agreement</Text>
          </View>
        )}

        {/* Upload buttons */}
        <View style={styles.uploadButtons}>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument} activeOpacity={0.7}>
            <Ionicons name="document-outline" size={20} color={colors.text} />
            <Text style={styles.uploadBtnText}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.7}>
            <Ionicons name="image-outline" size={20} color={colors.text} />
            <Text style={styles.uploadBtnText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={20} color={colors.text} />
            <Text style={styles.uploadBtnText}>Camera</Text>
          </TouchableOpacity>
        </View>

        {/* Analyse CTA */}
        <TouchableOpacity
          style={[styles.analyseBtn, !documentUri && styles.analyseBtnDisabled]}
          onPress={analyse}
          activeOpacity={0.85}
        >
          <Text style={styles.analyseBtnText}>ANALYSE DOCUMENT</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.black} />
        </TouchableOpacity>

        <Text style={styles.hint}>
          Your document is processed securely and never stored.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.black },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.page, paddingBottom: spacing.xxxl },
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
  title: { fontSize: typography.xxl, fontWeight: typography.black, color: colors.text, lineHeight: 34, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.sm, color: colors.textMuted, marginBottom: spacing.xl },
  label: { fontSize: typography.xs, color: colors.textDim, fontWeight: typography.semibold, letterSpacing: 1.2, marginBottom: spacing.sm },
  uploadArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
  },
  uploadText: { fontSize: typography.base, color: colors.textMuted },
  uploadSub: { fontSize: typography.sm, color: colors.textDim },
  preview: { borderRadius: radius.lg, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: 220 },
  previewRemove: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  pdfName: { fontSize: typography.base, color: colors.text, fontWeight: typography.medium },
  pdfSub: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  uploadButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadBtnText: { fontSize: typography.sm, color: colors.text, fontWeight: typography.medium },
  analyseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  analyseBtnDisabled: { opacity: 0.4 },
  analyseBtnText: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.black, letterSpacing: 1 },
  hint: { fontSize: typography.xs, color: colors.textDim, textAlign: 'center', marginTop: spacing.md },
});

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { AgreementType, LenderCategory, LenderProfile } from '../types';
import { LENDERS } from '../data/lenders';

interface Props {
  selected: LenderProfile | null;
  agreementType: AgreementType;
  onSelect: (lender: LenderProfile | null) => void;
}

const CATEGORY_ORDER: LenderCategory[] = [
  'major_bank',
  'specialist_bank',
  'challenger_bank',
  'asset_finance',
  'alternative_lender',
  'invoice_finance',
  'mca',
  'trade_finance',
  'development_finance',
];

const CATEGORY_LABELS: Record<LenderCategory, string> = {
  major_bank: 'MAJOR BANKS',
  specialist_bank: 'SPECIALIST BANKS',
  challenger_bank: 'CHALLENGER BANKS',
  asset_finance: 'ASSET FINANCE SPECIALISTS',
  alternative_lender: 'ALTERNATIVE LENDERS',
  invoice_finance: 'INVOICE FINANCE',
  mca: 'MERCHANT CASH ADVANCE',
  trade_finance: 'TRADE FINANCE',
  development_finance: 'DEVELOPMENT FINANCE',
};

export default function LenderPicker({ selected, agreementType, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const relevant = useMemo(
    () => LENDERS.filter((l) => l.products.includes(agreementType)),
    [agreementType],
  );

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return relevant.filter((l) => l.name.toLowerCase().includes(q));
  }, [relevant, query]);

  // Group by category for browsing mode
  const grouped = useMemo(() => {
    const map = new Map<LenderCategory | 'uncategorised', LenderProfile[]>();
    for (const lender of relevant) {
      const key = lender.category ?? 'uncategorised';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(lender);
    }
    return map;
  }, [relevant]);

  function pick(lender: LenderProfile | null) {
    onSelect(lender);
    setOpen(false);
    setQuery('');
  }

  function renderLenderRow(l: LenderProfile) {
    const active = selected?.id === l.id;
    return (
      <TouchableOpacity
        key={l.id}
        style={[styles.item, active && styles.itemActive]}
        onPress={() => pick(l)}
        activeOpacity={0.7}
      >
        <View style={styles.itemLeft}>
          <Text style={[styles.itemName, active && styles.itemNameActive]}>{l.name}</Text>
          <View style={styles.itemMeta}>
            {l.fcaRef && <Text style={styles.itemMetaText}>FCA {l.fcaRef}</Text>}
            {l.isMCA && (
              <View style={styles.mcaBadge}>
                <Text style={styles.mcaBadgeText}>MCA</Text>
              </View>
            )}
          </View>
        </View>
        {active && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Ionicons name="business-outline" size={18} color={selected ? colors.accent : colors.textDim} />
        <Text style={[styles.triggerText, selected && styles.triggerTextSelected]} numberOfLines={1}>
          {selected ? selected.name : 'Select lender...'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textDim} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Lender</Text>
            <TouchableOpacity onPress={() => { setOpen(false); setQuery(''); }} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={colors.textDim} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search lenders..."
              placeholderTextColor={colors.textDim}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textDim} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {/* Unknown / not listed option */}
            <TouchableOpacity style={styles.item} onPress={() => pick(null)} activeOpacity={0.7}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>Unknown / Not Listed</Text>
                <Text style={styles.itemSub}>We'll use market averages</Text>
              </View>
              {selected === null && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Search results — flat list */}
            {searchResults !== null ? (
              searchResults.length === 0 ? (
                <Text style={styles.noResults}>No lenders found for "{query}"</Text>
              ) : (
                searchResults.map(renderLenderRow)
              )
            ) : (
              /* Browsing mode — grouped by category */
              CATEGORY_ORDER.map((cat) => {
                const items = grouped.get(cat);
                if (!items || items.length === 0) return null;
                return (
                  <View key={cat}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionHeaderText}>{CATEGORY_LABELS[cat]}</Text>
                      <Text style={styles.sectionCount}>{items.length}</Text>
                    </View>
                    {items.map(renderLenderRow)}
                  </View>
                );
              })
            )}

            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  triggerText: { flex: 1, fontSize: typography.base, color: colors.textDim },
  triggerTextSelected: { color: colors.text },
  modal: { flex: 1, backgroundColor: colors.black },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: typography.md, fontWeight: typography.bold, color: colors.text },
  closeBtn: { padding: spacing.xs },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.page,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.base,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  list: { flex: 1 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.black,
  },
  sectionHeaderText: {
    fontSize: typography.xs,
    color: colors.accent,
    fontWeight: typography.bold,
    letterSpacing: 1.2,
  },
  sectionCount: {
    fontSize: typography.xs,
    color: colors.textDim,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface3,
  },
  itemActive: {
    backgroundColor: colors.accentSoft,
  },
  itemLeft: { flex: 1 },
  itemName: { fontSize: typography.base, color: colors.text, fontWeight: typography.medium },
  itemNameActive: { color: colors.accent },
  itemSub: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  itemMetaText: { fontSize: typography.xs, color: colors.textDim },
  mcaBadge: {
    backgroundColor: colors.amberSoft,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  mcaBadgeText: { fontSize: 9, color: colors.amber, fontWeight: typography.bold, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  noResults: { padding: spacing.xl, textAlign: 'center', color: colors.textMuted, fontSize: typography.sm },
});

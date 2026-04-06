import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { AgreementType } from '../types';

const TYPES: { key: AgreementType; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  { key: 'asset_finance',   label: 'Asset Finance',          icon: 'business-outline',       desc: 'Equipment, machinery & vehicles' },
  { key: 'business_loan',   label: 'Business Loan',          icon: 'cash-outline',            desc: 'Term loans & working capital' },
  { key: 'mca',             label: 'Merchant Cash Advance',  icon: 'flash-outline',           desc: 'Revenue-based / factor rate deals' },
  { key: 'invoice_finance', label: 'Invoice Finance',        icon: 'document-text-outline',   desc: 'Factoring & invoice discounting' },
  { key: 'hire_purchase',   label: 'Hire Purchase',          icon: 'car-outline',             desc: 'Hire purchase & conditional sale' },
];

interface Props {
  selected: AgreementType;
  onSelect: (type: AgreementType) => void;
}

export default function AgreementTypeSelector({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const selectedType = TYPES.find(t => t.key === selected) ?? TYPES[0];

  return (
    <View style={styles.container}>
      {/* ── Trigger ── */}
      <TouchableOpacity
        style={[styles.trigger, open && styles.triggerOpen]}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.8}
      >
        <View style={[styles.triggerIcon, open && styles.triggerIconOpen]}>
          <Ionicons
            name={selectedType.icon}
            size={16}
            color={open ? colors.black : colors.accent}
          />
        </View>
        <View style={styles.triggerText}>
          <Text style={styles.triggerLabel}>{selectedType.label}</Text>
          <Text style={styles.triggerDesc}>{selectedType.desc}</Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={open ? colors.accent : colors.textMuted}
        />
      </TouchableOpacity>

      {/* ── Options ── */}
      {open && (
        <View style={styles.dropdown}>
          {TYPES.map((t, i) => {
            const active = t.key === selected;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.option,
                  i > 0 && styles.optionBorder,
                  active && styles.optionActive,
                ]}
                onPress={() => { onSelect(t.key); setOpen(false); }}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                  <Ionicons
                    name={t.icon}
                    size={15}
                    color={active ? colors.black : colors.textMuted}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={styles.optionDesc}>{t.desc}</Text>
                </View>
                {active && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xs },

  // Trigger row
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  triggerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: colors.accent,
    borderBottomColor: colors.border,
  },
  triggerIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerIconOpen: {
    backgroundColor: colors.accent,
  },
  triggerText: { flex: 1 },
  triggerLabel: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  triggerDesc: {
    fontSize: typography.xs,
    color: colors.textDim,
    marginTop: 1,
  },

  // Dropdown list
  dropdown: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.accent,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  optionBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.accentSoft,
  },
  optionIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: {
    backgroundColor: colors.accent,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textMuted,
  },
  optionLabelActive: {
    color: colors.text,
    fontWeight: typography.semibold,
  },
  optionDesc: {
    fontSize: typography.xs,
    color: colors.textDim,
    marginTop: 1,
  },
});

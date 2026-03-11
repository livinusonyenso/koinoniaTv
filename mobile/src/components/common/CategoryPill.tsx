import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress: () => void;
}

export const CategoryPill: React.FC<Props> = ({ label, active = false, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.pill, active && styles.active]}
    activeOpacity={0.75}
  >
    <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: 'transparent',
  },
  active: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  label: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '500' },
  activeLabel: { color: Colors.dark, fontWeight: '700' },
});

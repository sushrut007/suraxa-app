import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Card, ConfirmDialog, PrimaryButton, SectionHeader } from '../../src/components';
import { useTheme } from '../../src/theme';

export default function RelaysScreen() {
  const { colors, spacing, typography } = useTheme();
  const [showUvcConfirm, setShowUvcConfirm] = useState(false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.md }]}
    >
      <SectionHeader title="8-Channel Relays" subtitle="UV-C Lamps & Auxiliary Equipment" />

      <Card style={{ marginBottom: spacing.md }}>
        <Text
          style={[styles.title, { color: colors.textPrimary, fontSize: typography.h3.fontSize }]}
        >
          Relay Architecture & Safety
        </Text>
        <Text
          style={[
            styles.description,
            {
              color: colors.textSecondary,
              fontSize: typography.bodyMedium.fontSize,
              lineHeight: typography.bodyMedium.lineHeight,
              marginVertical: spacing.xs,
            },
          ]}
        >
          Relay ON status is displayed only after controller confirmation over the state topic. UV-C
          relays enforce an explicit confirmation dialog before energizing.
        </Text>
        <PrimaryButton
          title="Simulate UV-C Confirmation Dialog"
          variant="danger"
          onPress={() => setShowUvcConfirm(true)}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <ConfirmDialog
        visible={showUvcConfirm}
        isHazard
        title="Energize UV-C Relay?"
        message="UV-C radiation can cause severe eye and skin damage. Ensure all personnel are cleared from the chamber before activation."
        confirmText="Confirm & Energize"
        cancelText="Abort"
        onConfirm={() => setShowUvcConfirm(false)}
        onCancel={() => setShowUvcConfirm(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {},
  title: {
    fontWeight: '700',
  },
  description: {},
});

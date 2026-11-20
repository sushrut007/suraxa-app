import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Card, EmptyState, SectionHeader } from '../../src/components';
import { useTheme } from '../../src/theme';

export default function SettingsScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.md }]}
    >
      <SectionHeader title="Settings & Provisioning" subtitle="Device Management & Network Setup" />

      <Card style={{ marginBottom: spacing.md }}>
        <Text
          style={[styles.title, { color: colors.textPrimary, fontSize: typography.h3.fontSize }]}
        >
          One-Time QR Wi-Fi Provisioning
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
          Camera-based QR reader parses engraved device identity and initiates BLE/SoftAP Wi-Fi
          provisioning credentials transfer to ESP32-S3 non-volatile storage (NVS).
        </Text>
      </Card>

      <EmptyState
        icon="qrcode-scan"
        title="Pair Additional Controller"
        description="Scan the QR code laser-engraved on your Suraxa unit enclosure to bind new hardware."
        actionLabel="Scan Device QR"
        onAction={() => {}}
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

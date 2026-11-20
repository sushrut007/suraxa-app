import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, SectionHeader, Skeleton, StatusPill } from '../../src/components';
import { useTheme } from '../../src/theme';

export default function DashboardScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.md }]}
    >
      <SectionHeader
        title="Environmental Telemetry"
        subtitle="AHT20 Sensor Real-Time Feed"
        rightAction={<StatusPill status="online" size="small" />}
      />

      <Card style={[styles.cardSpacing, { marginBottom: spacing.md }]}>
        <Text
          style={[
            styles.cardTitle,
            { color: colors.textPrimary, fontSize: typography.h3.fontSize },
          ]}
        >
          Microcontroller & Sensor Link
        </Text>
        <Text
          style={[
            styles.cardDescription,
            {
              color: colors.textSecondary,
              fontSize: typography.bodyMedium.fontSize,
              lineHeight: typography.bodyMedium.lineHeight,
              marginVertical: spacing.xs,
            },
          ]}
        >
          ESP32-S3 live environmental monitoring ready. Telemetry data will automatically populate
          via MQTT topic suraxa/&lt;id&gt;/telemetry.
        </Text>
        <View style={styles.skeletonGroup}>
          <Skeleton height={28} width="60%" style={{ marginBottom: spacing.xs }} />
          <Skeleton height={18} width="40%" />
        </View>
      </Card>

      <SectionHeader title="Disinfection Chamber" subtitle="Operational Safety & Status" />

      <Card elevated style={{ marginBottom: spacing.md }}>
        <Text
          style={[
            styles.cardTitle,
            { color: colors.textPrimary, fontSize: typography.h3.fontSize },
          ]}
        >
          Safety Interlock Monitored
        </Text>
        <Text
          style={[
            styles.cardDescription,
            {
              color: colors.textSecondary,
              fontSize: typography.bodyMedium.fontSize,
              lineHeight: typography.bodyMedium.lineHeight,
              marginTop: spacing.xs,
            },
          ]}
        >
          Firmware interlocks prevent UV-C exposure during servicing or enclosure access.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {},
  cardSpacing: {},
  cardTitle: {
    fontWeight: '700',
  },
  cardDescription: {},
  skeletonGroup: {
    marginTop: 8,
  },
});

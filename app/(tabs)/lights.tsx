import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Card, SectionHeader } from '../../src/components';
import { useTheme } from '../../src/theme';

export default function LightsScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.md }]}
    >
      <SectionHeader
        title="Addressable LED Strips"
        subtitle="2× Independent Visual Feedback Channels"
      />

      <Card style={{ marginBottom: spacing.md }}>
        <Text
          style={[styles.title, { color: colors.textPrimary, fontSize: typography.h3.fontSize }]}
        >
          WS2812B / SK6812 Dual Control
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
          Per-strip power, brightness, RGB color picker, and selectable preset dynamic lighting
          effects. Slider commands throttled to 1 per 150 ms with release guarantee.
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
  title: {
    fontWeight: '700',
  },
  description: {},
});

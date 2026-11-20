import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { selectActiveFault, useDeviceStore } from '../../../store';
import { useTheme } from '../../../theme';

export const FaultBanner = memo(function FaultBanner() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  // Strict Zustand selector: only re-renders when active fault changes
  const fault = useDeviceStore(selectActiveFault);

  if (!fault) {
    return null;
  }

  return (
    <View
      testID="fault-banner"
      style={[
        styles.container,
        {
          backgroundColor: colors.dangerLight,
          borderColor: colors.danger,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="alert-octagon" size={24} color={colors.danger} />
        <Text
          testID="fault-banner-title"
          style={[
            styles.titleText,
            {
              color: colors.dangerDark,
              fontSize: typography.h3.fontSize,
              fontWeight: '700',
              marginLeft: spacing.xs,
            },
          ]}
        >
          CRITICAL HARDWARE FAULT: {fault}
        </Text>
      </View>

      <Text
        testID="fault-banner-description"
        style={[
          styles.descriptionText,
          {
            color: colors.dangerDark,
            fontSize: typography.bodyMedium.fontSize,
            lineHeight: typography.bodyMedium.lineHeight,
            marginTop: spacing.xxs,
          },
        ]}
      >
        Firmware safety interlock is active. UV-C disinfection relays and high-power actuators are
        mechanically isolated to prevent hazards. Clear physical interlocks or check sensor wiring
        to resume operation.
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    letterSpacing: -0.2,
    flex: 1,
  },
  descriptionText: {
    opacity: 0.95,
  },
});

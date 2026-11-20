import React, { memo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export type StatusPillType = 'online' | 'offline' | 'fault';

export interface StatusPillProps {
  status: StatusPillType;
  label?: string;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const StatusPill = memo<StatusPillProps>(function StatusPill({
  status,
  label,
  size = 'medium',
  style,
  testID = 'status-pill',
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          bg: colors.successLight,
          dot: colors.success,
          text: colors.successDark,
          defaultLabel: 'ONLINE',
          border: colors.success,
        };
      case 'fault':
        return {
          bg: colors.dangerLight,
          dot: colors.danger,
          text: colors.dangerDark,
          defaultLabel: 'FAULT',
          border: colors.danger,
        };
      case 'offline':
      default:
        return {
          bg: colors.offlineLight,
          dot: colors.offline,
          text: colors.offlineDark,
          defaultLabel: 'OFFLINE',
          border: colors.offline,
        };
    }
  };

  const config = getStatusConfig();
  const displayLabel = label || config.defaultLabel;
  const isSmall = size === 'small';

  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`Device status: ${displayLabel}`}
      style={[
        styles.pillContainer,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          borderRadius: borderRadius.pill,
          paddingHorizontal: isSmall ? spacing.xs : spacing.sm,
          paddingVertical: isSmall ? 3 : spacing.xxs,
        },
        style,
      ]}
    >
      <View
        testID={`${testID}-dot`}
        style={[
          styles.dot,
          {
            backgroundColor: config.dot,
            width: isSmall ? 6 : 8,
            height: isSmall ? 6 : 8,
            borderRadius: borderRadius.pill,
            marginRight: isSmall ? 4 : spacing.xs,
          },
        ]}
      />
      <Text
        testID={`${testID}-label`}
        style={[
          styles.labelText,
          {
            color: config.text,
            fontSize: isSmall ? 10 : typography.labelCaps.fontSize,
            lineHeight: isSmall ? 12 : typography.labelCaps.lineHeight,
            fontWeight: typography.labelCaps.fontWeight,
            letterSpacing: typography.labelCaps.letterSpacing,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  dot: {
    borderRadius: 9999,
  },
  labelText: {
    textTransform: 'uppercase',
  },
});

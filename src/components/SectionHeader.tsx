import React, { memo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const SectionHeader = memo<SectionHeaderProps>(function SectionHeader({
  title,
  subtitle,
  rightAction,
  style,
  testID,
}) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View testID={testID} style={[styles.container, { marginBottom: spacing.sm }, style]}>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            {
              color: colors.textPrimary,
              fontSize: typography.h3.fontSize,
              lineHeight: typography.h3.lineHeight,
              fontWeight: typography.h3.fontWeight,
            },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
                fontSize: typography.bodySmall.fontSize,
                lineHeight: typography.bodySmall.lineHeight,
                marginTop: spacing.xxs,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    letterSpacing: -0.2,
  },
  subtitle: {},
  rightAction: {
    marginLeft: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

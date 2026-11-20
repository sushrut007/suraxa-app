import React, { memo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const EmptyState = memo<EmptyStateProps>(function EmptyState({
  icon = 'shield-alert-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
  testID = 'empty-state',
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderRadius: borderRadius.xl,
          padding: spacing.xxl,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: borderRadius.pill,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={40} color={colors.primary} />
      </View>
      <Text
        style={[
          styles.title,
          {
            color: colors.textPrimary,
            fontSize: typography.h3.fontSize,
            lineHeight: typography.h3.lineHeight,
            fontWeight: typography.h3.fontWeight,
            marginBottom: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            styles.description,
            {
              color: colors.textSecondary,
              fontSize: typography.bodyMedium.fontSize,
              lineHeight: typography.bodyMedium.lineHeight,
              marginBottom: actionLabel ? spacing.xl : 0,
            },
          ]}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          testID={`${testID}-action`}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    textAlign: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 320,
  },
});

import React, { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const PrimaryButton = memo<PrimaryButtonProps>(function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}) {
  const { colors, spacing, borderRadius, typography, touchTarget } = useTheme();

  const getVariantStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    spinnerColor: string;
  } => {
    switch (variant) {
      case 'danger':
        return {
          container: {
            backgroundColor: colors.danger,
            borderColor: colors.danger,
          },
          text: {
            color: colors.dangerContrast,
          },
          spinnerColor: colors.dangerContrast,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.primaryLight,
            borderColor: colors.primaryLight,
          },
          text: {
            color: colors.primaryDark,
          },
          spinnerColor: colors.primaryDark,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: colors.cardBorder,
            borderWidth: 1.5,
          },
          text: {
            color: colors.textPrimary,
          },
          spinnerColor: colors.textPrimary,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          text: {
            color: colors.primary,
          },
          spinnerColor: colors.primary,
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
          text: {
            color: colors.primaryContrast,
          },
          spinnerColor: colors.primaryContrast,
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: colors.ripple }}
      style={({ pressed }) => [
        styles.baseContainer,
        {
          minHeight: touchTarget.minHeight,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        },
        variantStyle.container,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.spinnerColor}
          testID={`${testID || 'btn'}-spinner`}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon ? (
            <View style={[styles.iconWrapper, { marginRight: spacing.xs }]}>{icon}</View>
          ) : null}
          <Text
            style={[
              styles.baseText,
              {
                fontSize: typography.button.fontSize,
                fontWeight: typography.button.fontWeight,
                lineHeight: typography.button.lineHeight,
              },
              variantStyle.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});

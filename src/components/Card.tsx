import React, { memo } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: PressableProps['onPress'];
  elevated?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export const Card = memo<CardProps>(function Card({
  children,
  style,
  onPress,
  elevated = false,
  testID,
  accessibilityLabel,
}) {
  const { colors, spacing, borderRadius } = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: elevated ? colors.cardElevated : colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: elevated ? 4 : 1 },
    shadowOpacity: elevated ? 0.08 : 0.03,
    shadowRadius: elevated ? 8 : 4,
    elevation: elevated ? 3 : 1,
  };

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        android_ripple={{ color: colors.ripple }}
        style={({ pressed }) => [
          styles.pressableContainer,
          containerStyle,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} accessibilityLabel={accessibilityLabel} style={[containerStyle, style]}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  pressableContainer: {
    minHeight: 48,
    minWidth: 48,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
});

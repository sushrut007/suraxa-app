import React, { memo, useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Skeleton = memo<SkeletonProps>(function Skeleton({
  width = '100%',
  height = 20,
  borderRadius: customRadius,
  style,
  testID = 'skeleton-loader',
}) {
  const { colors, borderRadius } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: customRadius ?? borderRadius.sm,
          backgroundColor: colors.cardBorder,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

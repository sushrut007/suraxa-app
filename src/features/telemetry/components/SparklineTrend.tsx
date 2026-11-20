import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export interface SparklineTrendProps {
  data: number[];
  color: string;
  fillColor?: string;
  height?: number;
  width?: number;
  testID?: string;
}

export const SparklineTrend = memo<SparklineTrendProps>(function SparklineTrend({
  data,
  color,
  fillColor,
  height = 50,
  width = 280,
  testID = 'sparkline-trend',
}) {
  if (!data || data.length < 2) {
    return <View testID={testID} style={[styles.emptyContainer, { height }]} />;
  }

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const paddingY = 6;
  const usableHeight = height - paddingY * 2;
  const stepX = width / (data.length - 1);

  const points = data.map((val, idx) => {
    const x = idx * stepX;
    const normalizedY = (val - minVal) / range;
    const y = height - paddingY - normalizedY * usableHeight;
    return { x, y };
  });

  // Construct SVG line path
  const linePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Construct closed area path for gradient fill
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;

  const gradientId = `grad_${color.replace('#', '')}`;

  return (
    <View testID={testID} style={[styles.container, { height }]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={fillColor || color} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={fillColor || color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        <Path d={areaPath} fill={`url(#${gradientId})`} />
        <Path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  emptyContainer: {
    width: '100%',
  },
});

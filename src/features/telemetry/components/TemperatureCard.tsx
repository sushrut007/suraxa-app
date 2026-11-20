import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../../components';
import {
  selectActiveDeviceStatus,
  selectActiveLastUpdated,
  selectActiveTelemetryHistory,
  selectActiveTemperature,
  selectTemperatureUnit,
  selectToggleTemperatureUnit,
  useDeviceStore,
  useSettingsStore,
} from '../../../store';
import { useTheme } from '../../../theme';
import { formatTemperature, isDataStale } from '../../../utils/formatters';
import { SparklineTrend } from './SparklineTrend';

export const TemperatureCard = memo(function TemperatureCard() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  // Strict selectors: only re-renders when temperature-related slices change
  const temperature = useDeviceStore(selectActiveTemperature);
  const telemetryHistory = useDeviceStore(selectActiveTelemetryHistory);
  const status = useDeviceStore(selectActiveDeviceStatus);
  const lastUpdated = useDeviceStore(selectActiveLastUpdated);
  const unit = useSettingsStore(selectTemperatureUnit);
  const toggleUnit = useSettingsStore(selectToggleTemperatureUnit);

  const history = useMemo(() => telemetryHistory.map((pt) => pt.t), [telemetryHistory]);
  const formattedTemp = formatTemperature(temperature, unit);
  const stale = isDataStale(lastUpdated, status);

  // Compute trend stats
  const minTemp = history.length > 0 ? Math.min(...history) : temperature;
  const maxTemp = history.length > 0 ? Math.max(...history) : temperature;

  return (
    <Card testID="temperature-card" elevated style={{ marginBottom: spacing.md }}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.primaryLight, borderRadius: borderRadius.sm },
            ]}
          >
            <MaterialCommunityIcons name="thermometer" size={22} color={colors.primary} />
          </View>
          <View>
            <Text
              style={[
                styles.cardTitle,
                {
                  color: colors.textPrimary,
                  fontSize: typography.labelCaps.fontSize,
                  letterSpacing: typography.labelCaps.letterSpacing,
                },
              ]}
            >
              TEMPERATURE
            </Text>
            <Text style={[styles.sensorSubtext, { color: colors.textMuted }]}>
              SmartElex AHT20 Sensor
            </Text>
          </View>
        </View>

        {/* Remembered °C / °F Unit Toggle (min 48dp touch target) */}
        <Pressable
          testID="temp-unit-toggle"
          accessibilityRole="button"
          accessibilityLabel={`Toggle temperature unit, current is ${unit}`}
          onPress={toggleUnit}
          android_ripple={{ color: colors.ripple }}
          style={({ pressed }) => [
            styles.unitTogglePill,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.pill,
            },
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.unitIndicator,
              unit === 'C' && { backgroundColor: colors.primary },
              { borderRadius: borderRadius.pill },
            ]}
          >
            <Text
              style={[
                styles.unitText,
                { color: unit === 'C' ? colors.primaryContrast : colors.textSecondary },
              ]}
            >
              °C
            </Text>
          </View>
          <View
            style={[
              styles.unitIndicator,
              unit === 'F' && { backgroundColor: colors.primary },
              { borderRadius: borderRadius.pill },
            ]}
          >
            <Text
              style={[
                styles.unitText,
                { color: unit === 'F' ? colors.primaryContrast : colors.textSecondary },
              ]}
            >
              °F
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Main Metric & Stale Marker */}
      <View style={[styles.metricRow, { marginVertical: spacing.md }]}>
        <Text
          testID="temperature-metric-value"
          style={[
            styles.metricText,
            {
              color: colors.textPrimary,
              fontSize: typography.metricLarge.fontSize,
              lineHeight: typography.metricLarge.lineHeight,
              fontWeight: typography.metricLarge.fontWeight,
            },
          ]}
        >
          {formattedTemp}
        </Text>

        {stale ? (
          <View
            testID="temp-stale-marker"
            style={[
              styles.staleMarker,
              {
                backgroundColor: colors.warningLight,
                borderColor: colors.warning,
                borderRadius: borderRadius.pill,
                marginLeft: spacing.sm,
              },
            ]}
          >
            <Text style={[styles.staleLabel, { color: colors.warningDark }]}>STALE</Text>
          </View>
        ) : null}
      </View>

      {/* Sparkline Live Trend of last 60 readings */}
      <View style={[styles.trendContainer, { marginTop: spacing.xs }]}>
        <View style={styles.trendLabelRow}>
          <Text style={[styles.trendCaption, { color: colors.textMuted }]}>
            Live 60-Reading Sensor Trend
          </Text>
          {minTemp !== null && maxTemp !== null ? (
            <Text style={[styles.trendMinMax, { color: colors.textSecondary }]}>
              Range: {formatTemperature(minTemp, unit, 1)} – {formatTemperature(maxTemp, unit, 1)}
            </Text>
          ) : null}
        </View>

        <SparklineTrend
          data={history}
          color={colors.primary}
          fillColor={colors.primaryLight}
          height={55}
          testID="temperature-sparkline"
        />
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontWeight: '700',
  },
  sensorSubtext: {
    fontSize: 11,
    marginTop: 1,
  },
  unitTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  unitIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    letterSpacing: -1,
  },
  staleMarker: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  staleLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trendContainer: {},
  trendLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  trendCaption: {
    fontSize: 11,
    fontWeight: '500',
  },
  trendMinMax: {
    fontSize: 11,
    fontWeight: '600',
  },
});

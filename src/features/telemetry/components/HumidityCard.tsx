import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../../components';
import {
  selectActiveDeviceStatus,
  selectActiveHumidity,
  selectActiveLastUpdated,
  selectActiveTelemetryHistory,
  useDeviceStore,
} from '../../../store';
import { useTheme } from '../../../theme';
import { formatHumidity, isDataStale } from '../../../utils/formatters';
import { SparklineTrend } from './SparklineTrend';

export const HumidityCard = memo(function HumidityCard() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  // Strict selectors: only re-renders when humidity-related slices change
  const humidity = useDeviceStore(selectActiveHumidity);
  const telemetryHistory = useDeviceStore(selectActiveTelemetryHistory);
  const status = useDeviceStore(selectActiveDeviceStatus);
  const lastUpdated = useDeviceStore(selectActiveLastUpdated);

  const history = useMemo(() => telemetryHistory.map((pt) => pt.h), [telemetryHistory]);
  const formattedHumidity = formatHumidity(humidity);
  const stale = isDataStale(lastUpdated, status);

  // Clinical target range: 40% to 60% RH for optimal sterilization and bio-aerosol control
  const isOptimal = humidity !== null && humidity >= 40 && humidity <= 60;

  const minHum = history.length > 0 ? Math.min(...history) : humidity;
  const maxHum = history.length > 0 ? Math.max(...history) : humidity;

  return (
    <Card testID="humidity-card" elevated style={{ marginBottom: spacing.md }}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.primaryLight, borderRadius: borderRadius.sm },
            ]}
          >
            <MaterialCommunityIcons name="water-percent" size={24} color={colors.primary} />
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
              RELATIVE HUMIDITY
            </Text>
            <Text style={[styles.sensorSubtext, { color: colors.textMuted }]}>
              SmartElex AHT20 Sensor
            </Text>
          </View>
        </View>

        {/* Clinical Range Badge */}
        <View
          testID="humidity-range-badge"
          style={[
            styles.rangeBadge,
            {
              backgroundColor: isOptimal ? colors.successLight : colors.backgroundSecondary,
              borderColor: isOptimal ? colors.success : colors.cardBorder,
              borderRadius: borderRadius.pill,
            },
          ]}
        >
          <Text
            style={[
              styles.rangeBadgeText,
              { color: isOptimal ? colors.successDark : colors.textSecondary },
            ]}
          >
            {isOptimal ? 'OPTIMAL ICU BAND' : 'TARGET: 40-60%'}
          </Text>
        </View>
      </View>

      {/* Main Metric & Stale Marker */}
      <View style={[styles.metricRow, { marginVertical: spacing.md }]}>
        <Text
          testID="humidity-metric-value"
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
          {formattedHumidity}
        </Text>

        {stale ? (
          <View
            testID="humidity-stale-marker"
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
          {minHum !== null && maxHum !== null ? (
            <Text style={[styles.trendMinMax, { color: colors.textSecondary }]}>
              Range: {formatHumidity(minHum, 1)} – {formatHumidity(maxHum, 1)}
            </Text>
          ) : null}
        </View>

        <SparklineTrend
          data={history}
          color="#0284C7"
          fillColor="#E0F2FE"
          height={55}
          testID="humidity-sparkline"
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
  rangeBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rangeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
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

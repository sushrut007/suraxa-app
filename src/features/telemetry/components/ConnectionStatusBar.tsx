import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusPill } from '../../../components';
import { selectActiveDeviceStatus, selectActiveLastUpdated, useDeviceStore } from '../../../store';
import { useTheme } from '../../../theme';
import { formatRelativeTime, isDataStale } from '../../../utils/formatters';

export const ConnectionStatusBar = memo(function ConnectionStatusBar() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  // Strict Zustand selectors
  const status = useDeviceStore(selectActiveDeviceStatus);
  const lastUpdated = useDeviceStore(selectActiveLastUpdated);

  // Tick relative time every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const relativeTime = formatRelativeTime(lastUpdated);
  const stale = isDataStale(lastUpdated, status);

  return (
    <View
      testID="connection-status-bar"
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginBottom: spacing.md,
        },
      ]}
    >
      <View style={styles.leftGroup}>
        <StatusPill status={status} size="small" testID="dashboard-status-pill" />
        {stale ? (
          <View
            testID="stale-marker-badge"
            style={[
              styles.staleBadge,
              {
                backgroundColor: colors.warningLight,
                borderColor: colors.warning,
                borderRadius: borderRadius.pill,
                marginLeft: spacing.xs,
              },
            ]}
          >
            <Text
              style={[
                styles.staleText,
                { color: colors.warningDark, fontSize: typography.labelCaps.fontSize },
              ]}
            >
              STALE DATA
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        testID="last-updated-text"
        style={[
          styles.updatedText,
          {
            color: colors.textSecondary,
            fontSize: typography.bodySmall.fontSize,
          },
        ]}
      >
        Updated {relativeTime}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staleBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  staleText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  updatedText: {},
});

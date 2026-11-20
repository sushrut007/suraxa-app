import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import {
  selectActiveDeviceId,
  selectActiveDeviceName,
  selectActiveDeviceStatus,
  useDeviceStore,
} from '../store';
import { StatusPill } from './StatusPill';

export const AppHeader = memo(function AppHeader() {
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing } = useTheme();

  // Strict Zustand selectors per CLAUDE.md permanent rule
  const deviceName = useDeviceStore(selectActiveDeviceName);
  const deviceId = useDeviceStore(selectActiveDeviceId);
  const deviceStatus = useDeviceStore(selectActiveDeviceStatus);

  return (
    <View
      style={[
        styles.safeAreaContainer,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: colors.card,
          borderBottomColor: colors.cardBorder,
        },
      ]}
      testID="app-header"
    >
      <View
        style={[styles.headerContent, { paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}
      >
        <View style={styles.deviceInfoContainer}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: colors.primaryLight,
                borderRadius: 10,
                marginRight: spacing.xs,
              },
            ]}
          >
            <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.textGroup}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                styles.deviceName,
                {
                  color: colors.textPrimary,
                  fontSize: typography.label.fontSize,
                  fontWeight: typography.label.fontWeight,
                  lineHeight: typography.label.lineHeight,
                },
              ]}
              testID="header-device-name"
            >
              {deviceName}
            </Text>
            {deviceId ? (
              <Text
                style={[
                  styles.deviceId,
                  {
                    color: colors.textMuted,
                    fontSize: typography.bodySmall.fontSize,
                    lineHeight: typography.bodySmall.lineHeight,
                  },
                ]}
              >
                {deviceId}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.statusPillWrapper}>
          <StatusPill status={deviceStatus} size="small" testID="header-status-pill" />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  safeAreaContainer: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  deviceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
  },
  deviceName: {
    letterSpacing: -0.2,
  },
  deviceId: {
    marginTop: 1,
  },
  statusPillWrapper: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

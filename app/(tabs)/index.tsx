import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, SectionHeader, Skeleton } from '../../src/components';
import {
  ConnectionStatusBar,
  FaultBanner,
  HumidityCard,
  TemperatureCard,
} from '../../src/features/telemetry';
import { mqttClient, StatePayload, StatusPayload, TelemetryPayload } from '../../src/services/mqtt';
import {
  selectActiveDeviceId,
  selectActiveError,
  selectActiveTelemetry,
  selectIsHydrated,
  useDeviceStore,
  useSettingsStore,
} from '../../src/store';
import { useTheme } from '../../src/theme';

export default function DashboardScreen() {
  const { colors, spacing, typography } = useTheme();

  // Strict selectors
  const activeDeviceId = useDeviceStore(selectActiveDeviceId);
  const telemetry = useDeviceStore(selectActiveTelemetry);
  const isHydrated = useDeviceStore(selectIsHydrated);
  const deviceError = useDeviceStore(selectActiveError);

  // Initialize hydration and MQTT lifecycle
  useEffect(() => {
    // 1. Hydrate cached state from AsyncStorage
    useDeviceStore.getState().hydrate();
    useSettingsStore.getState().hydrateSettings();

    // 2. Connect MQTT client and subscribe to active device
    mqttClient.connect();
    mqttClient.subscribeDevice(activeDeviceId);

    // 3. Listen to connection state changes
    const unsubConn = mqttClient.onConnectionStateChange((state) => {
      useDeviceStore.getState().setConnection(state);
    });

    // 4. Listen to incoming MQTT telemetry, state, and status messages
    const unsubMsg = mqttClient.onMessage((devId, channel, payload) => {
      if (channel === 'telemetry') {
        useDeviceStore.getState().updateTelemetry(devId, payload as TelemetryPayload);
      } else if (channel === 'state') {
        useDeviceStore.getState().updateState(devId, payload as StatePayload);
      } else if (channel === 'status') {
        useDeviceStore.getState().updateStatus(devId, payload as StatusPayload);
      }
    });

    // Permanent rule: Clean up all subscriptions on unmount!
    return () => {
      unsubConn();
      unsubMsg();
      mqttClient.unsubscribeDevice(activeDeviceId);
    };
  }, [activeDeviceId]);

  // Pull-to-refresh to re-subscribe and sync
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    mqttClient.subscribeDevice(activeDeviceId);
    setTimeout(() => setRefreshing(false), 800);
  }, [activeDeviceId]);

  // Loading State: While store hydrates from local cache
  if (!isHydrated) {
    return (
      <View
        testID="dashboard-loading"
        style={[styles.container, styles.loadingPadding, { backgroundColor: colors.background }]}
      >
        <Skeleton height={44} style={{ marginBottom: spacing.md }} />
        <Skeleton height={180} style={{ marginBottom: spacing.md }} />
        <Skeleton height={180} />
      </View>
    );
  }

  return (
    <ScrollView
      testID="dashboard-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.md }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Hardware Interlock / Fault Banner (visible only when fault is present) */}
      <FaultBanner />

      {/* Global Device Error Alert (e.g. command timeouts) */}
      {deviceError ? (
        <Card
          testID="device-error-banner"
          style={[
            styles.errorCard,
            {
              backgroundColor: colors.dangerLight,
              borderColor: colors.danger,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text
            style={[
              styles.errorText,
              { color: colors.dangerDark, fontSize: typography.bodyMedium.fontSize },
            ]}
          >
            ⚠️ {deviceError}
          </Text>
        </Card>
      ) : null}

      {/* Connection Status & Relative Last-Updated Bar */}
      <ConnectionStatusBar />

      <SectionHeader
        title="Environmental Monitoring"
        subtitle="Live AHT20 Temperature & Humidity"
      />

      {/* Empty State: If no telemetry has ever been received/cached */}
      {!telemetry ? (
        <EmptyState
          testID="dashboard-empty-state"
          icon="access-point-network-off"
          title="No Sensor Readings Yet"
          description={`Awaiting initial telemetry stream from ${activeDeviceId} on suraxa/${activeDeviceId}/telemetry.`}
        />
      ) : (
        <>
          {/* Temperature Card with °C / °F toggle and 60-reading sparkline */}
          <TemperatureCard />

          {/* Humidity Card with clinical comfort zone and 60-reading sparkline */}
          <HumidityCard />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  loadingPadding: {
    padding: 16,
  },
  errorCard: {
    borderWidth: 1.5,
  },
  errorText: {
    fontWeight: '600',
  },
});

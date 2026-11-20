import { CommandManager, CONFIRMATION_TIMEOUT_MS } from '../../src/services/mqtt/commandManager';
import { SuraxaMqttClient } from '../../src/services/mqtt/mqttClient';
import { selectActivePendingRelays, useDeviceStore } from '../../src/store';

describe('CommandManager - Pending Timeout & Safety Layer', () => {
  let mockClient: jest.Mocked<SuraxaMqttClient>;
  let commandManager: CommandManager;
  let messageHandler: ((deviceId: string, channel: string, payload: unknown) => void) | null = null;

  beforeEach(() => {
    jest.useFakeTimers();

    messageHandler = null;

    mockClient = {
      publishCommand: jest.fn().mockResolvedValue(undefined),
      onMessage: jest.fn().mockImplementation((handler) => {
        messageHandler = handler;
        return () => {};
      }),
      subscribeDevice: jest.fn(),
      unsubscribeDevice: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      getConnectionState: jest.fn().mockReturnValue('connected'),
      onConnectionStateChange: jest.fn().mockReturnValue(() => {}),
    } as unknown as jest.Mocked<SuraxaMqttClient>;

    // Reset store state
    useDeviceStore.getState().setActiveDeviceId('DEV-001');
    useDeviceStore.getState().clearPendingRelays('DEV-001');
    useDeviceStore.getState().setError('DEV-001', null);

    commandManager = new CommandManager(mockClient);
  });

  afterEach(() => {
    commandManager.cleanup();
    jest.useRealTimers();
  });

  it('marks relay as pending and dispatches MQTT command', async () => {
    const promise = commandManager.sendRelayCommand('DEV-001', 3, 1);

    // Verify pending relay set in store
    const pendingRelays = selectActivePendingRelays(useDeviceStore.getState());
    expect(pendingRelays[3]).toBe(true);

    expect(mockClient.publishCommand).toHaveBeenCalledWith('DEV-001', {
      relay: 3,
      v: 1,
    });

    // Simulate device confirmation within 5s
    messageHandler?.('DEV-001', 'state', {
      relays: [0, 0, 1, 0, 0, 0, 0, 0], // channel 3 confirmed ON
    });

    await expect(promise).resolves.toBeUndefined();

    // Verify pending state cleared
    expect(selectActivePendingRelays(useDeviceStore.getState())[3]).toBeUndefined();
    expect(useDeviceStore.getState().devices['DEV-001'].error).toBeNull();
  });

  it('reverts pending state and records error if no confirmation in 5s', async () => {
    const promise = commandManager.sendRelayCommand('DEV-001', 2, 1);

    expect(selectActivePendingRelays(useDeviceStore.getState())[2]).toBe(true);

    // Fast-forward time past 5s timeout
    jest.advanceTimersByTime(CONFIRMATION_TIMEOUT_MS + 100);

    await expect(promise).rejects.toThrow(
      'Relay 2 command timed out after 5s without device confirmation.'
    );

    // Verify pending state is reverted
    expect(selectActivePendingRelays(useDeviceStore.getState())[2]).toBeUndefined();

    // Verify error is set in store
    expect(useDeviceStore.getState().devices['DEV-001'].error).toContain(
      'Relay 2 command timed out after 5s'
    );
  });

  it('throttles LED commands to 1 per 150 ms and guarantees final value', () => {
    commandManager.sendLedCommand('DEV-001', 1, 1, 50, [255, 0, 0], 0);
    commandManager.sendLedCommand('DEV-001', 1, 1, 70, [0, 255, 0], 1);
    commandManager.sendLedCommand('DEV-001', 1, 1, 95, [0, 0, 255], 2);

    // Leading call executed immediately
    expect(mockClient.publishCommand).toHaveBeenCalledTimes(1);
    expect(mockClient.publishCommand).toHaveBeenCalledWith('DEV-001', {
      led: 1,
      on: 1,
      br: 50,
      rgb: [255, 0, 0],
      fx: 0,
    });

    // Advance 150 ms
    jest.advanceTimersByTime(150);

    // Trailing call executed with the final value on release!
    expect(mockClient.publishCommand).toHaveBeenCalledTimes(2);
    expect(mockClient.publishCommand).toHaveBeenLastCalledWith('DEV-001', {
      led: 1,
      on: 1,
      br: 95,
      rgb: [0, 0, 255],
      fx: 2,
    });
  });
});

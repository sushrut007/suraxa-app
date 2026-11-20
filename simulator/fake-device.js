#!/usr/bin/env node

/**
 * Suraxa Mock IoT Controller Simulator (ESP32-S3 Firmware Mock)
 *
 * Implements the full Suraxa MQTT Hardware Contract:
 * - suraxa/<id>/telemetry: published every 2s with realistic AHT20 drift
 * - suraxa/<id>/state: retained state for 8 relays, 2 LED strips, and fault state
 * - suraxa/<id>/status: retained "online" / "offline" with Last Will & Testament (LWT)
 * - suraxa/<id>/cmd: handles relay commands {"relay": 3, "v": 1} and led commands
 */

const mqtt = require('mqtt');
const readline = require('readline');

// CLI Arguments and Environment Configuration
const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const hasFlag = (flag) => args.includes(flag);

const DEVICE_ID = getArg('--id', process.env.SIMULATOR_DEVICE_ID || 'DEV-SURAXA-01');
const BROKER_URL = getArg(
  '--broker',
  process.env.SIMULATOR_MQTT_BROKER_URL || 'wss://f0e181ba.ala.asia-southeast1.emqxsl.com:8084/mqtt'
);
const USERNAME = getArg('--user', process.env.SIMULATOR_MQTT_USERNAME || 'suraxa_device');
const PASSWORD = getArg('--pass', process.env.SIMULATOR_MQTT_PASSWORD || 'suraxa_device@123');

const INITIAL_FAULT = getArg('--fault', null);
const SIMULATE_DISCONNECT_AFTER_SEC = parseInt(getArg('--disconnect-after', '0'), 10);
const SIMULATE_START_DISCONNECTED = hasFlag('--disconnect');

console.log('=====================================================');
console.log('🤖 Suraxa Fake IoT Controller (ESP32-S3 Simulator)');
console.log(`Device ID:    ${DEVICE_ID}`);
console.log(`Broker URL:   ${BROKER_URL}`);
console.log(`Username:     ${USERNAME}`);
console.log('=====================================================');

// Device internal state
let state = {
  relays: [0, 0, 0, 0, 0, 0, 0, 0],
  led: [
    { on: 1, br: 80, rgb: [0, 255, 128], fx: 0 },
    { on: 0, br: 50, rgb: [0, 128, 255], fx: 2 },
  ],
  fault: INITIAL_FAULT,
};

// Simulated AHT20 sensor environmental drift
let currentTemp = 27.2;
let currentHumidity = 54.8;
let telemetryTimer = null;
let client = null;

const TOPIC_TELEMETRY = `suraxa/${DEVICE_ID}/telemetry`;
const TOPIC_STATE = `suraxa/${DEVICE_ID}/state`;
const TOPIC_STATUS = `suraxa/${DEVICE_ID}/status`;
const TOPIC_CMD = `suraxa/${DEVICE_ID}/cmd`;

function publishState() {
  if (!client || !client.connected) return;
  const payload = JSON.stringify(state);
  client.publish(TOPIC_STATE, payload, { retain: true, qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to publish state:', err.message);
    } else {
      console.log(`📡 State published (Retained): ${payload}`);
    }
  });
}

function publishStatus(status) {
  if (!client || !client.connected) return;
  client.publish(TOPIC_STATUS, status, { retain: true, qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to publish status:', err.message);
    } else {
      console.log(`🟢 Status published (Retained): ${status}`);
    }
  });
}

function publishTelemetry() {
  if (!client || !client.connected) return;

  // Realistic random walk sensor drift
  const tempDrift = (Math.random() - 0.5) * 0.2;
  const humDrift = (Math.random() - 0.5) * 0.4;

  currentTemp = Math.max(22.0, Math.min(32.0, currentTemp + tempDrift));
  currentHumidity = Math.max(40.0, Math.min(75.0, currentHumidity + humDrift));

  const payload = JSON.stringify({
    t: parseFloat(currentTemp.toFixed(1)),
    h: parseFloat(currentHumidity.toFixed(1)),
    ts: Math.floor(Date.now() / 1000),
  });

  client.publish(TOPIC_TELEMETRY, payload, { qos: 0 }, (err) => {
    if (err) {
      console.error('❌ Failed to publish telemetry:', err.message);
    } else {
      console.log(`📊 Telemetry: ${payload}`);
    }
  });
}

function startTelemetryLoop() {
  if (telemetryTimer) clearInterval(telemetryTimer);
  publishTelemetry();
  telemetryTimer = setInterval(publishTelemetry, 2000);
}

function stopTelemetryLoop() {
  if (telemetryTimer) {
    clearInterval(telemetryTimer);
    telemetryTimer = null;
  }
}

function connect() {
  console.log(`\n⏳ Connecting to MQTT broker at ${BROKER_URL}...`);

  client = mqtt.connect(BROKER_URL, {
    clientId: `suraxa_sim_${DEVICE_ID}_${Math.random().toString(16).substring(2, 8)}`,
    username: USERNAME,
    password: PASSWORD,
    keepalive: 30,
    clean: true,
    will: {
      topic: TOPIC_STATUS,
      payload: 'offline',
      qos: 1,
      retain: true,
    },
  });

  client.on('connect', () => {
    console.log('✅ Connected to broker as Suraxa IoT device!');

    // 1. Publish retained online status
    publishStatus('online');

    // 2. Publish initial retained state
    publishState();

    // 3. Subscribe to command topic
    client.subscribe(TOPIC_CMD, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Failed to subscribe to cmd topic:', err);
      } else {
        console.log(`📥 Subscribed to ${TOPIC_CMD}`);
      }
    });

    // 4. Start 2s telemetry loop
    startTelemetryLoop();

    // Optional simulated disconnect timer
    if (SIMULATE_DISCONNECT_AFTER_SEC > 0) {
      console.log(`⏱️ Simulating disconnect in ${SIMULATE_DISCONNECT_AFTER_SEC}s...`);
      setTimeout(() => {
        simulateDisconnect();
      }, SIMULATE_DISCONNECT_AFTER_SEC * 1000);
    }
  });

  client.on('message', (topic, message) => {
    if (topic === TOPIC_CMD) {
      handleCommand(message.toString());
    }
  });

  client.on('error', (err) => {
    console.error('❌ MQTT Client Error:', err.message);
  });

  client.on('close', () => {
    console.log('🔌 MQTT Connection closed.');
    stopTelemetryLoop();
  });
}

function handleCommand(raw) {
  console.log(`⚡ Received CMD: ${raw}`);

  try {
    const cmd = JSON.parse(raw);

    // Safety Interlock check: if fault is active, firmware blocks commands!
    if (state.fault !== null) {
      console.warn(
        `⚠️ Command blocked by firmware safety interlock: FAULT ACTIVE (${state.fault})`
      );
      publishState();
      return;
    }

    // Handle Relay command: {"relay": 3, "v": 1}
    if (typeof cmd.relay === 'number' && (cmd.v === 0 || cmd.v === 1)) {
      const idx = cmd.relay >= 1 && cmd.relay <= 8 ? cmd.relay - 1 : cmd.relay;
      if (idx >= 0 && idx < 8) {
        state.relays[idx] = cmd.v;
        console.log(`🔄 Relay ${idx + 1} updated to ${cmd.v}`);
        publishState();
      } else {
        console.warn(`⚠️ Invalid relay index: ${cmd.relay}`);
      }
      return;
    }

    // Handle LED command: {"led": 1, "on": 1, "br": 80, "rgb": [0,255,0], "fx": 2}
    if (typeof cmd.led === 'number') {
      const idx = cmd.led >= 1 && cmd.led <= 2 ? cmd.led - 1 : cmd.led;
      if (idx >= 0 && idx < 2) {
        state.led[idx] = {
          on: cmd.on === 1 ? 1 : 0,
          br: typeof cmd.br === 'number' ? cmd.br : state.led[idx].br,
          rgb: Array.isArray(cmd.rgb) && cmd.rgb.length === 3 ? cmd.rgb : state.led[idx].rgb,
          fx: typeof cmd.fx === 'number' ? cmd.fx : state.led[idx].fx,
        };
        console.log(`💡 LED Strip ${idx + 1} updated:`, state.led[idx]);
        publishState();
      } else {
        console.warn(`⚠️ Invalid LED strip index: ${cmd.led}`);
      }
      return;
    }

    console.warn('⚠️ Unknown command format:', cmd);
  } catch (err) {
    console.error('❌ Malformed command JSON received:', err.message);
  }
}

function simulateDisconnect() {
  console.log(
    '⚡ [SIMULATION] Dropping connection without sending graceful offline (LWT will trigger)...'
  );
  stopTelemetryLoop();
  if (client) {
    // End forcibly so broker detects connection loss and publishes LWT
    client.end(true);
    client = null;
  }
}

function simulateGracefulOffline() {
  console.log('⚡ [SIMULATION] Sending graceful offline and disconnecting...');
  stopTelemetryLoop();
  if (client && client.connected) {
    publishStatus('offline');
    setTimeout(() => {
      client.end(true);
      client = null;
      console.log('🔌 Disconnected gracefully.');
    }, 500);
  }
}

if (!SIMULATE_START_DISCONNECTED) {
  connect();
} else {
  console.log('⚡ Started in disconnected state. Type "connect" to initiate connection.');
}

// Interactive CLI command loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'suraxa-sim> ',
});

rl.prompt();

rl.on('line', (line) => {
  const trimmed = line.trim();
  const [cmd, ...paramArr] = trimmed.split(' ');
  const param = paramArr.join(' ');

  switch (cmd.toLowerCase()) {
    case 'fault': {
      const faultReason = param || 'DOOR_INTERLOCK_OPEN';
      state.fault = faultReason;
      console.log(`⚠️ Tripping fault: "${faultReason}"`);
      publishState();
      break;
    }
    case 'clear': {
      console.log('✅ Clearing fault state...');
      state.fault = null;
      publishState();
      break;
    }
    case 'disconnect': {
      simulateDisconnect();
      break;
    }
    case 'offline': {
      simulateGracefulOffline();
      break;
    }
    case 'connect':
    case 'reconnect': {
      if (client && client.connected) {
        console.log('Already connected!');
      } else {
        connect();
      }
      break;
    }
    case 'relay': {
      const parts = param.split(' ');
      const r = parseInt(parts[0], 10);
      const v = parseInt(parts[1], 10);
      if (r >= 1 && r <= 8 && (v === 0 || v === 1)) {
        state.relays[r - 1] = v;
        publishState();
      } else {
        console.log('Usage: relay <1-8> <0|1>');
      }
      break;
    }
    case 'state': {
      console.log('Current state:', JSON.stringify(state, null, 2));
      break;
    }
    case 'help': {
      console.log('\nSimulator Commands:');
      console.log('  fault [reason]    - Simulate hardware fault/interlock trip');
      console.log('  clear             - Clear hardware fault');
      console.log('  disconnect        - Forcibly drop connection (triggers LWT offline)');
      console.log('  offline           - Publish graceful offline and disconnect');
      console.log('  connect           - Reconnect to broker');
      console.log('  relay <1-8> <0|1> - Manually set relay state');
      console.log('  state             - Print current internal state');
      console.log('  quit              - Exit simulator\n');
      break;
    }
    case 'quit':
    case 'exit': {
      console.log('Exiting simulator...');
      simulateGracefulOffline();
      setTimeout(() => process.exit(0), 600);
      return;
    }
    default:
      if (trimmed) {
        console.log(`Unknown command: "${cmd}". Type "help" for options.`);
      }
  }

  rl.prompt();
});

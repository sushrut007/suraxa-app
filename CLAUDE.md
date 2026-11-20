# Suraxa Mobile Application - Rules & Specifications

## Permanent Rules for Every Task

### 1. Stack

- **Framework:** Expo (SDK 58+, Android focus, cross-platform ready)
- **Language:** TypeScript in strict mode (`"strict": true` in tsconfig)
- **Routing & Navigation:** `expo-router` (file-based routing under `app/`)
- **State Management:** Zustand (always use atomic selectors, e.g., `useStore(state => state.foo)`)
- **Transport / Messaging:** `mqtt.js` over WebSocket Secure (`wss://`)
- **Local Persistence:** `@react-native-async-storage/async-storage`
- **Testing:** Jest + React Native Testing Library (`@testing-library/react-native`)

### 2. Folder Layout

```
suraxa-app/
├── app/                  # expo-router routes & screens (root layout, navigation stacks)
├── src/
│   ├── components/       # Shared UI primitives (Buttons, Cards, Dialogs, Header)
│   ├── features/
│   │   ├── telemetry/    # Real-time AHT20 sensor dashboard (temperature, humidity, °C/°F)
│   │   ├── relays/       # 8-channel relay controls, labels, and safety interlocks
│   │   ├── leds/         # 2-strip addressable LED controllers (power, brightness, color, effects)
│   │   ├── provisioning/ # Camera QR scanner and one-time Wi-Fi setup flow
│   │   └── devices/      # Device list, selection, persistence, and status tracking
│   ├── services/
│   │   └── mqtt/         # MQTT client, topic subscriptions, connection lifecycle, parser
│   ├── store/            # Zustand stores with strict selector pattern
│   ├── theme/            # Design tokens, color palettes, spacing, typography
│   └── utils/            # Throttling, formatting, validation, constants
├── simulator/            # Local mock MQTT device simulator for end-to-end testing without hardware
└── __tests__/            # Jest test suites (unit, integration, component tests)
```

### 3. Performance

- **Component Memoization:** Wrap all list item and control components in `React.memo` with appropriate comparison or stable callbacks.
- **No Polling:** Real-time updates must strictly be event-driven via MQTT subscriptions. Do not use `setInterval` polling for device telemetry or state.
- **Command Throttling:** Throttle slider and color picker commands to at most 1 message per 150 ms. Always emit the final value upon touch release (`onSlidingComplete` / touch end).
- **Resource Cleanup:** Clean up all subscriptions, listeners, and timers on component unmount.

### 4. Safety & Interlocks

- **Optimistic UI Forbidden for Relays:** The UI must display a relay as `ON` only after receiving confirmation from the device via the `suraxa/<id>/state` topic.
- **UV-C Confirmation Dialog:** Any relay designated as a UV-C channel requires an explicit user confirmation dialog before transmitting the `ON` command.
- **Firmware Interlock Precedence:** Firmware/hardware safety interlocks always win. If an interlock trips or a fault is detected (`fault != null`), the UI must display the fault state clearly and block contradictory control commands.

### 5. Configuration & Secrets

- Never hardcode credentials, broker addresses, or keys in source code.
- Store environment configuration in `.env` (using `.env.example` as the committed template). Use `EXPO_PUBLIC_` prefix for public variables.

### 6. Verification Workflow

After every task, execute:

1. `npm run tsc` (TypeScript strict check)
2. `npm run lint` (ESLint)
3. `npm run test` (Jest test suite)
   Fix all errors until all three pass with zero warnings/errors, then provide a concise summary of changes.

---

## MQTT Contract (Per Device)

| Topic                   | Direction         | Retained | Payload Format / Example                                                                                                                                |
| :---------------------- | :---------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `suraxa/<id>/telemetry` | Device &rarr; App | No       | `{"t": 27.4, "h": 55.2, "ts": 1732000000}`                                                                                                              |
| `suraxa/<id>/state`     | Device &rarr; App | Yes      | `{"relays": [0,0,0,0,0,0,0,0], "led": [{"on": 1, "br": 80, "rgb": [255,0,0], "fx": 0}, {"on": 0, "br": 50, "rgb": [0,0,255], "fx": 2}], "fault": null}` |
| `suraxa/<id>/cmd`       | App &rarr; Device | No       | Relay: `{"relay": 3, "v": 1}`<br/>LED: `{"led": 1, "on": 1, "br": 80, "rgb": [0,255,0], "fx": 2}`                                                       |
| `suraxa/<id>/status`    | Device &rarr; App | Yes      | `"online"` / `"offline"` (via MQTT Last Will and Testament - LWT)                                                                                       |

### Telemetry Payload Spec

- `t`: Ambient temperature in Celsius (float, e.g. `27.4`)
- `h`: Relative humidity in percentage RH (float, e.g. `55.2`)
- `ts`: Unix timestamp in seconds (integer, e.g. `1732000000`)

### State Payload Spec

- `relays`: Array of 8 binary values (`0` for OFF, `1` for ON) representing Relay 1 through Relay 8
- `led`: Array of 2 LED strip state objects:
  - `on`: Power status (`0` = OFF, `1` = ON)
  - `br`: Brightness level (`0` - `100` or `0` - `255`)
  - `rgb`: 3-element integer tuple `[R, G, B]` (values `0` - `255`)
  - `fx`: Integer effect preset identifier (`0` = Solid, `1+` = dynamic effects)
- `fault`: `null` if operational; string error / interlock reason if faulted (e.g., `"DOOR_INTERLOCK_OPEN"`, `"THERMAL_OVERHEAT"`, `"COMM_TIMEOUT"`)

### Target Hardware Reference

- **Microcontroller:** DOIT ESP32-S3-WROOM-1-N16R8 (Dual-core LX7, 16 MB Flash, 8 MB PSRAM, 2.4 GHz Wi-Fi + BLE 5.0)
- **Sensor:** SmartElex AHT20 Temp & Humidity Sensor (I2C default 0x38)
- **Relays:** 8-Channel Relay Control with live state feedback
- **LEDs:** 2x Addressable LED Strips (WS2812B/SK6812)
- **Provisioning:** Camera QR scanner decoding unique device identity, BLE/SoftAP Wi-Fi provisioning credentials persistence in ESP32 NVS

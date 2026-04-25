# WebIDE Pro: Firmware Prototyping Environment

WebIDE Pro is a high-performance, browser-based integrated development environment tailored for embedded systems prototyping. It provides real-time visualization, debugging, and build tooling directly in your browser.

## Key Features

### 1. Embedded Firmware Development
- **Monaco Editor Integration:** Full-featured IDE editing experience for C++/Arduino code.
- **Build Settings:** Configure target architectures (ESP32, Arduino, Raspberry Pi RP2040) and optimize compiler flags for binary size or debugging.
- **Virtual Simulator:** Previews and runs your code logic in a virtualized container for rapid iteration before hardware deployment.

### 2. Real-Time Debugging & Visualization
- **Serial Monitor:** Advanced serial debugging with RegEx-powered log filtering and level-based alerts.
- **Live Data Plotter:** Visualize telemetry and sensor data streams (e.g., Temperature, Humidity) instantly using high-performance line graphs.
- **Breakpoints:** Set and toggle breakpoints directly in the editor to pause and trace execution flow.

### 3. Developer Experience
- **Optimized UI:** Performance-engineered interface for smooth experience on older devices, leveraging `useMemo` and memoized rendering components.

## Getting Started

1. **Auth:** Authenticate using your Google account to save projects and access personal settings.
2. **Setup:** Select a board profile from the `Build Settings` sidebar to automatically configure compiler flags.
3. **Coding:** Write or use provided templates from the templates library.
4. **Build & Simulate:** Compile and upload to the virtual simulator to test logic.
5. **Debug:** Use the Serial Monitor/Plotter to observe data in real-time.

---

Built for fast-paced prototyping and hardware innovation.

# **App Name**: OvenView

## Core Features:

- Dashboard: Displays current oven status and historical performance data (temperature, humidity, active program, alerts, oven state).
- Settings Configuration: Allows users to configure oven settings such as oven names, temperature setpoints, program schedules, and temperature calibration. Stores settings in local storage.
- Dual Oven Support: Supports single and dual-door oven configurations, displaying independent information and controls for each oven when dual-door mode is enabled.

## Style Guidelines:

- Primary color: Use a clean, neutral background (e.g., #f0f2f5) for easy readability.
- Secondary color: A calming blue (#3498db) for headers and key elements.
- Accent: A vibrant teal (#2ecc71) for interactive elements and status indicators.
- Use a grid-based layout for a clean and organized presentation of information.
- Use clear and consistent icons to represent oven status and settings.
- Subtle transitions and animations to provide feedback on user interactions.

## Original User Request:
Core Functionality:

Dashboard: Provides a real-time overview of the oven's current status and historical performance.
Displays key metrics: temperature, humidity, active program, alerts, and oven state (Idle, Preheating, Running, Cooling, Error).
Presents a temperature curve chart showing historical temperature data over a selected time range.
Highlights temperature upper and lower limits (obtained from MES) on the temperature curve, using red and blue reference lines respectively.
Settings: Allows users to configure oven parameters.
Sets oven name(s) (supports both single and dual-door ovens).
Adjusts temperature setpoints.
Configures program schedule using cron expressions.
Calibrates temperature readings using four-point calibration.
Configurable alerts: displays oven alerts to the user if the alert array isn't empty
Key Features

Dual Oven Support: Handles both single and dual-door oven configurations.
When dual-door mode is enabled, the dashboard and settings pages display information and controls for both ovens independently.
Allows independent naming and temperature calibration for each oven in dual-door mode.
Data Visualization:
Presents temperature data in an interactive chart using Recharts.
Allows users to select a date range for the temperature curve.
Settings Storage: Saves oven settings in local storage, preserving configurations across sessions.
Responsive Design: Adapts to different screen sizes for optimal viewing on desktops and mobile devices.
Technical Details:

請用django實現這個網頁，保留數據API傳入接口，先用假數據替代
  
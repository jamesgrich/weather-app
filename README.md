# Weather App — Runner's Edition

A real-time weather application built specifically for runners. Goes beyond standard weather apps with a smart **Running Conditions Score** and tools to help you plan the perfect training session.

## Features

- **Running Conditions Score (0–100)** — weighted algorithm across temperature (28%), wind (25%), precipitation (22%), humidity (20%), and UV index (5%)
- **Best Run Window** — finds the optimal time slot in the next 24 hours for running
- **Best Run Day** — recommends the best day across the 7-day forecast
- **Gear Recommendations** — suggests what to wear based on current conditions
- **Air Quality Monitoring** — AQI levels with visual indicators and pollen forecast
- **Hourly & 7-Day Forecasts** — full weather breakdown with feels-like, dew point, pressure, cloud cover
- **Moon Phase & Visibility** — for those early morning or evening runs
- **Saved Locations** — save up to 5 favourite spots for quick switching
- **Dynamic Theming** — background changes based on weather conditions and time of day
- **Auto-refresh** — silently updates every 15 minutes

## Stack

- **React 19** + **Vite**
- **Open-Meteo API** — weather, hourly forecasts, air quality (free, no API key needed)
- **OpenStreetMap Nominatim** — geocoding and reverse geocoding
- **Geolocation API** — detect current location
- **localStorage** — persist saved locations

## Getting Started

```bash
npm install
npm run dev
```

No API keys required — Open-Meteo is completely free and open.

## Build

```bash
npm run build
```

The app is configured with a `/weather-app/` base path for subdirectory hosting.

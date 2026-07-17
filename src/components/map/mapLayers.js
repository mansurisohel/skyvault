import { CloudRain, Cloud, Wind, Thermometer, Gauge } from 'lucide-react';

// Metadata + legends for each OpenWeather tile layer, styled to match the
// reference "Live Map" widget (dark basemap, segmented layer tabs, dynamic legend).
export const MAP_LAYERS = [
  {
    id: 'precipitation_new',
    label: 'Precipitation',
    icon: CloudRain,
    unit: 'mm/h',
    legend: [
      { label: 'No rain', value: '0', color: '#5b6b8c' },
      { label: 'Light', value: '< 2', color: '#5b8def' },
      { label: 'Moderate', value: '2–10', color: '#5fd18b' },
      { label: 'Heavy', value: '10–50', color: '#f5c542' },
      { label: 'Extreme', value: '> 50', color: '#e05a5a' },
    ],
  },
  {
    id: 'clouds_new',
    label: 'Cloud Cover',
    icon: Cloud,
    unit: '%',
    legend: [
      { label: 'Clear', value: '0–10', color: '#5b6b8c' },
      { label: 'Few clouds', value: '10–40', color: '#7fabff' },
      { label: 'Scattered', value: '40–70', color: '#cdddf7' },
      { label: 'Overcast', value: '70–100', color: '#f6f9ff' },
    ],
  },
  {
    id: 'wind_new',
    label: 'Wind Speed',
    icon: Wind,
    unit: 'km/h',
    legend: [
      { label: 'Calm', value: '0–10', color: '#5b6b8c' },
      { label: 'Breeze', value: '10–30', color: '#5b8def' },
      { label: 'Strong', value: '30–50', color: '#f5c542' },
      { label: 'Storm', value: '> 50', color: '#e05a5a' },
    ],
  },
  {
    id: 'temp_new',
    label: 'Temperature',
    icon: Thermometer,
    unit: '°C',
    legend: [
      { label: 'Freezing', value: '< 0', color: '#a9c9ff' },
      { label: 'Cool', value: '0–15', color: '#5b8def' },
      { label: 'Warm', value: '15–28', color: '#f5c542' },
      { label: 'Hot', value: '> 28', color: '#e05a5a' },
    ],
  },
  {
    id: 'pressure_new',
    label: 'Pressure',
    icon: Gauge,
    unit: 'hPa',
    legend: [
      { label: 'Low', value: '< 1000', color: '#9a8cf5' },
      { label: 'Normal', value: '1000–1020', color: '#5b8def' },
      { label: 'High', value: '> 1020', color: '#f5c542' },
    ],
  },
];

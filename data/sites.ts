/**
 * Observation sites used as globe markers.
 *
 * Real coordinates, chosen to spread across continents so the marker field
 * reads as a genuine ground-segment map. Ordered so the first entries — the
 * large markers — are the most recognisable.
 */
export interface Site {
  name: string;
  lat: number;
  lon: number;
}

export const OBSERVATION_SITES: Site[] = [
  { name: 'Beirut', lat: 33.8938, lon: 35.5018 },
  { name: 'Bekaa Valley', lat: 33.8, lon: 35.9 },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
  { name: 'Riyadh', lat: 24.7136, lon: 46.6753 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784 },
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219 },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792 },
  { name: 'Casablanca', lat: 33.5731, lon: -7.5898 },
  { name: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Berlin', lat: 52.52, lon: 13.405 },
  { name: 'London', lat: 51.5072, lon: -0.1276 },
  { name: 'Kyiv', lat: 50.4501, lon: 30.5234 },
  { name: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Perth', lat: -31.9523, lon: 115.8613 },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816 },
  { name: 'Lima', lat: -12.0464, lon: -77.0428 },
  { name: 'Bogotá', lat: 4.711, lon: -74.0721 },
  { name: 'Mexico City', lat: 19.4326, lon: -99.1332 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Denver', lat: 39.7392, lon: -104.9903 },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
  { name: 'Johannesburg', lat: -26.2041, lon: 28.0473 },
  { name: 'Addis Ababa', lat: 9.145, lon: 40.4897 },
  { name: 'Karachi', lat: 24.8607, lon: 67.0011 },
  { name: 'Tashkent', lat: 41.2995, lon: 69.2401 },
];

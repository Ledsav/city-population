import { City } from "../services/firebase";

// [id, name, country, latitude, longitude, official population]
const SEED: Array<[string, string, string, number, number, number]> = [
  ["nyc", "New York City", "United States", 40.7128, -74.0060, 8804190],
  ["tokyo", "Tokyo", "Japan", 35.6762, 139.6503, 13929286],
  ["london", "London", "United Kingdom", 51.5074, -0.1278, 8982000],
  ["paris", "Paris", "France", 48.8566, 2.3522, 2161000],
  ["sydney", "Sydney", "Australia", -33.8688, 151.2093, 5312163],
  ["rio", "Rio de Janeiro", "Brazil", -22.9068, -43.1729, 6748000],
  ["cairo", "Cairo", "Egypt", 30.0444, 31.2357, 9540000],
  ["mumbai", "Mumbai", "India", 19.0760, 72.8777, 20411274],
  ["shanghai", "Shanghai", "China", 31.2304, 121.4737, 24870895],
  ["capetown", "Cape Town", "South Africa", -33.9249, 18.4241, 4618000],
  ["mexico_city", "Mexico City", "Mexico", 19.4326, -99.1332, 9209944],
  ["rome", "Rome", "Italy", 41.9028, 12.4964, 2873000],
  ["istanbul", "Istanbul", "Turkey", 41.0082, 28.9784, 15460000],
  ["dubai", "Dubai", "United Arab Emirates", 25.2048, 55.2708, 3331420],
  ["singapore", "Singapore", "Singapore", 1.3521, 103.8198, 5686000],
  ["bangkok", "Bangkok", "Thailand", 13.7563, 100.5018, 10539000],
  ["los_angeles", "Los Angeles", "United States", 34.0522, -118.2437, 3990456],
  ["berlin", "Berlin", "Germany", 52.5200, 13.4050, 3670000],
  ["moscow", "Moscow", "Russia", 55.7558, 37.6173, 12506468],
  ["barcelona", "Barcelona", "Spain", 41.3851, 2.1734, 1636732],
];

// Perceived population starts equal to the census figure until people guess.
export const seedCities: City[] = SEED.map(
  ([id, name, country, latitude, longitude, officialPopulation]) => ({
    id,
    name,
    country,
    coordinates: { latitude, longitude },
    officialPopulation,
    perceivedPopulation: officialPopulation,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0,
  })
);

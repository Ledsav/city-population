// src/services/firebaseInitializer.ts
import { City, firebaseService } from './firebase';

// Initial city data
const initialCities: City[] = [
  {
    id: "nyc",
    name: "New York City",
    country: "United States",
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    officialPopulation: 8804190,
    perceivedPopulation: 8804190, // Start with official as perceived
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    coordinates: {
      latitude: 35.6762,
      longitude: 139.6503
    },
    officialPopulation: 13929286,
    perceivedPopulation: 13929286,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    coordinates: {
      latitude: 51.5074,
      longitude: -0.1278
    },
    officialPopulation: 8982000,
    perceivedPopulation: 8982000,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    coordinates: {
      latitude: 48.8566,
      longitude: 2.3522
    },
    officialPopulation: 2161000,
    perceivedPopulation: 2161000,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    coordinates: {
      latitude: -33.8688,
      longitude: 151.2093
    },
    officialPopulation: 5312163,
    perceivedPopulation: 5312163,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "rio",
    name: "Rio de Janeiro",
    country: "Brazil",
    coordinates: {
      latitude: -22.9068,
      longitude: -43.1729
    },
    officialPopulation: 6748000,
    perceivedPopulation: 6748000,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "cairo",
    name: "Cairo",
    country: "Egypt",
    coordinates: {
      latitude: 30.0444,
      longitude: 31.2357
    },
    officialPopulation: 9540000,
    perceivedPopulation: 9540000,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "mumbai",
    name: "Mumbai",
    country: "India",
    coordinates: {
      latitude: 19.0760,
      longitude: 72.8777
    },
    officialPopulation: 20411274,
    perceivedPopulation: 20411274,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "shanghai",
    name: "Shanghai",
    country: "China",
    coordinates: {
      latitude: 31.2304,
      longitude: 121.4737
    },
    officialPopulation: 24870895,
    perceivedPopulation: 24870895,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "capetown",
    name: "Cape Town",
    country: "South Africa",
    coordinates: {
      latitude: -33.9249,
      longitude: 18.4241
    },
    officialPopulation: 4618000,
    perceivedPopulation: 4618000,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "mexico_city",
    name: "Mexico City",
    country: "Mexico",
    coordinates: {
      latitude: 19.4326,
      longitude: -99.1332
    },
    officialPopulation: 9209944,
    perceivedPopulation: 9209944,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "rome",
    name: "Rome",
    country: "Italy",
    coordinates: {
      latitude: 41.9028,
      longitude: 12.4964
    },
    officialPopulation: 2873000,
    perceivedPopulation: 2873000,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "istanbul",
    name: "Istanbul",
    country: "Turkey",
    coordinates: {
      latitude: 41.0082,
      longitude: 28.9784
    },
    officialPopulation: 15460000,
    perceivedPopulation: 15460000,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    coordinates: {
      latitude: 25.2048,
      longitude: 55.2708
    },
    officialPopulation: 3331420,
    perceivedPopulation: 3331420,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    coordinates: {
      latitude: 1.3521,
      longitude: 103.8198
    },
    officialPopulation: 5686000,
    perceivedPopulation: 5686000,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    coordinates: {
      latitude: 13.7563,
      longitude: 100.5018
    },
    officialPopulation: 10539000,
    perceivedPopulation: 10539000,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "los_angeles",
    name: "Los Angeles",
    country: "United States",
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437
    },
    officialPopulation: 3990456,
    perceivedPopulation: 3990456,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    coordinates: {
      latitude: 52.5200,
      longitude: 13.4050
    },
    officialPopulation: 3670000,
    perceivedPopulation: 3670000,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "moscow",
    name: "Moscow",
    country: "Russia",
    coordinates: {
      latitude: 55.7558,
      longitude: 37.6173
    },
    officialPopulation: 12506468,
    perceivedPopulation: 12506468,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    coordinates: {
      latitude: 41.3851,
      longitude: 2.1734
    },
    officialPopulation: 1636732,
    perceivedPopulation: 1636732,
    numberOfEstimates: 0,
    averageConfidenceLevel: 0

  }
];

export class FirebaseInitializer {
  private initialized = false;

  /**
   * Check if the database has been initialized and seed if needed
   */
  async ensureDatabaseInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if we already have data
      const existingCities = await firebaseService.getAllCities();

      if (existingCities.length === 0) {
        console.log("No cities found in database. Seeding with initial data...");
        await firebaseService.seedDatabase(initialCities);
        console.log("Database successfully initialized");
      } else {
        console.log(`Database already contains ${existingCities.length} cities`);
      }

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  /**
   * Get the current state of all cities from the database
   */
  async getDatabaseState(): Promise<{
    initialized: boolean;
    cities: City[];
  }> {
    try {
      const cities = await firebaseService.getAllCities();

      return {
        initialized: this.initialized,
        cities
      };
    } catch (error) {
      console.error("Failed to get database state:", error);
      return {
        initialized: false,
        cities: []
      };
    }
  }
}

export const firebaseInitializer = new FirebaseInitializer();
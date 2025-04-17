// src/services/dbInitializer.ts
import { City, CityWithPerceptions } from "@/types";
import { db } from "./db";

// Initial city data with coordinates
const initialCities: City[] = [
  {
    id: "nyc",
    name: "New York City",
    country: "United States",
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    officialPopulation: 8804190
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    coordinates: {
      latitude: 35.6762,
      longitude: 139.6503
    },
    officialPopulation: 13929286
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    coordinates: {
      latitude: 51.5074,
      longitude: -0.1278
    },
    officialPopulation: 8982000
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    coordinates: {
      latitude: 48.8566,
      longitude: 2.3522
    },
    officialPopulation: 2161000
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    coordinates: {
      latitude: -33.8688,
      longitude: 151.2093
    },
    officialPopulation: 5312163
  },
  {
    id: "rio",
    name: "Rio de Janeiro",
    country: "Brazil",
    coordinates: {
      latitude: -22.9068,
      longitude: -43.1729
    },
    officialPopulation: 6748000
  },
  {
    id: "cairo",
    name: "Cairo",
    country: "Egypt",
    coordinates: {
      latitude: 30.0444,
      longitude: 31.2357
    },
    officialPopulation: 9540000
  },
  {
    id: "mumbai",
    name: "Mumbai",
    country: "India",
    coordinates: {
      latitude: 19.0760,
      longitude: 72.8777
    },
    officialPopulation: 20411274
  },
  {
    id: "shanghai",
    name: "Shanghai",
    country: "China",
    coordinates: {
      latitude: 31.2304,
      longitude: 121.4737
    },
    officialPopulation: 24870895
  },
  {
    id: "capetown",
    name: "Cape Town",
    country: "South Africa",
    coordinates: {
      latitude: -33.9249,
      longitude: 18.4241
    },
    officialPopulation: 4618000
  }
];

// Sample perception data for testing
const samplePerceptions = {
  "nyc": {
    averagePerceivedPopulation: 12000000,
    totalPerceptions: 120,
    perceptionGap: 3195810
  },
  "tokyo": {
    averagePerceivedPopulation: 11500000,
    totalPerceptions: 105,
    perceptionGap: -2429286
  },
  "london": {
    averagePerceivedPopulation: 9500000,
    totalPerceptions: 98,
    perceptionGap: 518000
  },
  "paris": {
    averagePerceivedPopulation: 4500000,
    totalPerceptions: 115,
    perceptionGap: 2339000
  },
  "sydney": {
    averagePerceivedPopulation: 4000000,
    totalPerceptions: 89,
    perceptionGap: -1312163
  },
  "rio": {
    averagePerceivedPopulation: 10000000,
    totalPerceptions: 78,
    perceptionGap: 3252000
  },
  "cairo": {
    averagePerceivedPopulation: 15000000,
    totalPerceptions: 65,
    perceptionGap: 5460000
  },
  "mumbai": {
    averagePerceivedPopulation: 15000000,
    totalPerceptions: 92,
    perceptionGap: -5411274
  },
  "shanghai": {
    averagePerceivedPopulation: 18000000,
    totalPerceptions: 87,
    perceptionGap: -6870895
  },
  "capetown": {
    averagePerceivedPopulation: 2500000,
    totalPerceptions: 73,
    perceptionGap: -2118000
  }
};

class DatabaseInitializer {
  private initialized = false;

  async initializeDatabase(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize the database
      await db.init();

      // Check if we already have data
      const existingCities = await db.getCities();

      if (existingCities.length === 0) {
        console.log("Populating database with initial city data...");

        // Add cities one by one with error handling
        for (const city of initialCities) {
          try {
            await db.addCity(city);

            // Add sample perceptions for testing
            if (samplePerceptions[city.id as keyof typeof samplePerceptions]) {
              // Generate random perceptions that average to the sample perception
              const percep = samplePerceptions[city.id as keyof typeof samplePerceptions];
              const totalToAdd = percep.totalPerceptions;
              const avgValue = percep.averagePerceivedPopulation;
              
              // Create a distribution of values around the average
              for (let i = 0; i < totalToAdd; i++) {
                // Random value that's within ±30% of the average
                const randomFactor = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
                const estimatedPopulation = Math.round(avgValue * randomFactor);
                
                await db.addPerception({
                  cityId: city.id,
                  estimatedPopulation,
                  timestamp: new Date(Date.now() - Math.random() * 7776000000).toISOString(), // Random date in last 90 days
                  confidenceLevel: Math.floor(Math.random() * 5) + 1,
                  userDemographics: {
                    ageRange: ["18-24", "25-34", "35-44", "45-54", "55+"][Math.floor(Math.random() * 5)],
                    urbanResidency: Math.random() > 0.3 // 70% urban
                  }
                });
              }
            }
          } catch (error) {
            if (error instanceof Error && error.name === "ConstraintError") {
              console.log(`City ${city.id} already exists, skipping...`);
              continue;
            }
            throw error;
          }
        }

        console.log("Database successfully populated with initial data");
      } else {
        console.log("Database already contains city data");
      }

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  async reset(): Promise<void> {
    try {
      // Delete the existing database
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase("cityPopulationDB");
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Reset initialized flag
      this.initialized = false;

      // Reinitialize with fresh data
      await this.initializeDatabase();

      console.log("Database successfully reset");
    } catch (error) {
      console.error("Failed to reset database:", error);
      throw error;
    }
  }

  async getDatabaseState(): Promise<{
    initialized: boolean;
    cityCount: number;
    cities: CityWithPerceptions[];
  }> {
    try {
      await db.init();
      const cities = await db.getCities();

      // Convert cities to CityWithPerceptions format
      const citiesWithPerceptions: CityWithPerceptions[] = await Promise.all(
        cities.map(async (city) => {
          try {
            const perceptions = await db.getPerceptionsForCity(city.id);
            
            // Calculate perception statistics
            const totalPerceptions = perceptions.length;
            const averagePerceivedPopulation =
              perceptions.length > 0
                ? perceptions.reduce((sum, p) => sum + p.estimatedPopulation, 0) /
                  totalPerceptions
                : city.officialPopulation;

            return {
              ...city,
              perceptions: {
                averagePerceivedPopulation,
                totalPerceptions,
                perceptionGap:
                  averagePerceivedPopulation - city.officialPopulation,
                perceptions,
              },
            };
          } catch (err) {
            console.error(`Error processing city ${city.id}:`, err);
            // Return a default value if there's an error
            return {
              ...city,
              perceptions: {
                averagePerceivedPopulation: city.officialPopulation,
                totalPerceptions: 0,
                perceptionGap: 0,
                perceptions: [],
              },
            };
          }
        })
      );

      return {
        initialized: this.initialized,
        cityCount: cities.length,
        cities: citiesWithPerceptions,
      };
    } catch (error) {
      console.error("Failed to get database state:", error);
      return {
        initialized: false,
        cityCount: 0,
        cities: [],
      };
    }
  }
}

export const dbInitializer = new DatabaseInitializer();
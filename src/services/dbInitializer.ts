// src/services/dbInitializer.ts
import { City, CityWithPerceptions } from "@/types";
import { db } from "./db";

// Initial city data remains the same...
const initialCities: City[] = [
  /* ... your existing cities ... */
];

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

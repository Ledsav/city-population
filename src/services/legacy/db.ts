// src/services/db.ts
import { City, PopulationPerception } from "@/types";

const DB_NAME = "cityPopulationDB";
const DB_VERSION = 1;



class CityPopulationDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Cities store with id as key
        if (!db.objectStoreNames.contains("cities")) {
          const cityStore = db.createObjectStore("cities", { keyPath: "id" });
          cityStore.createIndex("name", "name", { unique: false });
          cityStore.createIndex("country", "country", { unique: false });
        }

        // Perceptions store with auto-incrementing id
        if (!db.objectStoreNames.contains("perceptions")) {
          const perceptionStore = db.createObjectStore("perceptions", {
            keyPath: "id",
            autoIncrement: true,
          });
          perceptionStore.createIndex("cityId", "cityId", { unique: false });
          perceptionStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }
      };
    });
  }

  // Cities operations
  async addCity(city: City): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("cities", "readwrite");
      const store = transaction.objectStore("cities");
      const request = store.add(city);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCities(): Promise<City[]> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("cities", "readonly");
      const store = transaction.objectStore("cities");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Perceptions operations
  async addPerception(
    perception: Omit<PopulationPerception, "id">
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("perceptions", "readwrite");
      const store = transaction.objectStore("perceptions");
      const request = store.add({
        ...perception,
        timestamp: new Date().toISOString(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPerceptionsForCity(cityId: string): Promise<PopulationPerception[]> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("perceptions", "readonly");
      const store = transaction.objectStore("perceptions");
      const index = store.index("cityId");
      const request = index.getAll(cityId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Compute perception statistics
  async computeCityPerceptions(cityId: string): Promise<{
    averagePerceivedPopulation: number;
    totalPerceptions: number;
    perceptionGap: number;
  }> {
    const perceptions = await this.getPerceptionsForCity(cityId);
    const city = await this.getCity(cityId);

    if (!city || perceptions.length === 0) {
      throw new Error("City not found or no perceptions available");
    }

    const totalEstimated = perceptions.reduce(
      (sum, p) => sum + p.estimatedPopulation,
      0
    );
    const averagePerceivedPopulation = totalEstimated / perceptions.length;
    const perceptionGap = averagePerceivedPopulation - city.officialPopulation;

    return {
      averagePerceivedPopulation,
      totalPerceptions: perceptions.length,
      perceptionGap,
    };
  }

  private async getCity(id: string): Promise<City | null> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("cities", "readonly");
      const store = transaction.objectStore("cities");
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
}

export const db = new CityPopulationDB();

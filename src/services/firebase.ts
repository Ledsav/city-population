// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  Firestore,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { firebaseConfig } from '../config/firebaseConfig';

// City type with simplified structure
export interface City {
  id: string;
  name: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  officialPopulation: number;
  perceivedPopulation: number;
  numberOfEstimates: number;
  averageConfidenceLevel: number;
}

export class FirebaseService {
  private app;
  private db: Firestore;
  private cachedCities: City[] | null = null;

  constructor() {
    try {
      // Log Firebase config for debugging (masking sensitive info)
      console.log("Initializing Firebase with config:", {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        // Don't log API key or other sensitive info
      });

      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      // In a real app, you might want to show a user-friendly error or retry
      throw new Error("Firebase initialization failed. Check your configuration.");
    }
  }

  /**
   * Fetches all cities from Firestore
   * Using caching to minimize db calls
   */
  async getAllCities(): Promise<City[]> {
    // Return cached cities if available
    if (this.cachedCities) {
      console.log("Returning cached cities data");
      return this.cachedCities;
    }

    try {
      console.log("Fetching cities from Firestore...");
      const citiesCollection = collection(this.db, 'cities');
      const citySnapshot = await getDocs(citiesCollection);
      
      if (citySnapshot.empty) {
        console.log("No cities found in database");
        return [];
      }
      
      const cityList = citySnapshot.docs.map(doc => {
        const data = doc.data() as City;
        // Ensure the document ID is used as the city ID
        return { ...data, id: doc.id };
      });
      
      console.log(`Fetched ${cityList.length} cities from Firestore`);
      
      // Cache the result
      this.cachedCities = cityList;
      
      return cityList;
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw new Error('Failed to fetch cities from the database');
    }
  }

  /**
   * Updates city with new estimate
   * Recalculates the averages using the formula:
   * newAverage = ((oldAverage * oldCount) + newValue) / (oldCount + 1)
   */
  async updateCityEstimate(cityId: string, estimatedPopulation: number, confidenceLevel: number): Promise<void> {
    try {
      // Fetch latest data for this city to ensure accuracy
      const allCities = await this.getAllCities();
      const city = allCities.find(c => c.id === cityId);
      
      if (!city) {
        throw new Error(`City with ID ${cityId} not found`);
      }

      // Calculate new perceived population average
      const newNumberOfEstimates = city.numberOfEstimates + 1;
      const newPerceivedPopulation = (
        (city.perceivedPopulation * city.numberOfEstimates) + estimatedPopulation
      ) / newNumberOfEstimates;

      // Calculate new confidence level average
      const newAverageConfidenceLevel = (
        (city.averageConfidenceLevel * city.numberOfEstimates) + confidenceLevel
      ) / newNumberOfEstimates;

      // Update the document in Firestore
      const cityRef = doc(this.db, 'cities', cityId);
      await updateDoc(cityRef, {
        perceivedPopulation: newPerceivedPopulation,
        numberOfEstimates: newNumberOfEstimates,
        averageConfidenceLevel: newAverageConfidenceLevel
      });

      // Update the cached version too
      if (this.cachedCities) {
        const cachedCityIndex = this.cachedCities.findIndex(c => c.id === cityId);
        if (cachedCityIndex >= 0) {
          this.cachedCities[cachedCityIndex] = {
            ...city,
            perceivedPopulation: newPerceivedPopulation,
            numberOfEstimates: newNumberOfEstimates,
            averageConfidenceLevel: newAverageConfidenceLevel
          };
        }
      }
    } catch (error) {
      console.error('Error updating city estimate:', error);
      throw new Error('Failed to update city estimate');
    }
  }

  /**
   * Updates multiple cities with new estimates in a batch
   */
  async updateMultipleCityEstimates(estimates: Array<{
    cityId: string;
    estimatedPopulation: number;
    confidenceLevel: number;
  }>): Promise<void> {
    try {
      // Process each estimate sequentially
      for (const estimate of estimates) {
        await this.updateCityEstimate(
          estimate.cityId,
          estimate.estimatedPopulation,
          estimate.confidenceLevel
        );
      }
      
      // Invalidate cache after batch update
      this.cachedCities = null;
    } catch (error) {
      console.error('Error updating multiple city estimates:', error);
      throw new Error('Failed to update city estimates in batch');
    }
  }

  /**
   * Initializes the database with seed data
   * This should only be used for first-time setup or testing
   */
  async seedDatabase(initialCities: City[]): Promise<void> {
    try {
      // Add each city to the database
      for (const city of initialCities) {
        await setDoc(doc(this.db, 'cities', city.id), city);
      }
      
      // Invalidate cache after seeding
      this.cachedCities = null;
      
      console.log('Database successfully seeded with initial data');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw new Error('Failed to seed database with initial data');
    }
  }

  /**
   * Clears the cache to force a fresh fetch on next getAllCities call
   */
  clearCache(): void {
    this.cachedCities = null;
  }
}

// Export a singleton instance
export const firebaseService = new FirebaseService();
// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  Firestore,
  getDocs,
  getFirestore,
  runTransaction,
  setDoc,
} from 'firebase/firestore/lite';
import { firebaseConfig } from '../config/firebaseConfig';
import { seedCities } from '../data/seedCities';

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

export interface Estimate {
  cityId: string;
  estimatedPopulation: number;
  confidenceLevel: number;
}

/** Running average: ((avg * n) + value) / (n + 1) */
export const applyEstimate = (city: City, estimate: Estimate): City => {
  const n = city.numberOfEstimates;
  const next = n + 1;
  return {
    ...city,
    numberOfEstimates: next,
    perceivedPopulation: (city.perceivedPopulation * n + estimate.estimatedPopulation) / next,
    averageConfidenceLevel: (city.averageConfidenceLevel * n + estimate.confidenceLevel) / next,
  };
};

/**
 * Firestore Lite keeps the bundle small (no realtime listeners needed).
 * Without a Firebase config (e.g. local dev) the service runs on in-memory seed data.
 */
export class FirebaseService {
  private db: Firestore | null = null;
  private cities: Promise<City[]> | null = null;
  readonly isDemo = !firebaseConfig.projectId;

  private getDb(): Firestore {
    if (!this.db) this.db = getFirestore(initializeApp(firebaseConfig));
    return this.db;
  }

  /** Fetches all cities once, seeding an empty database; concurrent callers share one request. */
  getAllCities(): Promise<City[]> {
    if (!this.cities) {
      this.cities = this.fetchCities().catch((error) => {
        this.cities = null;
        throw error;
      });
    }
    return this.cities;
  }

  private async fetchCities(): Promise<City[]> {
    if (this.isDemo) return seedCities.map((city) => ({ ...city }));

    const db = this.getDb();
    const snapshot = await getDocs(collection(db, 'cities'));
    if (snapshot.empty) {
      await Promise.all(seedCities.map((city) => setDoc(doc(db, 'cities', city.id), city)));
      return seedCities.map((city) => ({ ...city }));
    }
    return snapshot.docs.map((d) => ({ ...(d.data() as City), id: d.id }));
  }

  /**
   * Applies every estimate in parallel. Each city is updated in its own transaction so
   * concurrent visitors can't overwrite each other's contributions to the average.
   */
  async submitEstimates(estimates: Estimate[]): Promise<City[]> {
    const current = await this.getAllCities();
    let updated: City[];

    if (this.isDemo) {
      updated = estimates.map((e) => applyEstimate(current.find((c) => c.id === e.cityId)!, e));
    } else {
      const db = this.getDb();
      updated = await Promise.all(
        estimates.map((estimate) =>
          runTransaction(db, async (tx) => {
            const ref = doc(db, 'cities', estimate.cityId);
            const snap = await tx.get(ref);
            if (!snap.exists()) throw new Error(`City ${estimate.cityId} not found`);
            const next = applyEstimate({ ...(snap.data() as City), id: snap.id }, estimate);
            tx.update(ref, {
              perceivedPopulation: next.perceivedPopulation,
              numberOfEstimates: next.numberOfEstimates,
              averageConfidenceLevel: next.averageConfidenceLevel,
            });
            return next;
          })
        )
      );
    }

    const byId = new Map(updated.map((c) => [c.id, c]));
    const merged = current.map((c) => byId.get(c.id) ?? c);
    this.cities = Promise.resolve(merged);
    return merged;
  }
}

export const firebaseService = new FirebaseService();

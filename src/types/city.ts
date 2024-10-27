import type { Coordinates } from "./geography";
import type { Demographics } from "./demographics";

export type City = {
  id: string;
  name: string;
  country: string;
  coordinates: Coordinates;
  officialPopulation: number;
  metropolitanPopulation?: number;
  historicalPopulation?: {
    year: number;
    population: number;
  }[];
  demographics?: Demographics;
};

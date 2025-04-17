import type { Coordinates } from "./geography";
import type { UserDemographics } from "./demographics";

export type PopulationPerception = {
  cityId: string;
  estimatedPopulation: number;
  timestamp: string;
  userId?: string;
  userLocation?: Coordinates;
  confidenceLevel?: number; // 1-5 scale
  userDemographics?: UserDemographics;
};

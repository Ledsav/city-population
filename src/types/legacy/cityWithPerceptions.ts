import type { City } from "./city";
import type { PopulationPerception } from "./perception";

export type CityWithPerceptions = City & {
  perceptions: {
    averagePerceivedPopulation: number;
    totalPerceptions: number;
    perceptionGap: number; 
    perceptions: PopulationPerception[];
  };
};

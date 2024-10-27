import type { CityWithPerceptions } from "../../types/cityWithPerceptions";

export const sampleCities: CityWithPerceptions[] = [
  {
    id: "NYC",
    name: "New York City",
    country: "United States",
    coordinates: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    officialPopulation: 8804190,
    metropolitanPopulation: 20140470,
    demographics: {
      medianAge: 36.7,
      populationDensity: 27012,
      growthRate: 0.3,
    },
    perceptions: {
      averagePerceivedPopulation: 9200000,
      totalPerceptions: 1500,
      perceptionGap: 395810,
      perceptions: [],
    },
  },
  {
    id: "LON",
    name: "London",
    country: "United Kingdom",
    coordinates: {
      latitude: 51.5074,
      longitude: -0.1278,
    },
    officialPopulation: 9002488,
    metropolitanPopulation: 14257962,
    demographics: {
      medianAge: 35.6,
      populationDensity: 5701,
      growthRate: 1.1,
    },
    perceptions: {
      averagePerceivedPopulation: 8500000,
      totalPerceptions: 1200,
      perceptionGap: -502488,
      perceptions: [],
    },
  },
  {
    id: "TKY",
    name: "Tokyo",
    country: "Japan",
    coordinates: {
      latitude: 35.6762,
      longitude: 139.6503,
    },
    officialPopulation: 13960236,
    metropolitanPopulation: 37393129,
    demographics: {
      medianAge: 48.4,
      populationDensity: 6349,
      growthRate: -0.1,
    },
    perceptions: {
      averagePerceivedPopulation: 15000000,
      totalPerceptions: 2000,
      perceptionGap: 1039764,
      perceptions: [],
    },
  },
];

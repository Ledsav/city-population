import { applyEstimate, City } from './services/firebase';
import { cityGap, formatSpoken, gapPercent, parsePopulation } from './lib/perception';

const city: City = {
  id: 'x',
  name: 'X',
  country: 'Y',
  coordinates: { latitude: 0, longitude: 0 },
  officialPopulation: 1_000_000,
  perceivedPopulation: 1_000_000,
  numberOfEstimates: 0,
  averageConfidenceLevel: 0,
};

test('parses plain and shorthand populations', () => {
  expect(parsePopulation('8,804,190')).toBe(8804190);
  expect(parsePopulation('4.5m')).toBe(4_500_000);
  expect(parsePopulation('850K')).toBe(850_000);
  expect(parsePopulation('1.2b')).toBe(1_200_000_000);
  expect(parsePopulation('')).toBeNull();
  expect(parsePopulation('abc')).toBeNull();
  expect(parsePopulation('0')).toBeNull();
  expect(parsePopulation('9b')).toBeNull();
});

test('keeps a running average of estimates', () => {
  const one = applyEstimate(city, { cityId: 'x', estimatedPopulation: 3_000_000, confidenceLevel: 4 });
  expect(one.perceivedPopulation).toBe(3_000_000);
  const two = applyEstimate(one, { cityId: 'x', estimatedPopulation: 1_000_000, confidenceLevel: 2 });
  expect(two.perceivedPopulation).toBe(2_000_000);
  expect(two.averageConfidenceLevel).toBe(3);
  expect(two.numberOfEstimates).toBe(2);
  expect(gapPercent(two)).toBe(100);
  expect(cityGap(two)).toBe('way-over');
});

test('marks unguessed cities as neutral', () => {
  expect(cityGap(city)).toBe('none');
});

test('reads numbers aloud', () => {
  expect(formatSpoken(8_804_190)).toBe('8.8 million');
  expect(formatSpoken(1_500_000_000)).toBe('1.5 billion');
});

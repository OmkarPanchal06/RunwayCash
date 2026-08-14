export interface RunwaySnapshot {
  safeToSpendTodayCents: number;
  projection: Array<{
    date: string;
    projectedBalanceCents: number;
    weatherState: 'sunny' | 'cloudy' | 'stormy' | 'thunderstorm';
  }>;
}

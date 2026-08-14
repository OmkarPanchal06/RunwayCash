import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';
import MoneyWeatherStrip, { WeatherDay } from '../components/MoneyWeatherStrip';

// Helper to format cents into beautiful currency strings
const formatCents = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export default function HomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [safeToSpendCents, setSafeToSpendCents] = useState(0);
  const [forecast, setForecast] = useState<WeatherDay[]>([]);

  useEffect(() => {
    // In production, this pulls the cached snapshot from WatermelonDB/Server.
    // Simulating data fetch for UI scaffolding...
    setTimeout(() => {
      setSafeToSpendCents(47500); // $475.00
      
      // Generate mock 30-day weather data
      const mockDays: WeatherDay[] = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        let state: WeatherDay['weatherState'] = 'sunny';
        if (i > 10 && i < 15) state = 'cloudy';
        if (i === 15) state = 'stormy';
        if (i === 16) state = 'thunderstorm';

        return {
          date: d.toISOString().split('T')[0],
          projectedBalanceCents: 100000 - (i * 2000),
          weatherState: state,
        };
      });
      
      setForecast(mockDays);
      setLoading(false);
    }, 600);
  }, []);

  const handleDayPress = (day: WeatherDay) => {
    // Opens bottom sheet breakdown in production
    console.log('Tapped day:', day.date);
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <View style={styles.content}>
          {/* Main Runway Display */}
          <View style={styles.runwayHeader}>
            <Text style={styles.label}>Safe to Spend Today</Text>
            <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
              {formatCents(safeToSpendCents)}
            </Text>
            <Text style={styles.contextText}>
              based on your last 60 days of spending
            </Text>
          </View>

          {/* 30-Day Money Weather Strip */}
          <MoneyWeatherStrip days={forecast} onDayPress={handleDayPress} />

          {/* Quick-Add FAB (Floating Action Button) */}
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => console.log('Navigate to AddTransaction')}
            activeOpacity={0.8}
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  runwayHeader: {
    alignItems: 'center',
    marginTop: 64,
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 72,
    fontWeight: '800',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    marginBottom: 16,
  },
  contextText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2, // Optical alignment
  },
});

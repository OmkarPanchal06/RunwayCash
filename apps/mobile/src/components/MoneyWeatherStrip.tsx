import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export type WeatherState = 'sunny' | 'cloudy' | 'stormy' | 'thunderstorm';

export interface WeatherDay {
  date: string; // YYYY-MM-DD
  projectedBalanceCents: number;
  weatherState: WeatherState;
}

interface Props {
  days: WeatherDay[];
  onDayPress: (day: WeatherDay) => void;
}

const WEATHER_CONFIG = {
  sunny: { icon: '☀️', color: '#FBBF24', label: 'Surplus' },
  cloudy: { icon: '⛅', color: '#94A3B8', label: 'Tight' },
  stormy: { icon: '🌧️', color: '#D97706', label: 'At-Risk' },
  thunderstorm: { icon: '⛈️', color: '#EF4444', label: 'Shortfall' }
};

export default function MoneyWeatherStrip({ days, onDayPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>30-Day Forecast</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => {
          const config = WEATHER_CONFIG[day.weatherState];
          // We assume UTC parsing to avoid timezone shifts
          const [year, month, dayStr] = day.date.split('-');
          const dateObj = new Date(Date.UTC(parseInt(year), parseInt(month)-1, parseInt(dayStr)));
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
          const dayNum = dateObj.getUTCDate();

          return (
            <TouchableOpacity 
              key={day.date} 
              style={[styles.dayCard, { backgroundColor: `${config.color}10`, borderColor: `${config.color}30` }]}
              onPress={() => onDayPress(day)}
              activeOpacity={0.7}
            >
              <Text style={styles.dayName}>{dayName}</Text>
              <Text style={styles.dayNum}>{dayNum}</Text>
              <Text style={styles.icon}>{config.icon}</Text>
              <View style={[styles.indicator, { backgroundColor: config.color }]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.legend}>
        {Object.values(WEATHER_CONFIG).map(cfg => (
          <View key={cfg.label} style={styles.legendItem}>
            <Text style={styles.legendIcon}>{cfg.icon}</Text>
            <Text style={styles.legendText}>{cfg.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dayCard: {
    width: 64,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginBottom: 8,
  },
  indicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendIcon: {
    fontSize: 14,
  },
  legendText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  }
});

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Switch, 
  SafeAreaView, 
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import MoneyWeatherStrip, { WeatherDay } from '../components/MoneyWeatherStrip';

// Helper to generate mock forecast to demonstrate the UI behavior
const generateForecast = (startingBalanceCents: number): WeatherDay[] => {
    return Array.from({ length: 30 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        let state: WeatherDay['weatherState'] = 'sunny';
        // Assume spending $25 a day on average
        const bal = startingBalanceCents - (i * 2500); 
        
        if (bal < 0) state = 'thunderstorm';
        else if (bal < 10000) state = 'stormy';
        else if (bal < 40000) state = 'cloudy';

        return {
          date: d.toISOString().split('T')[0],
          projectedBalanceCents: bal,
          weatherState: state,
        };
    });
};

export default function ForkSimulatorScreen() {
    const [simulateEnabled, setSimulateEnabled] = useState(false);
    const [hypotheticalAmount, setHypotheticalAmount] = useState('800'); // $800 expense
    
    // Base reality: starts with $1,500
    const baseBalance = 150000; 
    const realityForecast = generateForecast(baseBalance);
    
    // Simulated reality: starts with $1,500 - $amount
    const expenseCents = (parseFloat(hypotheticalAmount) || 0) * 100;
    const simulatedForecast = generateForecast(baseBalance - expenseCents);
    
    const activeForecast = simulateEnabled ? simulatedForecast : realityForecast;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>What-If Simulator</Text>
                    <Text style={styles.subtitle}>Test a purchase without touching your real budget.</Text>
                </View>
                
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Hypothetical Expense Today</Text>
                    <View style={styles.inputRow}>
                        <Text style={styles.currency}>$</Text>
                        <TextInput 
                            style={styles.input}
                            keyboardType="numeric"
                            value={hypotheticalAmount}
                            onChangeText={setHypotheticalAmount}
                        />
                    </View>
                    
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Activate Simulation</Text>
                        <Switch 
                            value={simulateEnabled} 
                            onValueChange={setSimulateEnabled}
                            trackColor={{ false: '#334155', true: '#3B82F6' }}
                        />
                    </View>
                </View>
                
                <View style={styles.previewContainer}>
                    <Text style={[styles.previewLabel, simulateEnabled && styles.previewLabelActive]}>
                        {simulateEnabled ? '🔮 Simulated Forecast' : '🌍 Current Reality'}
                    </Text>
                    <Text style={styles.previewContext}>
                        {simulateEnabled 
                            ? "This is what your next 30 days look like if you buy it." 
                            : "Your current safe trajectory."}
                    </Text>
                </View>

                <View style={[styles.stripWrapper, simulateEnabled && styles.stripWrapperActive]}>
                    <MoneyWeatherStrip days={activeForecast} onDayPress={() => {}} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#1E293B',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 40,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  currency: {
    fontSize: 40,
    color: '#94A3B8',
    marginRight: 8,
    fontWeight: '300',
  },
  input: {
    fontSize: 48,
    color: '#F8FAFC',
    fontWeight: '700',
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  previewContainer: {
    paddingHorizontal: 24,
    marginBottom: -16,
  },
  previewLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
  },
  previewLabelActive: {
    color: '#A78BFA', // Soft purple to indicate magic/simulation
  },
  previewContext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  stripWrapper: {
    opacity: 0.8, // Dim reality slightly
  },
  stripWrapperActive: {
    opacity: 1,
  }
});

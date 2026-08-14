import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Switch, 
  SafeAreaView, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import MoneyWeatherStrip, { WeatherDay } from '../components/MoneyWeatherStrip';
import { API_URL, MOCK_ACCOUNT_ID } from '../config';

export default function ForkSimulatorScreen() {
    const [simulateEnabled, setSimulateEnabled] = useState(false);
    const [hypotheticalAmount, setHypotheticalAmount] = useState('800'); 
    
    const [realityForecast, setRealityForecast] = useState<WeatherDay[]>([]);
    const [simulatedForecast, setSimulatedForecast] = useState<WeatherDay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);

    // 1. Fetch the REAL forecast on mount
    useEffect(() => {
        const fetchReality = async () => {
            try {
                const res = await fetch(`${API_URL}/accounts/${MOCK_ACCOUNT_ID}/runway`);
                const data = await res.json();
                if (data.projection) {
                    setRealityForecast(data.projection);
                }
            } catch (err) {
                console.error('Failed to fetch reality:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReality();
    }, []);

    // 2. Fetch the SIMULATED forecast whenever the toggle is hit
    useEffect(() => {
        if (!simulateEnabled) return;
        
        const fetchSimulation = async () => {
            setIsSimulating(true);
            try {
                const expenseCents = -(parseFloat(hypotheticalAmount) || 0) * 100; // Negative for expense
                
                const res = await fetch(`${API_URL}/accounts/${MOCK_ACCOUNT_ID}/forks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Hypothetical Purchase',
                        diff_json: {
                            overrides: {
                                transactions: [
                                    {
                                        amount_cents: expenseCents,
                                        occurred_at: new Date().toISOString(),
                                        is_discretionary: true
                                    }
                                ]
                            }
                        }
                    })
                });
                const data = await res.json();
                if (data.simulatedSnapshot?.projection) {
                    setSimulatedForecast(data.simulatedSnapshot.projection);
                }
            } catch (err) {
                console.error('Failed to run simulation fork:', err);
            } finally {
                setIsSimulating(false);
            }
        };
        
        // Debounce slightly to prevent spamming if amount changes while toggle is on
        const timer = setTimeout(fetchSimulation, 500);
        return () => clearTimeout(timer);
    }, [simulateEnabled, hypotheticalAmount]);
    
    const activeForecast = simulateEnabled ? simulatedForecast : realityForecast;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
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
                    {isLoading || isSimulating ? (
                        <ActivityIndicator size="large" color="#3B82F6" style={{marginTop: 40}} />
                    ) : (
                        <MoneyWeatherStrip days={activeForecast.length > 0 ? activeForecast : []} onDayPress={() => {}} />
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 24, paddingTop: 40 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94A3B8' },
  card: { backgroundColor: '#1E293B', marginHorizontal: 24, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 40 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 8 },
  currency: { fontSize: 40, color: '#94A3B8', marginRight: 8, fontWeight: '300' },
  input: { fontSize: 48, color: '#F8FAFC', fontWeight: '700', flex: 1, fontVariant: ['tabular-nums'] },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  toggleLabel: { fontSize: 16, color: '#F8FAFC', fontWeight: '500' },
  previewContainer: { paddingHorizontal: 24, marginBottom: -16 },
  previewLabel: { fontSize: 18, fontWeight: '700', color: '#94A3B8' },
  previewLabelActive: { color: '#A78BFA' },
  previewContext: { fontSize: 14, color: '#64748B', marginTop: 4 },
  stripWrapper: { opacity: 0.8 },
  stripWrapperActive: { opacity: 1 }
});

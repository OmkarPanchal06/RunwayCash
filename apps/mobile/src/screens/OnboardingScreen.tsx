import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Image
} from 'react-native';

export default function OnboardingScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroContainer}>
          <Text style={styles.logo}>RunwayCash</Text>
          <Text style={styles.weatherEmojis}>☀️ ⛅ 🌧️</Text>
          <Text style={styles.title}>Stop budgeting the past.</Text>
          <Text style={styles.subtitle}>
            Most apps show you where your money went. We show you exactly how much is safe to spend today, before you swipe.
          </Text>
        </View>
        
        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>The 30-Day Money Weather</Text>
          <Text style={styles.featureDesc}>
            We analyze your recurring bills and daily spending velocity to project your balance 30 days forward. 
            If a purchase today causes a shortfall next week, we'll warn you instantly.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  heroContainer: {
    marginTop: 40,
  },
  logo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 40,
  },
  weatherEmojis: {
    fontSize: 48,
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 48,
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
    lineHeight: 28,
  },
  featureBox: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FBBF24', // Sunny gold accent
    marginVertical: 40,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
  },
  footer: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  }
});

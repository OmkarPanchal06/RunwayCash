import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Animated 
} from 'react-native';

export default function AddTransactionScreen() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  
  // Animation for the Weather Preview badge
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (amount) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [amount, fadeAnim, slideAnim]);

  const handleSave = async () => {
    // In production:
    // await database.write(async () => {
    //   await database.get('transactions').create(tx => {
    //     tx.amountCents = parseFloat(amount) * 100 * -1; // Outflow is negative
    //     tx.category = category;
    //     tx.note = note;
    //     tx.occurredAt = new Date().toISOString();
    //     tx.idempotencyKey = Math.random().toString(36).substring(7);
    //     tx.isDiscretionary = true;
    //   });
    // });
    console.log('Transaction Saved Locally!', amount);
  };

  // Mock optimistic weather calculation based on amount typed
  const previewState = parseFloat(amount) > 100 ? '⛅ Cloudy' : '☀️ Sunny';
  const previewColor = parseFloat(amount) > 100 ? '#94A3B8' : '#FBBF24'; // muted blue-grey vs soft gold

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>New Transaction</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.currencySymbol}>$</Text>
        <TextInput
          style={styles.amountInput}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#64748B"
          value={amount}
          onChangeText={setAmount}
          autoFocus
        />
      </View>

      <Animated.View style={[
        styles.previewBadge, 
        { 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }],
          backgroundColor: `${previewColor}20`,
          borderColor: previewColor
        }
      ]}>
        <Text style={[styles.previewText, { color: previewColor }]}>
          This will move Thursday to {previewState}
        </Text>
      </Animated.View>

      <View style={styles.formContainer}>
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Coffee, Groceries"
            placeholderTextColor="#94A3B8"
            value={category}
            onChangeText={setCategory}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="What was this for?"
            placeholderTextColor="#94A3B8"
            value={note}
            onChangeText={setNote}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, !amount && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={!amount}
      >
        <Text style={styles.saveButtonText}>Add to Ledger</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep slate dark mode base
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '300',
    color: '#94A3B8',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 64,
    fontWeight: '600',
    color: '#F8FAFC',
    // tabular numerals for nice monetary display
    fontVariant: ['tabular-nums'],
  },
  previewBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 40,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#1E293B',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import Transaction from './models/Transaction';
import Bill from './models/Bill';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, // Optimizes performance for React Native
  onSetUpError: error => {
    console.error('WatermelonDB setup failed:', error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [Transaction, Bill],
});

import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Starting migrations...');
    const migrationFile = path.join(__dirname, '../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('Successfully applied 001_initial_schema.sql');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();

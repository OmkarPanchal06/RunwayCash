import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'runway_user',
  password: process.env.DB_PASSWORD || 'runway_password',
  database: process.env.DB_NAME || 'runwaycash',
});

// Helper for quick queries
export const query = (text: string, params?: any[]) => pool.query(text, params);

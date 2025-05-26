// src/lib/db.ts
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';

const dbPath = process.env.SQLITE_DB_PATH;

if (!dbPath) {
  console.warn('SQLITE_DB_PATH environment variable is not set. SQLite client will not be initialized.');
}

let db: Database | null = null;

export async function getDb() {
  if (!dbPath) {
    return null;
  }
  if (!db) {
    try {
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READONLY // Open in read-only mode
      });
      console.log('Connected to SQLite database at', dbPath);
    } catch (error) {
      console.error('Failed to connect to SQLite database:', error);
      return null;
    }
  }
  return db;
}

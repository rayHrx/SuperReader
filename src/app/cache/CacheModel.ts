import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { capSQLiteChanges, capSQLiteValues, DBSQLiteValues } from './Interfaces';

export class CacheModel {
  private db: SQLiteDBConnection;

  constructor(db: SQLiteDBConnection) {
    this.db = db;
  }

  async initializeCache(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT,
        expiration INTEGER
      )
    `);
  }

  async getExpiration(key: string): Promise<number | undefined> {
    const result: DBSQLiteValues = await this.db.query(
      'SELECT expiration FROM cache WHERE key = ?',
      [key]
    );

    if (result.values && result.values.length > 0) {
      const row = result.values[0] as { expiration: number | null };
      return row.expiration ?? undefined;
    }

    return undefined;
  }

  async get(key: string): Promise<string | null> {
    const result: DBSQLiteValues = await this.db.query(
      'SELECT value FROM cache WHERE key = ? AND (expiration > ? OR expiration IS NULL)',
      [key, Date.now()]
    );

    if (result.values && result.values.length > 0) {
      const row = result.values[0] as { value: string };
      return row.value;
    }

    return null;
  }


  async set(key: string, value: string, expiration?: number): Promise<void> {
    const expirationTime = expiration ? Date.now() + expiration : null;
    await this.db.run(
      'INSERT OR REPLACE INTO cache (key, value, expiration) VALUES (?, ?, ?)',
      [key, value, expirationTime]
    );
  }

  async remove(key: string): Promise<void> {
    await this.db.run('DELETE FROM cache WHERE key = ?', [key]);
  }

  async clear(): Promise<void> {
    await this.db.run('DELETE FROM cache');
  }
}
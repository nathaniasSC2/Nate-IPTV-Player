//! Database module for SQLite operations
//!
//! This module provides a thread-safe wrapper around SQLite with connection pooling
//! and automatic schema initialization.

use parking_lot::Mutex;
use rusqlite::{params, Connection, Result as SqliteResult};
use std::path::Path;
use thiserror::Error;

/// Database error types
#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("SQLite error: {0}")]
    SqliteError(#[from] rusqlite::Error),

    #[error("Database not initialized")]
    NotInitialized,

    #[error("Query returned no results")]
    NoResults,

    #[error("Migration failed: {0}")]
    MigrationError(String),
}

/// Thread-safe database wrapper
pub struct Database {
    connection: Mutex<Connection>,
}

impl Database {
    /// Create a new database connection and initialize the schema
    ///
    /// # Arguments
    /// * `path` - Path to the SQLite database file
    ///
    /// # Returns
    /// * A new Database instance with initialized schema
    pub fn new(path: &Path) -> Result<Self, DatabaseError> {
        let connection = Connection::open(path)?;

        // Enable foreign keys
        connection.execute_batch("PRAGMA foreign_keys = ON;")?;

        // Set journal mode to WAL for better concurrent performance
        connection.execute_batch("PRAGMA journal_mode = WAL;")?;

        // Set synchronous to NORMAL for better performance while maintaining durability
        connection.execute_batch("PRAGMA synchronous = NORMAL;")?;

        let db = Self {
            connection: Mutex::new(connection),
        };

        // Initialize schema
        db.initialize_schema()?;

        Ok(db)
    }

    /// Initialize the database schema
    fn initialize_schema(&self) -> Result<(), DatabaseError> {
        let conn = self.connection.lock();

        conn.execute_batch(
            r#"
            -- Connection profiles table
            CREATE TABLE IF NOT EXISTS connections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                server_url TEXT NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                last_used INTEGER,
                is_active INTEGER DEFAULT 0
            );

            -- Index for connection queries
            CREATE INDEX IF NOT EXISTS idx_connections_last_used ON connections(last_used DESC);

            -- Favorites table
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                connection_id TEXT NOT NULL,
                stream_id INTEGER NOT NULL,
                stream_type TEXT NOT NULL,
                list_name TEXT DEFAULT 'default',
                position INTEGER DEFAULT 0,
                added_at INTEGER NOT NULL,
                FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE,
                UNIQUE(connection_id, stream_id, list_name)
            );

            -- Index for favorites queries
            CREATE INDEX IF NOT EXISTS idx_favorites_connection ON favorites(connection_id);
            CREATE INDEX IF NOT EXISTS idx_favorites_position ON favorites(connection_id, position);

            -- Watch history table
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                connection_id TEXT NOT NULL,
                stream_id INTEGER NOT NULL,
                stream_type TEXT NOT NULL,
                stream_name TEXT NOT NULL,
                watched_at INTEGER NOT NULL,
                duration INTEGER,
                position INTEGER,
                FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
            );

            -- Index for history queries
            CREATE INDEX IF NOT EXISTS idx_history_connection ON history(connection_id);
            CREATE INDEX IF NOT EXISTS idx_history_watched_at ON history(watched_at DESC);
            CREATE INDEX IF NOT EXISTS idx_history_stream ON history(connection_id, stream_id);

            -- EPG cache table
            CREATE TABLE IF NOT EXISTS epg_cache (
                id TEXT PRIMARY KEY,
                stream_id INTEGER NOT NULL,
                channel_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                cached_at INTEGER NOT NULL
            );

            -- Index for EPG queries
            CREATE INDEX IF NOT EXISTS idx_epg_stream ON epg_cache(stream_id);
            CREATE INDEX IF NOT EXISTS idx_epg_time ON epg_cache(start_time, end_time);
            CREATE INDEX IF NOT EXISTS idx_epg_cached ON epg_cache(cached_at);

            -- Response cache table for API responses
            CREATE TABLE IF NOT EXISTS response_cache (
                key TEXT PRIMARY KEY,
                value BLOB NOT NULL,
                expires_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            );

            -- Index for cache expiration
            CREATE INDEX IF NOT EXISTS idx_cache_expires ON response_cache(expires_at);

            -- Settings table for user preferences
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            -- Schema version for migrations
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY
            );

            -- Initialize schema version if not exists
            INSERT OR IGNORE INTO schema_version (version) VALUES (1);
            "#,
        )?;

        Ok(())
    }

    /// Execute a SQL statement that doesn't return rows
    ///
    /// # Arguments
    /// * `sql` - The SQL statement to execute
    /// * `params` - Parameters to bind to the statement
    ///
    /// # Returns
    /// * Number of rows affected
    pub fn execute<P>(&self, sql: &str, params: P) -> Result<usize, DatabaseError>
    where
        P: rusqlite::Params,
    {
        let conn = self.connection.lock();
        let rows = conn.execute(sql, params)?;
        Ok(rows)
    }

    /// Execute an INSERT statement and return the last inserted row ID
    ///
    /// # Arguments
    /// * `sql` - The SQL INSERT statement
    /// * `params` - Parameters to bind to the statement
    ///
    /// # Returns
    /// * The ID of the inserted row
    pub fn insert<P>(&self, sql: &str, params: P) -> Result<i64, DatabaseError>
    where
        P: rusqlite::Params,
    {
        let conn = self.connection.lock();
        conn.execute(sql, params)?;
        Ok(conn.last_insert_rowid())
    }

    /// Query for multiple rows
    ///
    /// # Arguments
    /// * `sql` - The SQL SELECT statement
    /// * `params` - Parameters to bind to the statement
    /// * `mapper` - Function to map each row to a result type
    ///
    /// # Returns
    /// * Vector of mapped results
    pub fn query<T, P, F>(&self, sql: &str, params: P, mapper: F) -> Result<Vec<T>, DatabaseError>
    where
        P: rusqlite::Params,
        F: FnMut(&rusqlite::Row<'_>) -> SqliteResult<T>,
    {
        let conn = self.connection.lock();
        let mut stmt = conn.prepare(sql)?;
        let rows = stmt.query_map(params, mapper)?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }

        Ok(results)
    }

    /// Query for a single row
    ///
    /// # Arguments
    /// * `sql` - The SQL SELECT statement
    /// * `params` - Parameters to bind to the statement
    /// * `mapper` - Function to map the row to a result type
    ///
    /// # Returns
    /// * The mapped result or NoResults error
    pub fn query_one<T, P, F>(&self, sql: &str, params: P, mapper: F) -> Result<T, DatabaseError>
    where
        P: rusqlite::Params,
        F: FnOnce(&rusqlite::Row<'_>) -> SqliteResult<T>,
    {
        let conn = self.connection.lock();
        let result = conn.query_row(sql, params, mapper)?;
        Ok(result)
    }

    /// Check if a row exists
    ///
    /// # Arguments
    /// * `sql` - The SQL SELECT statement (should return at least one column)
    /// * `params` - Parameters to bind to the statement
    ///
    /// # Returns
    /// * true if at least one row matches
    pub fn exists<P>(&self, sql: &str, params: P) -> Result<bool, DatabaseError>
    where
        P: rusqlite::Params,
    {
        let conn = self.connection.lock();
        let mut stmt = conn.prepare(sql)?;
        let exists = stmt.exists(params)?;
        Ok(exists)
    }

    /// Get a setting value
    ///
    /// # Arguments
    /// * `key` - The setting key
    ///
    /// # Returns
    /// * The setting value or None if not found
    pub fn get_setting(&self, key: &str) -> Result<Option<String>, DatabaseError> {
        let conn = self.connection.lock();
        let result: SqliteResult<String> =
            conn.query_row("SELECT value FROM settings WHERE key = ?1", params![key], |row| {
                row.get(0)
            });

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(DatabaseError::SqliteError(e)),
        }
    }

    /// Set a setting value
    ///
    /// # Arguments
    /// * `key` - The setting key
    /// * `value` - The setting value
    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), DatabaseError> {
        let conn = self.connection.lock();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
    }

    /// Clean up expired cache entries
    pub fn cleanup_cache(&self) -> Result<usize, DatabaseError> {
        let now = chrono::Utc::now().timestamp();
        let conn = self.connection.lock();
        let rows = conn.execute(
            "DELETE FROM response_cache WHERE expires_at < ?1",
            params![now],
        )?;
        Ok(rows)
    }

    /// Clean up old EPG data
    ///
    /// # Arguments
    /// * `max_age_hours` - Remove EPG entries older than this many hours
    pub fn cleanup_epg(&self, max_age_hours: i64) -> Result<usize, DatabaseError> {
        let cutoff = chrono::Utc::now().timestamp() - (max_age_hours * 3600);
        let conn = self.connection.lock();
        let rows = conn.execute("DELETE FROM epg_cache WHERE end_time < ?1", params![cutoff])?;
        Ok(rows)
    }

    /// Vacuum the database to reclaim space
    pub fn vacuum(&self) -> Result<(), DatabaseError> {
        let conn = self.connection.lock();
        conn.execute_batch("VACUUM;")?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use tempfile::tempdir;

    fn create_test_db() -> (Database, tempfile::TempDir) {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::new(&db_path).unwrap();
        (db, dir)
    }

    #[test]
    fn test_database_creation() {
        let (db, _dir) = create_test_db();

        // Verify tables exist
        let tables: Vec<String> = db
            .query(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert!(tables.contains(&"connections".to_string()));
        assert!(tables.contains(&"favorites".to_string()));
        assert!(tables.contains(&"history".to_string()));
        assert!(tables.contains(&"settings".to_string()));
    }

    #[test]
    fn test_settings() {
        let (db, _dir) = create_test_db();

        // Set a setting
        db.set_setting("test_key", "test_value").unwrap();

        // Get the setting
        let value = db.get_setting("test_key").unwrap();
        assert_eq!(value, Some("test_value".to_string()));

        // Get non-existent setting
        let missing = db.get_setting("nonexistent").unwrap();
        assert_eq!(missing, None);

        // Update setting
        db.set_setting("test_key", "new_value").unwrap();
        let updated = db.get_setting("test_key").unwrap();
        assert_eq!(updated, Some("new_value".to_string()));
    }
}

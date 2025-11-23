//! Storage commands for managing connections, favorites, and watch history
//!
//! These commands interact with the SQLite database to persist user data.

use super::CommandError;
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

// ============================================================================
// Data Types
// ============================================================================

/// A saved connection profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedConnection {
    pub id: String,
    pub name: String,
    pub server_url: String,
    pub username: String,
    pub password: String,
    pub last_used: Option<i64>,
    pub is_active: bool,
}

/// Input for saving a new connection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionInput {
    pub id: Option<String>,
    pub name: String,
    pub server_url: String,
    pub username: String,
    pub password: String,
}

/// A favorited stream
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Favorite {
    pub id: i64,
    pub connection_id: String,
    pub stream_id: i64,
    pub stream_type: String,
    pub list_name: String,
    pub position: i32,
    pub added_at: i64,
}

/// A watch history entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: i64,
    pub connection_id: String,
    pub stream_id: i64,
    pub stream_type: String,
    pub stream_name: String,
    pub watched_at: i64,
    pub duration: Option<i64>,
    pub position: Option<i64>,
}

// ============================================================================
// Connection Commands
// ============================================================================

/// Save a connection profile to the database
///
/// # Arguments
/// * `connection` - The connection details to save
///
/// # Returns
/// * The saved connection with generated ID
#[tauri::command]
pub async fn save_connection(
    state: State<'_, AppState>,
    connection: ConnectionInput,
) -> Result<SavedConnection, CommandError> {
    let id = connection
        .id
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    let now = chrono::Utc::now().timestamp();

    state
        .db
        .execute(
            "INSERT INTO connections (id, name, server_url, username, password, last_used, is_active)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0)
             ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                server_url = excluded.server_url,
                username = excluded.username,
                password = excluded.password,
                last_used = excluded.last_used",
            rusqlite::params![
                &id,
                &connection.name,
                &connection.server_url,
                &connection.username,
                &connection.password,
                now
            ],
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    Ok(SavedConnection {
        id,
        name: connection.name,
        server_url: connection.server_url,
        username: connection.username,
        password: connection.password,
        last_used: Some(now),
        is_active: false,
    })
}

/// Get all saved connections
///
/// # Returns
/// * Vector of all saved connection profiles
#[tauri::command]
pub async fn get_connections(
    state: State<'_, AppState>,
) -> Result<Vec<SavedConnection>, CommandError> {
    let connections = state
        .db
        .query(
            "SELECT id, name, server_url, username, password, last_used, is_active
             FROM connections
             ORDER BY last_used DESC",
            [],
            |row| {
                Ok(SavedConnection {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    server_url: row.get(2)?,
                    username: row.get(3)?,
                    password: row.get(4)?,
                    last_used: row.get(5)?,
                    is_active: row.get::<_, i32>(6)? == 1,
                })
            },
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    Ok(connections)
}

/// Delete a connection profile
///
/// # Arguments
/// * `id` - The ID of the connection to delete
#[tauri::command]
pub async fn delete_connection(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), CommandError> {
    // Delete associated favorites and history first
    state
        .db
        .execute(
            "DELETE FROM favorites WHERE connection_id = ?1",
            rusqlite::params![&id],
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    state
        .db
        .execute(
            "DELETE FROM history WHERE connection_id = ?1",
            rusqlite::params![&id],
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    // Delete the connection
    let rows_affected = state
        .db
        .execute(
            "DELETE FROM connections WHERE id = ?1",
            rusqlite::params![&id],
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    if rows_affected == 0 {
        return Err(CommandError::NotFound(format!(
            "Connection with id '{}' not found",
            id
        )));
    }

    Ok(())
}

// ============================================================================
// Favorites Commands
// ============================================================================

/// Add a stream to favorites
///
/// # Arguments
/// * `connection_id` - The connection ID this favorite belongs to
/// * `stream_id` - The stream ID to favorite
/// * `stream_type` - The type of stream ('live', 'vod', 'series')
///
/// # Returns
/// * The created favorite entry
#[tauri::command]
pub async fn add_favorite(
    state: State<'_, AppState>,
    connection_id: String,
    stream_id: i64,
    stream_type: String,
) -> Result<Favorite, CommandError> {
    // Validate stream type
    if !["live", "vod", "series"].contains(&stream_type.as_str()) {
        return Err(CommandError::InvalidInput(format!(
            "Invalid stream type: {}. Must be 'live', 'vod', or 'series'",
            stream_type
        )));
    }

    let now = chrono::Utc::now().timestamp();

    // Get the next position for this connection's favorites
    let position: i32 = state
        .db
        .query_one(
            "SELECT COALESCE(MAX(position), 0) + 1 FROM favorites WHERE connection_id = ?1",
            rusqlite::params![&connection_id],
            |row| row.get(0),
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    state
        .db
        .execute(
            "INSERT INTO favorites (connection_id, stream_id, stream_type, list_name, position, added_at)
             VALUES (?1, ?2, ?3, 'default', ?4, ?5)
             ON CONFLICT(connection_id, stream_id, list_name) DO UPDATE SET
                stream_type = excluded.stream_type,
                added_at = excluded.added_at",
            rusqlite::params![&connection_id, stream_id, &stream_type, position, now],
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    // Get the inserted/updated row
    let favorite = state
        .db
        .query_one(
            "SELECT id, connection_id, stream_id, stream_type, list_name, position, added_at
             FROM favorites
             WHERE connection_id = ?1 AND stream_id = ?2 AND list_name = 'default'",
            rusqlite::params![&connection_id, stream_id],
            |row| {
                Ok(Favorite {
                    id: row.get(0)?,
                    connection_id: row.get(1)?,
                    stream_id: row.get(2)?,
                    stream_type: row.get(3)?,
                    list_name: row.get(4)?,
                    position: row.get(5)?,
                    added_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    Ok(favorite)
}

/// Remove a stream from favorites
///
/// # Arguments
/// * `connection_id` - The connection ID
/// * `stream_id` - The stream ID to remove from favorites
#[tauri::command]
pub async fn remove_favorite(
    state: State<'_, AppState>,
    connection_id: String,
    stream_id: i64,
) -> Result<(), CommandError> {
    let rows_affected = state
        .db
        .execute(
            "DELETE FROM favorites WHERE connection_id = ?1 AND stream_id = ?2",
            rusqlite::params![&connection_id, stream_id],
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    if rows_affected == 0 {
        return Err(CommandError::NotFound(format!(
            "Favorite with stream_id '{}' not found for connection '{}'",
            stream_id, connection_id
        )));
    }

    Ok(())
}

/// Get all favorites for a connection
///
/// # Arguments
/// * `connection_id` - The connection ID to get favorites for
///
/// # Returns
/// * Vector of favorite entries
#[tauri::command]
pub async fn get_favorites(
    state: State<'_, AppState>,
    connection_id: String,
) -> Result<Vec<Favorite>, CommandError> {
    let favorites = state
        .db
        .query(
            "SELECT id, connection_id, stream_id, stream_type, list_name, position, added_at
             FROM favorites
             WHERE connection_id = ?1
             ORDER BY position ASC",
            rusqlite::params![&connection_id],
            |row| {
                Ok(Favorite {
                    id: row.get(0)?,
                    connection_id: row.get(1)?,
                    stream_id: row.get(2)?,
                    stream_type: row.get(3)?,
                    list_name: row.get(4)?,
                    position: row.get(5)?,
                    added_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    Ok(favorites)
}

// ============================================================================
// History Commands
// ============================================================================

/// Add an entry to watch history
///
/// # Arguments
/// * `connection_id` - The connection ID
/// * `stream_id` - The stream ID that was watched
/// * `stream_name` - The name of the stream for display
/// * `stream_type` - The type of stream ('live', 'vod', 'series')
///
/// # Returns
/// * The created history entry
#[tauri::command]
pub async fn add_to_history(
    state: State<'_, AppState>,
    connection_id: String,
    stream_id: i64,
    stream_name: String,
    stream_type: String,
) -> Result<HistoryEntry, CommandError> {
    // Validate stream type
    if !["live", "vod", "series"].contains(&stream_type.as_str()) {
        return Err(CommandError::InvalidInput(format!(
            "Invalid stream type: {}. Must be 'live', 'vod', or 'series'",
            stream_type
        )));
    }

    let now = chrono::Utc::now().timestamp();

    // Check if this stream is already in recent history
    let existing: Option<i64> = state
        .db
        .query_one(
            "SELECT id FROM history
             WHERE connection_id = ?1 AND stream_id = ?2
             ORDER BY watched_at DESC
             LIMIT 1",
            rusqlite::params![&connection_id, stream_id],
            |row| row.get(0),
        )
        .ok();

    let entry_id: i64;

    if let Some(id) = existing {
        // Update the existing entry's timestamp
        state
            .db
            .execute(
                "UPDATE history SET watched_at = ?1, stream_name = ?2 WHERE id = ?3",
                rusqlite::params![now, &stream_name, id],
            )
            .map_err(|e| CommandError::DatabaseError(e.to_string()))?;
        entry_id = id;
    } else {
        // Insert new entry
        entry_id = state
            .db
            .insert(
                "INSERT INTO history (connection_id, stream_id, stream_type, stream_name, watched_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                rusqlite::params![&connection_id, stream_id, &stream_type, &stream_name, now],
            )
            .map_err(|e| CommandError::DatabaseError(e.to_string()))?;
    }

    // Clean up old history entries (keep last 100)
    state
        .db
        .execute(
            "DELETE FROM history
             WHERE connection_id = ?1
             AND id NOT IN (
                 SELECT id FROM history
                 WHERE connection_id = ?1
                 ORDER BY watched_at DESC
                 LIMIT 100
             )",
            rusqlite::params![&connection_id],
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    Ok(HistoryEntry {
        id: entry_id,
        connection_id,
        stream_id,
        stream_type,
        stream_name,
        watched_at: now,
        duration: None,
        position: None,
    })
}

/// Get watch history for a connection
///
/// # Arguments
/// * `connection_id` - The connection ID to get history for
/// * `limit` - Maximum number of entries to return
///
/// # Returns
/// * Vector of history entries, most recent first
#[tauri::command]
pub async fn get_history(
    state: State<'_, AppState>,
    connection_id: String,
    limit: Option<i32>,
) -> Result<Vec<HistoryEntry>, CommandError> {
    let limit = limit.unwrap_or(50).min(100);

    let history = state
        .db
        .query(
            "SELECT id, connection_id, stream_id, stream_type, stream_name, watched_at, duration, position
             FROM history
             WHERE connection_id = ?1
             ORDER BY watched_at DESC
             LIMIT ?2",
            rusqlite::params![&connection_id, limit],
            |row| {
                Ok(HistoryEntry {
                    id: row.get(0)?,
                    connection_id: row.get(1)?,
                    stream_id: row.get(2)?,
                    stream_type: row.get(3)?,
                    stream_name: row.get(4)?,
                    watched_at: row.get(5)?,
                    duration: row.get(6)?,
                    position: row.get(7)?,
                })
            },
        )
        .map_err(|e| CommandError::DatabaseError(e.to_string()))?;

    Ok(history)
}

//! Command modules for Tauri IPC
//!
//! This module contains all the Tauri commands that can be invoked from the frontend.

pub mod epg;
pub mod storage;
pub mod xtream;

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Common error type for all commands
#[derive(Error, Debug)]
pub enum CommandError {
    #[error("HTTP request failed: {0}")]
    HttpError(String),

    #[error("Failed to parse response: {0}")]
    ParseError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Authentication failed: {0}")]
    AuthError(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Resource not found: {0}")]
    NotFound(String),
}

impl Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// Xtream connection credentials
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct XtreamConnection {
    pub server_url: String,
    pub username: String,
    pub password: String,
}

impl XtreamConnection {
    /// Construct the base API URL
    pub fn api_url(&self) -> String {
        format!(
            "{}/player_api.php?username={}&password={}",
            self.server_url.trim_end_matches('/'),
            self.username,
            self.password
        )
    }

    /// Construct a live stream URL
    pub fn live_stream_url(&self, stream_id: i64, extension: &str) -> String {
        format!(
            "{}/live/{}/{}/{}.{}",
            self.server_url.trim_end_matches('/'),
            self.username,
            self.password,
            stream_id,
            extension
        )
    }

    /// Construct a VOD stream URL
    pub fn vod_stream_url(&self, stream_id: i64, extension: &str) -> String {
        format!(
            "{}/movie/{}/{}/{}.{}",
            self.server_url.trim_end_matches('/'),
            self.username,
            self.password,
            stream_id,
            extension
        )
    }

    /// Construct a series stream URL
    pub fn series_stream_url(&self, stream_id: i64, extension: &str) -> String {
        format!(
            "{}/series/{}/{}/{}.{}",
            self.server_url.trim_end_matches('/'),
            self.username,
            self.password,
            stream_id,
            extension
        )
    }
}

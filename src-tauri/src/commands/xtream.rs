//! Xtream API commands for interacting with IPTV providers
//!
//! These commands handle authentication and fetching of live TV, VOD, and series content.

use super::{CommandError, XtreamConnection};
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

// ============================================================================
// Response Types
// ============================================================================

/// User information from authentication response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub username: String,
    pub password: String,
    pub message: Option<String>,
    pub auth: Option<i32>,
    pub status: String,
    pub exp_date: Option<String>,
    pub is_trial: Option<String>,
    pub active_cons: Option<String>,
    pub created_at: Option<String>,
    pub max_connections: Option<String>,
    pub allowed_output_formats: Option<Vec<String>>,
}

/// Server information from authentication response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerInfo {
    pub url: Option<String>,
    pub port: Option<String>,
    pub https_port: Option<String>,
    pub server_protocol: Option<String>,
    pub rtmp_port: Option<String>,
    pub timezone: Option<String>,
    pub timestamp_now: Option<i64>,
    pub time_now: Option<String>,
}

/// Full authentication response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    pub user_info: UserInfo,
    pub server_info: ServerInfo,
}

/// Category for live TV, VOD, or series
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub category_id: String,
    pub category_name: String,
    pub parent_id: Option<i32>,
}

/// Live TV stream information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveStream {
    pub num: Option<i32>,
    pub name: String,
    pub stream_type: Option<String>,
    pub stream_id: i64,
    pub stream_icon: Option<String>,
    pub epg_channel_id: Option<String>,
    pub added: Option<String>,
    pub category_id: Option<String>,
    pub custom_sid: Option<String>,
    pub tv_archive: Option<i32>,
    pub direct_source: Option<String>,
    pub tv_archive_duration: Option<i32>,
}

/// VOD (Video on Demand) stream information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VodStream {
    pub num: Option<i32>,
    pub name: String,
    pub stream_type: Option<String>,
    pub stream_id: i64,
    pub stream_icon: Option<String>,
    pub rating: Option<String>,
    pub rating_5based: Option<f64>,
    pub added: Option<String>,
    pub category_id: Option<String>,
    pub container_extension: Option<String>,
    pub custom_sid: Option<String>,
    pub direct_source: Option<String>,
}

/// Series information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Series {
    pub num: Option<i32>,
    pub name: String,
    pub series_id: i64,
    pub cover: Option<String>,
    pub plot: Option<String>,
    pub cast: Option<String>,
    pub director: Option<String>,
    pub genre: Option<String>,
    pub release_date: Option<String>,
    pub last_modified: Option<String>,
    pub rating: Option<String>,
    pub rating_5based: Option<f64>,
    pub backdrop_path: Option<Vec<String>>,
    pub youtube_trailer: Option<String>,
    pub episode_run_time: Option<String>,
    pub category_id: Option<String>,
}

/// Episode information within a series
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Episode {
    pub id: Option<String>,
    pub episode_num: Option<i32>,
    pub title: Option<String>,
    pub container_extension: Option<String>,
    pub info: Option<EpisodeInfo>,
    pub custom_sid: Option<String>,
    pub added: Option<String>,
    pub season: Option<i32>,
    pub direct_source: Option<String>,
}

/// Additional episode metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpisodeInfo {
    pub movie_image: Option<String>,
    pub plot: Option<String>,
    pub releasedate: Option<String>,
    pub rating: Option<f64>,
    pub duration_secs: Option<i32>,
    pub duration: Option<String>,
    pub video: Option<serde_json::Value>,
    pub audio: Option<serde_json::Value>,
    pub bitrate: Option<i32>,
}

/// Season information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Season {
    pub season_number: i32,
    pub name: Option<String>,
    pub episode_count: Option<i32>,
    pub cover: Option<String>,
    pub cover_big: Option<String>,
}

/// Full series information including episodes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeriesInfo {
    pub seasons: Option<Vec<Season>>,
    pub info: Option<SeriesDetails>,
    pub episodes: Option<std::collections::HashMap<String, Vec<Episode>>>,
}

/// Detailed series metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeriesDetails {
    pub name: Option<String>,
    pub cover: Option<String>,
    pub plot: Option<String>,
    pub cast: Option<String>,
    pub director: Option<String>,
    pub genre: Option<String>,
    pub release_date: Option<String>,
    pub last_modified: Option<String>,
    pub rating: Option<String>,
    pub rating_5based: Option<f64>,
    pub backdrop_path: Option<Vec<String>>,
    pub youtube_trailer: Option<String>,
    pub episode_run_time: Option<String>,
    pub category_id: Option<String>,
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Authenticate with an Xtream server and get server/user information
///
/// # Arguments
/// * `server_url` - The base URL of the Xtream server
/// * `username` - The username for authentication
/// * `password` - The password for authentication
///
/// # Returns
/// * `AuthResponse` containing user and server information
#[tauri::command]
pub async fn authenticate(
    state: State<'_, AppState>,
    server_url: String,
    username: String,
    password: String,
) -> Result<AuthResponse, CommandError> {
    let connection = XtreamConnection {
        server_url: server_url.clone(),
        username: username.clone(),
        password: password.clone(),
    };

    let url = connection.api_url();

    let response = state
        .http_client
        .get(&url)
        .await
        .map_err(|e| CommandError::HttpError(e.to_string()))?;

    // Check if authentication failed
    let auth_response: AuthResponse = serde_json::from_str(&response).map_err(|e| {
        // Try to parse as error response
        if response.contains("\"user_info\"") && response.contains("\"auth\":0") {
            CommandError::AuthError("Invalid credentials".to_string())
        } else {
            CommandError::ParseError(format!("Failed to parse auth response: {}", e))
        }
    })?;

    // Verify authentication was successful
    if auth_response.user_info.auth == Some(0) {
        return Err(CommandError::AuthError("Authentication failed".to_string()));
    }

    if auth_response.user_info.status != "Active" {
        return Err(CommandError::AuthError(format!(
            "Account is not active: {}",
            auth_response.user_info.status
        )));
    }

    Ok(auth_response)
}

/// Get all live TV categories
///
/// # Arguments
/// * `connection` - The Xtream connection credentials
///
/// # Returns
/// * Vector of `Category` objects
#[tauri::command]
pub async fn get_live_categories(
    state: State<'_, AppState>,
    connection: XtreamConnection,
) -> Result<Vec<Category>, CommandError> {
    let url = format!("{}&action=get_live_categories", connection.api_url());

    let response = state
        .http_client
        .get(&url)
        .await
        .map_err(|e| CommandError::HttpError(e.to_string()))?;

    let categories: Vec<Category> = serde_json::from_str(&response)
        .map_err(|e| CommandError::ParseError(format!("Failed to parse categories: {}", e)))?;

    Ok(categories)
}

/// Get live TV streams, optionally filtered by category
///
/// # Arguments
/// * `connection` - The Xtream connection credentials
/// * `category_id` - Optional category ID to filter streams
///
/// # Returns
/// * Vector of `LiveStream` objects
#[tauri::command]
pub async fn get_live_streams(
    state: State<'_, AppState>,
    connection: XtreamConnection,
    category_id: Option<String>,
) -> Result<Vec<LiveStream>, CommandError> {
    let mut url = format!("{}&action=get_live_streams", connection.api_url());

    if let Some(cat_id) = category_id {
        url.push_str(&format!("&category_id={}", cat_id));
    }

    let response = state
        .http_client
        .get(&url)
        .await
        .map_err(|e| CommandError::HttpError(e.to_string()))?;

    let streams: Vec<LiveStream> = serde_json::from_str(&response)
        .map_err(|e| CommandError::ParseError(format!("Failed to parse live streams: {}", e)))?;

    Ok(streams)
}

/// Get all VOD categories
///
/// # Arguments
/// * `connection` - The Xtream connection credentials
///
/// # Returns
/// * Vector of `Category` objects
#[tauri::command]
pub async fn get_vod_categories(
    state: State<'_, AppState>,
    connection: XtreamConnection,
) -> Result<Vec<Category>, CommandError> {
    let url = format!("{}&action=get_vod_categories", connection.api_url());

    let response = state
        .http_client
        .get(&url)
        .await
        .map_err(|e| CommandError::HttpError(e.to_string()))?;

    let categories: Vec<Category> = serde_json::from_str(&response)
        .map_err(|e| CommandError::ParseError(format!("Failed to parse VOD categories: {}", e)))?;

    Ok(categories)
}

/// Get VOD streams, optionally filtered by category
///
/// # Arguments
/// * `connection` - The Xtream connection credentials
/// * `category_id` - Optional category ID to filter streams
///
/// # Returns
/// * Vector of `VodStream` objects
#[tauri::command]
pub async fn get_vod_streams(
    state: State<'_, AppState>,
    connection: XtreamConnection,
    category_id: Option<String>,
) -> Result<Vec<VodStream>, CommandError> {
    let mut url = format!("{}&action=get_vod_streams", connection.api_url());

    if let Some(cat_id) = category_id {
        url.push_str(&format!("&category_id={}", cat_id));
    }

    let response = state
        .http_client
        .get(&url)
        .await
        .map_err(|e| CommandError::HttpError(e.to_string()))?;

    let streams: Vec<VodStream> = serde_json::from_str(&response)
        .map_err(|e| CommandError::ParseError(format!("Failed to parse VOD streams: {}", e)))?;

    Ok(streams)
}

/// Get all series categories
///
/// # Arguments
/// * `connection` - The Xtream connection credentials
///
/// # Returns
/// * Vector of `Category` objects
#[tauri::command]
pub async fn get_series_categories(
    state: State<'_, AppState>,
    connection: XtreamConnection,
) -> Result<Vec<Category>, CommandError> {
    let url = format!("{}&action=get_series_categories", connection.api_url());

    let response = state
        .http_client
        .get(&url)
        .await
        .map_err(|e| CommandError::HttpError(e.to_string()))?;

    let categories: Vec<Category> = serde_json::from_str(&response).map_err(|e| {
        CommandError::ParseError(format!("Failed to parse series categories: {}", e))
    })?;

    Ok(categories)
}

/// Get series list, optionally filtered by category
///
/// # Arguments
/// * `connection` - The Xtream connection credentials
/// * `category_id` - Optional category ID to filter series
///
/// # Returns
/// * Vector of `Series` objects
#[tauri::command]
pub async fn get_series(
    state: State<'_, AppState>,
    connection: XtreamConnection,
    category_id: Option<String>,
) -> Result<Vec<Series>, CommandError> {
    let mut url = format!("{}&action=get_series", connection.api_url());

    if let Some(cat_id) = category_id {
        url.push_str(&format!("&category_id={}", cat_id));
    }

    let response = state
        .http_client
        .get(&url)
        .await
        .map_err(|e| CommandError::HttpError(e.to_string()))?;

    let series: Vec<Series> = serde_json::from_str(&response)
        .map_err(|e| CommandError::ParseError(format!("Failed to parse series: {}", e)))?;

    Ok(series)
}

/// Get detailed series information including all episodes
///
/// # Arguments
/// * `connection` - The Xtream connection credentials
/// * `series_id` - The ID of the series to fetch
///
/// # Returns
/// * `SeriesInfo` containing seasons and episodes
#[tauri::command]
pub async fn get_series_info(
    state: State<'_, AppState>,
    connection: XtreamConnection,
    series_id: i64,
) -> Result<SeriesInfo, CommandError> {
    let url = format!(
        "{}&action=get_series_info&series_id={}",
        connection.api_url(),
        series_id
    );

    let response = state
        .http_client
        .get(&url)
        .await
        .map_err(|e| CommandError::HttpError(e.to_string()))?;

    let series_info: SeriesInfo = serde_json::from_str(&response)
        .map_err(|e| CommandError::ParseError(format!("Failed to parse series info: {}", e)))?;

    Ok(series_info)
}

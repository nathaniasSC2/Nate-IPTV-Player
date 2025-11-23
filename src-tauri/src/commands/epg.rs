//! EPG (Electronic Program Guide) commands
//!
//! These commands handle fetching and processing EPG data for live TV streams.

use super::{CommandError, XtreamConnection};
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

// ============================================================================
// Response Types
// ============================================================================

/// A single EPG program entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpgProgram {
    pub id: Option<String>,
    pub epg_id: Option<String>,
    pub title: String,
    pub lang: Option<String>,
    pub start: String,
    pub end: String,
    pub description: Option<String>,
    pub channel_id: Option<String>,
    pub start_timestamp: Option<i64>,
    pub stop_timestamp: Option<i64>,
    pub now_playing: Option<i32>,
    pub has_archive: Option<i32>,
}

/// Container for EPG listings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpgListings {
    pub epg_listings: Vec<EpgProgram>,
}

/// Short EPG response wrapper (may be object or empty array)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ShortEpgResponse {
    /// Response with EPG data
    Data(EpgListings),
    /// Empty response (no EPG data available)
    Empty(Vec<serde_json::Value>),
}

/// EPG data for a single stream
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamEpg {
    pub stream_id: i64,
    pub programs: Vec<EpgProgram>,
    pub current_program: Option<EpgProgram>,
    pub next_program: Option<EpgProgram>,
}

/// Batch EPG response for multiple streams
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchEpgResponse {
    pub streams: Vec<StreamEpg>,
    pub errors: Vec<StreamEpgError>,
}

/// Error when fetching EPG for a specific stream
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamEpgError {
    pub stream_id: i64,
    pub error: String,
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Find the current and next programs from a list of EPG programs
fn find_current_and_next(programs: &[EpgProgram]) -> (Option<EpgProgram>, Option<EpgProgram>) {
    let now = chrono::Utc::now().timestamp();

    let mut current: Option<&EpgProgram> = None;
    let mut next: Option<&EpgProgram> = None;

    for program in programs {
        if let (Some(start), Some(stop)) = (program.start_timestamp, program.stop_timestamp) {
            if start <= now && stop > now {
                current = Some(program);
            } else if start > now {
                if next.is_none()
                    || program.start_timestamp < next.and_then(|p| p.start_timestamp)
                {
                    next = Some(program);
                }
            }
        }
    }

    (current.cloned(), next.cloned())
}

/// Parse timestamp from various formats
fn parse_epg_timestamp(timestamp_str: &str) -> Option<i64> {
    // Try parsing as Unix timestamp first
    if let Ok(ts) = timestamp_str.parse::<i64>() {
        return Some(ts);
    }

    // Try parsing as ISO 8601 / RFC 3339
    if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(timestamp_str) {
        return Some(dt.timestamp());
    }

    // Try parsing as common EPG format: "2024-01-15 14:30:00"
    if let Ok(dt) = chrono::NaiveDateTime::parse_from_str(timestamp_str, "%Y-%m-%d %H:%M:%S") {
        return Some(dt.and_utc().timestamp());
    }

    None
}

/// Enrich EPG programs with computed timestamps if missing
fn enrich_epg_programs(programs: &mut [EpgProgram]) {
    for program in programs.iter_mut() {
        // Try to parse start timestamp if not present
        if program.start_timestamp.is_none() {
            program.start_timestamp = parse_epg_timestamp(&program.start);
        }

        // Try to parse stop timestamp if not present
        if program.stop_timestamp.is_none() {
            program.stop_timestamp = parse_epg_timestamp(&program.end);
        }
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Get short EPG (current and upcoming programs) for a single stream
///
/// # Arguments
/// * `connection` - The Xtream connection credentials
/// * `stream_id` - The stream ID to get EPG for
///
/// # Returns
/// * `StreamEpg` containing current, next, and upcoming programs
#[tauri::command]
pub async fn get_short_epg(
    state: State<'_, AppState>,
    connection: XtreamConnection,
    stream_id: i64,
) -> Result<StreamEpg, CommandError> {
    let url = format!(
        "{}&action=get_short_epg&stream_id={}&limit=10",
        connection.api_url(),
        stream_id
    );

    let response = state
        .http_client
        .get(&url)
        .await
        .map_err(|e| CommandError::HttpError(e.to_string()))?;

    // Parse the response
    let epg_response: ShortEpgResponse = serde_json::from_str(&response).map_err(|e| {
        CommandError::ParseError(format!("Failed to parse EPG response: {}", e))
    })?;

    let mut programs = match epg_response {
        ShortEpgResponse::Data(data) => data.epg_listings,
        ShortEpgResponse::Empty(_) => Vec::new(),
    };

    // Enrich programs with timestamps
    enrich_epg_programs(&mut programs);

    // Find current and next programs
    let (current_program, next_program) = find_current_and_next(&programs);

    Ok(StreamEpg {
        stream_id,
        programs,
        current_program,
        next_program,
    })
}

/// Get EPG data for multiple streams in a single batch request
///
/// This is more efficient than calling get_short_epg multiple times
/// as it parallelizes the requests.
///
/// # Arguments
/// * `connection` - The Xtream connection credentials
/// * `stream_ids` - Vector of stream IDs to get EPG for
///
/// # Returns
/// * `BatchEpgResponse` containing EPG data for all streams and any errors
#[tauri::command]
pub async fn get_epg_for_streams(
    state: State<'_, AppState>,
    connection: XtreamConnection,
    stream_ids: Vec<i64>,
) -> Result<BatchEpgResponse, CommandError> {
    use futures::future::join_all;

    // Limit batch size to prevent overwhelming the server
    let max_batch_size = 50;
    let stream_ids: Vec<i64> = stream_ids.into_iter().take(max_batch_size).collect();

    // Create futures for all EPG requests
    let futures: Vec<_> = stream_ids
        .iter()
        .map(|&stream_id| {
            let url = format!(
                "{}&action=get_short_epg&stream_id={}&limit=5",
                connection.api_url(),
                stream_id
            );
            let http_client = state.http_client.clone();

            async move {
                let result = http_client.get(&url).await;
                (stream_id, result)
            }
        })
        .collect();

    // Execute all requests in parallel
    let results = join_all(futures).await;

    let mut streams: Vec<StreamEpg> = Vec::new();
    let mut errors: Vec<StreamEpgError> = Vec::new();

    for (stream_id, result) in results {
        match result {
            Ok(response) => {
                // Try to parse the response
                match serde_json::from_str::<ShortEpgResponse>(&response) {
                    Ok(epg_response) => {
                        let mut programs = match epg_response {
                            ShortEpgResponse::Data(data) => data.epg_listings,
                            ShortEpgResponse::Empty(_) => Vec::new(),
                        };

                        // Enrich programs with timestamps
                        enrich_epg_programs(&mut programs);

                        // Find current and next programs
                        let (current_program, next_program) = find_current_and_next(&programs);

                        streams.push(StreamEpg {
                            stream_id,
                            programs,
                            current_program,
                            next_program,
                        });
                    }
                    Err(e) => {
                        errors.push(StreamEpgError {
                            stream_id,
                            error: format!("Failed to parse EPG: {}", e),
                        });
                    }
                }
            }
            Err(e) => {
                errors.push(StreamEpgError {
                    stream_id,
                    error: format!("HTTP error: {}", e),
                });
            }
        }
    }

    Ok(BatchEpgResponse { streams, errors })
}

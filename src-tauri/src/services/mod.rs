//! Services module for shared business logic
//!
//! This module contains services that are used across multiple commands,
//! such as HTTP client, caching, and EPG parsing.

pub mod http_client;

// Re-export commonly used types
pub use http_client::HttpClient;

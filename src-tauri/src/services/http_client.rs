//! HTTP client wrapper using reqwest
//!
//! Provides a configured HTTP client with appropriate timeouts, headers,
//! and error handling for Xtream API requests.

use reqwest::{Client, StatusCode};
use std::time::Duration;
use thiserror::Error;

/// HTTP client errors
#[derive(Error, Debug)]
pub enum HttpError {
    #[error("Request failed: {0}")]
    RequestError(#[from] reqwest::Error),

    #[error("Request timeout")]
    Timeout,

    #[error("Server error: {status} - {message}")]
    ServerError { status: u16, message: String },

    #[error("Authentication required")]
    Unauthorized,

    #[error("Resource not found")]
    NotFound,

    #[error("Too many requests - rate limited")]
    RateLimited,

    #[error("Invalid response: {0}")]
    InvalidResponse(String),
}

/// HTTP client configuration
pub struct HttpClientConfig {
    /// Request timeout in seconds
    pub timeout_secs: u64,
    /// Connection timeout in seconds
    pub connect_timeout_secs: u64,
    /// User agent string
    pub user_agent: String,
    /// Maximum redirects to follow
    pub max_redirects: usize,
}

impl Default for HttpClientConfig {
    fn default() -> Self {
        Self {
            timeout_secs: 30,
            connect_timeout_secs: 10,
            user_agent: "NateIPTVPlayer/1.0".to_string(),
            max_redirects: 10,
        }
    }
}

/// HTTP client wrapper with configured defaults
pub struct HttpClient {
    client: Client,
}

impl HttpClient {
    /// Create a new HTTP client with default configuration
    pub fn new() -> Result<Self, HttpError> {
        Self::with_config(HttpClientConfig::default())
    }

    /// Create a new HTTP client with custom configuration
    pub fn with_config(config: HttpClientConfig) -> Result<Self, HttpError> {
        let client = Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs))
            .connect_timeout(Duration::from_secs(config.connect_timeout_secs))
            .user_agent(&config.user_agent)
            .redirect(reqwest::redirect::Policy::limited(config.max_redirects))
            // Use rustls for TLS (more portable)
            .use_rustls_tls()
            // Accept invalid certificates for some IPTV providers
            // Note: This reduces security but is often necessary for IPTV
            .danger_accept_invalid_certs(true)
            // Enable gzip compression
            .gzip(true)
            // Enable connection pooling
            .pool_max_idle_per_host(5)
            .build()?;

        Ok(Self { client })
    }

    /// Perform a GET request and return the response body as a string
    ///
    /// # Arguments
    /// * `url` - The URL to request
    ///
    /// # Returns
    /// * Response body as a string
    pub async fn get(&self, url: &str) -> Result<String, HttpError> {
        let response = self
            .client
            .get(url)
            .header("Accept", "application/json")
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Perform a GET request with custom headers
    ///
    /// # Arguments
    /// * `url` - The URL to request
    /// * `headers` - Additional headers to include
    ///
    /// # Returns
    /// * Response body as a string
    pub async fn get_with_headers(
        &self,
        url: &str,
        headers: Vec<(String, String)>,
    ) -> Result<String, HttpError> {
        let mut request = self.client.get(url);

        for (key, value) in headers {
            request = request.header(&key, &value);
        }

        let response = request.send().await?;
        self.handle_response(response).await
    }

    /// Perform a POST request with JSON body
    ///
    /// # Arguments
    /// * `url` - The URL to request
    /// * `body` - The JSON body to send
    ///
    /// # Returns
    /// * Response body as a string
    pub async fn post_json<T: serde::Serialize>(
        &self,
        url: &str,
        body: &T,
    ) -> Result<String, HttpError> {
        let response = self
            .client
            .post(url)
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
            .json(body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Perform a GET request and return raw bytes
    ///
    /// # Arguments
    /// * `url` - The URL to request
    ///
    /// # Returns
    /// * Response body as bytes
    pub async fn get_bytes(&self, url: &str) -> Result<Vec<u8>, HttpError> {
        let response = self.client.get(url).send().await?;

        let status = response.status();
        if !status.is_success() {
            return Err(self.status_to_error(status, "Request failed").await);
        }

        let bytes = response.bytes().await?;
        Ok(bytes.to_vec())
    }

    /// Handle the HTTP response and convert to result
    async fn handle_response(&self, response: reqwest::Response) -> Result<String, HttpError> {
        let status = response.status();

        if status.is_success() {
            let body = response.text().await?;
            Ok(body)
        } else {
            let message = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            Err(self.status_to_error(status, &message).await)
        }
    }

    /// Convert HTTP status code to appropriate error
    async fn status_to_error(&self, status: StatusCode, message: &str) -> HttpError {
        match status {
            StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => HttpError::Unauthorized,
            StatusCode::NOT_FOUND => HttpError::NotFound,
            StatusCode::TOO_MANY_REQUESTS => HttpError::RateLimited,
            StatusCode::REQUEST_TIMEOUT | StatusCode::GATEWAY_TIMEOUT => HttpError::Timeout,
            _ => HttpError::ServerError {
                status: status.as_u16(),
                message: message.to_string(),
            },
        }
    }

    /// Check if a URL is reachable
    ///
    /// # Arguments
    /// * `url` - The URL to check
    ///
    /// # Returns
    /// * true if the URL responds with a success status
    pub async fn is_reachable(&self, url: &str) -> bool {
        match self.client.head(url).send().await {
            Ok(response) => response.status().is_success(),
            Err(_) => false,
        }
    }

    /// Get the underlying reqwest client for advanced use cases
    pub fn inner(&self) -> &Client {
        &self.client
    }
}

impl Clone for HttpClient {
    fn clone(&self) -> Self {
        Self {
            client: self.client.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = HttpClientConfig::default();
        assert_eq!(config.timeout_secs, 30);
        assert_eq!(config.connect_timeout_secs, 10);
        assert_eq!(config.max_redirects, 10);
    }

    #[test]
    fn test_client_creation() {
        let client = HttpClient::new();
        assert!(client.is_ok());
    }

    #[test]
    fn test_custom_config() {
        let config = HttpClientConfig {
            timeout_secs: 60,
            connect_timeout_secs: 20,
            user_agent: "TestAgent/1.0".to_string(),
            max_redirects: 5,
        };

        let client = HttpClient::with_config(config);
        assert!(client.is_ok());
    }
}

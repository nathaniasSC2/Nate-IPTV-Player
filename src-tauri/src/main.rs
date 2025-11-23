// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod services;

use db::Database;
use std::sync::Arc;
use tauri::Manager;

/// Application state shared across all commands
pub struct AppState {
    pub db: Arc<Database>,
    pub http_client: Arc<services::http_client::HttpClient>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Get the app data directory for SQLite database
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // Create the directory if it doesn't exist
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");

            // Initialize the database
            let db_path = app_data_dir.join("nate-iptv.db");
            let db = Database::new(&db_path).expect("Failed to initialize database");

            // Initialize the HTTP client
            let http_client = services::http_client::HttpClient::new()
                .expect("Failed to initialize HTTP client");

            // Store the app state
            app.manage(AppState {
                db: Arc::new(db),
                http_client: Arc::new(http_client),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Xtream API commands
            commands::xtream::authenticate,
            commands::xtream::get_live_categories,
            commands::xtream::get_live_streams,
            commands::xtream::get_vod_categories,
            commands::xtream::get_vod_streams,
            commands::xtream::get_series_categories,
            commands::xtream::get_series,
            commands::xtream::get_series_info,
            // EPG commands
            commands::epg::get_short_epg,
            commands::epg::get_epg_for_streams,
            // Storage commands
            commands::storage::save_connection,
            commands::storage::get_connections,
            commands::storage::delete_connection,
            commands::storage::add_favorite,
            commands::storage::remove_favorite,
            commands::storage::get_favorites,
            commands::storage::add_to_history,
            commands::storage::get_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

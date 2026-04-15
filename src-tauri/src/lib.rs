mod keystore;

use keystore::KeyStore;

#[tauri::command]
fn store_key(email: &str, key_b64: &str) -> Result<(), String> {
    let ks = KeyStore::new();
    ks.store(email, key_b64)
}

#[tauri::command]
fn retrieve_key(email: &str) -> Result<Option<String>, String> {
    let ks = KeyStore::new();
    ks.retrieve(email)
}

#[tauri::command]
fn remove_key(email: &str) -> Result<(), String> {
    let ks = KeyStore::new();
    ks.remove(email)
}

#[tauri::command]
fn is_keystore_available() -> bool {
    KeyStore::is_available()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            store_key,
            retrieve_key,
            remove_key,
            is_keystore_available,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

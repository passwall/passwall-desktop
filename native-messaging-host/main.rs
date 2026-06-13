//! Passwall Native Messaging Host for Chrome/Firefox Extension
//!
//! Listens on stdin/stdout for JSON messages from the browser extension.
//! Handles requests for keychain operations and secure handshake.

use std::io::{self, Read, Write};
mod keystore;
#[path = "../src-tauri/src/native_ipc.rs"]
mod native_ipc;
#[path = "../src-tauri/src/paired_browsers.rs"]
mod paired_browsers;
use keystore::KeyStore;
use serde::{Deserialize, Serialize};

const MAX_MESSAGE_SIZE: usize = 1024 * 1024;

#[derive(Deserialize)]
struct Request {
    v: u8,
    #[serde(rename = "type")]
    req_type: String,
    id: Option<String>,
    payload: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct Response {
    v: u8,
    #[serde(rename = "type")]
    resp_type: String,
    id: Option<String>,
    payload: Option<serde_json::Value>,
}

fn read_message() -> Option<Request> {
    let mut len_buf = [0u8; 4];
    if io::stdin().read_exact(&mut len_buf).is_err() {
        return None;
    }
    let len = u32::from_le_bytes(len_buf) as usize;
    if len == 0 || len > MAX_MESSAGE_SIZE {
        return None;
    }
    let mut buf = vec![0u8; len];
    if io::stdin().read_exact(&mut buf).is_err() {
        return None;
    }
    serde_json::from_slice(&buf).ok()
}

fn write_message<T: Serialize>(msg: &T) {
    if let Ok(json) = serde_json::to_vec(msg) {
        let len = (json.len() as u32).to_le_bytes();
        let _ = io::stdout().write_all(&len);
        let _ = io::stdout().write_all(&json);
        let _ = io::stdout().flush();
    }
}

fn handle_request(req: Request, caller_origin: Option<&str>) -> Response {
    match req.req_type.as_str() {
        "HANDSHAKE" => {
            let (ok, payload) = native_ipc::handshake(req.id.clone(), &req.payload);
            if ok {
                if let Some(origin) = caller_origin {
                    paired_browsers::add_pairing(origin);
                }
                Response {
                    v: 1,
                    resp_type: "response".to_string(),
                    id: req.id,
                    payload: Some(payload),
                }
            } else {
                Response {
                    v: 1,
                    resp_type: "error".to_string(),
                    id: req.id,
                    payload: Some(payload),
                }
            }
        }
        "PING" => Response {
            v: 1,
            resp_type: "response".to_string(),
            id: req.id,
            payload: Some(serde_json::json!({"status": "ok"})),
        },
        "GET_USER_KEY" => {
            let email = req
                .payload
                .as_ref()
                .and_then(|p| p.get("email"))
                .and_then(|v| v.as_str());
            let ks = KeyStore::new();
            match email {
                Some(email) => match ks.retrieve(&email.trim().to_ascii_lowercase()) {
                    Ok(Some(key)) => {
                        let payload = native_ipc::encrypt_user_key_payload_if_session(&key)
                            .unwrap_or_else(|| serde_json::json!({ "userKey": key }));
                        Response {
                            v: 1,
                            resp_type: "response".to_string(),
                            id: req.id,
                            payload: Some(payload),
                        }
                    }
                    Ok(None) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"userKey": null})),
                    },
                    Err(e) => Response {
                        v: 1,
                        resp_type: "error".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"message": e})),
                    },
                },
                None => Response {
                    v: 1,
                    resp_type: "error".to_string(),
                    id: req.id,
                    payload: Some(serde_json::json!({"message": "Missing email"})),
                },
            }
        }
        "HAS_USER_KEY" => {
            let email = req
                .payload
                .as_ref()
                .and_then(|p| p.get("email"))
                .and_then(|v| v.as_str());
            let ks = KeyStore::new();
            match email {
                Some(email) => match ks.retrieve(&email.trim().to_ascii_lowercase()) {
                    Ok(Some(_)) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"exists": true})),
                    },
                    Ok(None) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"exists": false})),
                    },
                    Err(e) => Response {
                        v: 1,
                        resp_type: "error".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"message": e})),
                    },
                },
                None => Response {
                    v: 1,
                    resp_type: "error".to_string(),
                    id: req.id,
                    payload: Some(serde_json::json!({"message": "Missing email"})),
                },
            }
        }
        "STORE_USER_KEY" => {
            let (email, key_b64) = (
                req.payload
                    .as_ref()
                    .and_then(|p| p.get("email"))
                    .and_then(|v| v.as_str()),
                req.payload
                    .as_ref()
                    .and_then(|p| p.get("userKey"))
                    .and_then(|v| v.as_str()),
            );
            let ks = KeyStore::new();
            match (email, key_b64) {
                (Some(email), Some(key_b64)) => match ks.store(&email.trim().to_ascii_lowercase(), key_b64) {
                    Ok(()) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"status": "ok"})),
                    },
                    Err(e) => Response {
                        v: 1,
                        resp_type: "error".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"message": e})),
                    },
                },
                _ => Response {
                    v: 1,
                    resp_type: "error".to_string(),
                    id: req.id,
                    payload: Some(serde_json::json!({"message": "Missing email or userKey"})),
                },
            }
        }
        "REMOVE_USER_KEY" => {
            let email = req
                .payload
                .as_ref()
                .and_then(|p| p.get("email"))
                .and_then(|v| v.as_str());
            let ks = KeyStore::new();
            match email {
                Some(email) => match ks.remove(&email.trim().to_ascii_lowercase()) {
                    Ok(()) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"status": "ok"})),
                    },
                    Err(e) => Response {
                        v: 1,
                        resp_type: "error".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"message": e})),
                    },
                },
                None => Response {
                    v: 1,
                    resp_type: "error".to_string(),
                    id: req.id,
                    payload: Some(serde_json::json!({"message": "Missing email"})),
                },
            }
        }
        _ => Response {
            v: 1,
            resp_type: "error".to_string(),
            id: req.id,
            payload: Some(serde_json::json!({"message": "Unknown request type"})),
        },
    }
}

use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

fn keychain_watcher(
    watched_email: Arc<Mutex<Option<String>>>,
    stdout_lock: Arc<Mutex<()>>,
) {
    let mut last_has_key: Option<bool> = None;
    let ks = KeyStore::new();

    loop {
        thread::sleep(Duration::from_secs(2));

        let email = {
            let guard = watched_email.lock().unwrap();
            match guard.as_ref() {
                Some(e) => e.clone(),
                None => continue,
            }
        };

        let has_key = matches!(ks.retrieve(&email), Ok(Some(_)));

        if last_has_key == Some(true) && !has_key {
            let event = Response {
                v: 1,
                resp_type: "event".to_string(),
                id: None,
                payload: Some(serde_json::json!({
                    "event": "DESKTOP_LOCKED",
                    "email": email
                })),
            };
            let _lock = stdout_lock.lock().unwrap();
            write_message(&event);
        } else if last_has_key == Some(false) && has_key {
            let event = Response {
                v: 1,
                resp_type: "event".to_string(),
                id: None,
                payload: Some(serde_json::json!({
                    "event": "DESKTOP_UNLOCKED",
                    "email": email
                })),
            };
            let _lock = stdout_lock.lock().unwrap();
            write_message(&event);
        }

        last_has_key = Some(has_key);
    }
}

fn caller_origin_from_argv() -> Option<String> {
    std::env::args().find(|a| {
        a.starts_with("chrome-extension://") && a.ends_with('/') && a.len() > 40
    })
}

fn main() {
    let caller_origin = caller_origin_from_argv();
    let watched_email: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));
    let stdout_lock: Arc<Mutex<()>> = Arc::new(Mutex::new(()));

    {
        let email_clone = Arc::clone(&watched_email);
        let stdout_clone = Arc::clone(&stdout_lock);
        thread::spawn(move || {
            keychain_watcher(email_clone, stdout_clone);
        });
    }

    loop {
        if let Some(req) = read_message() {
            if let Some(email) = req
                .payload
                .as_ref()
                .and_then(|p| p.get("email"))
                .and_then(|v| v.as_str())
            {
                let normalized = email.trim().to_ascii_lowercase();
                let mut guard = watched_email.lock().unwrap();
                if guard.is_none() {
                    *guard = Some(normalized);
                }
            }

            let resp = handle_request(req, caller_origin.as_deref());
            let _lock = stdout_lock.lock().unwrap();
            write_message(&resp);
        } else {
            break;
        }
    }
}

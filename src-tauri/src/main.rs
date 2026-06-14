// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod keystore;
mod host_logger;
mod native_ipc;
mod nm_host_args;
mod paired_browsers;
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    let run_native = args.iter().any(|a| a == "--native-messaging-host")
        || nm_host_args::should_infer_native_messaging_host(&args);

    if run_native {
        native_messaging_host();
    } else {
        passwall_desktop_lib::run();
    }
}

use keystore::KeyStore;
use serde::{Deserialize, Serialize};
use std::io::{self, Read, Write};

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

fn request_log_fields(req: &Request, caller_origin: Option<&str>) -> serde_json::Value {
    let mut fields = serde_json::Map::new();
    fields.insert("protocol_version".into(), serde_json::json!(req.v));
    fields.insert("request_type".into(), serde_json::json!(req.req_type));
    fields.insert("request_id_present".into(), serde_json::json!(req.id.is_some()));
    fields.insert(
        "caller_origin_present".into(),
        serde_json::json!(caller_origin.is_some()),
    );
    if let Some(origin) = caller_origin {
        fields.insert("caller_origin".into(), serde_json::json!(origin));
    }
    let payload = req.payload.as_ref();
    fields.insert("payload_present".into(), serde_json::json!(payload.is_some()));

    match req.req_type.as_str() {
        "HANDSHAKE" => {
            fields.insert(
                "extension_public_key_present".into(),
                serde_json::json!(
                    payload
                        .and_then(|p| p.get("extensionPublicKey"))
                        .and_then(|v| v.as_str())
                        .map(|s| !s.is_empty())
                        .unwrap_or(false)
                ),
            );
        }
        "GET_USER_KEY" | "HAS_USER_KEY" | "REMOVE_USER_KEY" => {
            fields.insert(
                "email_present".into(),
                serde_json::json!(
                    payload
                        .and_then(|p| p.get("email"))
                        .and_then(|v| v.as_str())
                        .map(|s| !s.trim().is_empty())
                        .unwrap_or(false)
                ),
            );
        }
        "STORE_USER_KEY" => {
            fields.insert(
                "email_present".into(),
                serde_json::json!(
                    payload
                        .and_then(|p| p.get("email"))
                        .and_then(|v| v.as_str())
                        .map(|s| !s.trim().is_empty())
                        .unwrap_or(false)
                ),
            );
            fields.insert(
                "user_key_present".into(),
                serde_json::json!(
                    payload
                        .and_then(|p| p.get("userKey"))
                        .and_then(|v| v.as_str())
                        .map(|s| !s.is_empty())
                        .unwrap_or(false)
                ),
            );
        }
        _ => {}
    }

    serde_json::Value::Object(fields)
}

fn response_log_fields(req_type: &str, resp: &Response) -> serde_json::Value {
    let mut fields = serde_json::Map::new();
    fields.insert("request_type".into(), serde_json::json!(req_type));
    fields.insert("response_type".into(), serde_json::json!(resp.resp_type));
    fields.insert("request_id_present".into(), serde_json::json!(resp.id.is_some()));
    fields.insert(
        "payload_present".into(),
        serde_json::json!(resp.payload.is_some()),
    );
    fields.insert(
        "is_error_response".into(),
        serde_json::json!(resp.resp_type == "error"),
    );

    if let Some(payload) = resp.payload.as_ref() {
        fields.insert(
            "error_message_present".into(),
            serde_json::json!(
                payload
                    .get("message")
                    .and_then(|v| v.as_str())
                    .map(|s| !s.is_empty())
                    .unwrap_or(false)
            ),
        );
    }

    match req_type {
        "GET_USER_KEY" => {
            let payload = resp.payload.as_ref();
            fields.insert(
                "user_key_present".into(),
                serde_json::json!(
                    payload
                        .and_then(|p| p.get("userKey"))
                        .map(|v| !v.is_null())
                        .unwrap_or(false)
                ),
            );
            fields.insert(
                "encrypted_payload_present".into(),
                serde_json::json!(
                    payload
                        .and_then(|p| p.get("ciphertext"))
                        .and_then(|v| v.as_str())
                        .map(|s| !s.is_empty())
                        .unwrap_or(false)
                ),
            );
        }
        "HAS_USER_KEY" => {
            let exists = resp
                .payload
                .as_ref()
                .and_then(|p| p.get("exists"))
                .and_then(|v| v.as_bool());
            fields.insert("exists".into(), serde_json::json!(exists));
        }
        _ => {}
    }

    serde_json::Value::Object(fields)
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

        let has_key = match ks.retrieve(&email) {
            Ok(Some(_)) => true,
            Ok(None) => false,
            Err(err) => {
                host_logger::warn(
                    "nm.keychain_watch_failed",
                    "Native messaging keychain watcher read failed",
                    serde_json::json!({
                        "email_present": true,
                        "error_present": !err.is_empty(),
                    }),
                );
                false
            }
        };

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
            host_logger::info(
                "nm.event_sent",
                "Native messaging event sent",
                serde_json::json!({
                    "event": "DESKTOP_LOCKED",
                    "email_present": true,
                }),
            );
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
            host_logger::info(
                "nm.event_sent",
                "Native messaging event sent",
                serde_json::json!({
                    "event": "DESKTOP_UNLOCKED",
                    "email_present": true,
                }),
            );
        }

        last_has_key = Some(has_key);
    }
}

fn native_messaging_host() {
    let args: Vec<String> = env::args().collect();
    let caller_origin = nm_host_args::caller_origin_from_args(&args);
    host_logger::info(
        "nm.host_started",
        "Native messaging host started",
        serde_json::json!({
            "caller_origin_present": caller_origin.is_some(),
            "caller_origin": caller_origin.as_deref(),
        }),
    );
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
            let req_type = req.req_type.clone();
            host_logger::info(
                "nm.request_received",
                "Native messaging request received",
                request_log_fields(&req, caller_origin.as_deref()),
            );
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
                    host_logger::info(
                        "nm.watched_email_set",
                        "Native messaging watcher email set",
                        serde_json::json!({
                            "request_type": req_type.as_str(),
                            "email_present": true,
                        }),
                    );
                }
            }

            let resp = handle_request(req, caller_origin.as_deref());
            host_logger::info(
                "nm.response_sent",
                "Native messaging response sent",
                response_log_fields(&req_type, &resp),
            );
            if req_type == "HANDSHAKE" {
                if resp.resp_type == "response" {
                    host_logger::info(
                        "nm.extension_connected",
                        "Extension handshake succeeded",
                        serde_json::json!({
                            "caller_origin_present": caller_origin.is_some(),
                            "caller_origin": caller_origin.as_deref(),
                        }),
                    );
                } else {
                    host_logger::warn(
                        "nm.extension_handshake_failed",
                        "Extension handshake failed",
                        serde_json::json!({
                            "caller_origin_present": caller_origin.is_some(),
                            "caller_origin": caller_origin.as_deref(),
                        }),
                    );
                }
            }
            let _lock = stdout_lock.lock().unwrap();
            write_message(&resp);
        } else {
            host_logger::info(
                "nm.host_stopped",
                "Native messaging host stopped",
                serde_json::json!({
                    "reason": "stdin_closed_or_invalid_message",
                }),
            );
            break;
        }
    }
}

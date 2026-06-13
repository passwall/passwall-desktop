const SERVICE_NAME: &str = "io.passwall.desktop";
const ACCOUNT_PREFIX: &str = "biometric_unlock:";
const FALLBACK_ACCOUNT_PREFIX: &str = "biometric_unlock_fallback:";
const MAX_EMAIL_LEN: usize = 320;
const MAX_SECRET_LEN: usize = 8192;

fn normalize_email(email: &str) -> Result<String, String> {
    let normalized = email.trim().to_ascii_lowercase();
    if normalized.is_empty() || normalized.len() > MAX_EMAIL_LEN || !normalized.contains('@') {
        return Err("Invalid email".to_string());
    }
    Ok(normalized)
}

fn account_for(email: &str) -> Result<String, String> {
    Ok(format!("{}{}", ACCOUNT_PREFIX, normalize_email(email)?))
}

fn fallback_account_for(email: &str) -> Result<String, String> {
    Ok(format!("{}{}", FALLBACK_ACCOUNT_PREFIX, normalize_email(email)?))
}

fn validate_secret(secret: &str) -> Result<(), String> {
    if secret.is_empty() {
        return Err("Secret cannot be empty".to_string());
    }
    if secret.len() > MAX_SECRET_LEN {
        return Err("Secret too large".to_string());
    }
    Ok(())
}

#[cfg(target_os = "macos")]
mod platform {
    use super::{account_for, fallback_account_for, validate_secret, SERVICE_NAME};
    use block2::StackBlock;
    use objc2::runtime::Bool;
    use objc2_foundation::{NSError, NSString};
    use objc2_local_authentication::{LAContext, LAPolicy};
    use security_framework::access_control::{ProtectionMode, SecAccessControl};
    use security_framework::passwords::{
        delete_generic_password, get_generic_password, set_generic_password,
        set_generic_password_options, AccessControlOptions, PasswordOptions,
    };
    use std::str;
    use std::sync::mpsc;
    use std::time::Duration;

    fn make_access_control(options: AccessControlOptions) -> Result<SecAccessControl, String> {
        SecAccessControl::create_with_protection(
            Some(ProtectionMode::AccessibleWhenUnlockedThisDeviceOnly),
            options.bits(),
        )
        .map_err(|err| {
            format!(
                "Could not create biometric keychain access control ({})",
                err.code()
            )
        })
    }

    fn store_with_options(
        account: &str,
        user_key_b64: &str,
        options: AccessControlOptions,
    ) -> Result<(), String> {
        let access_control = make_access_control(options)?;
        let mut password_options = PasswordOptions::new_generic_password(SERVICE_NAME, account);
        password_options.set_access_control(access_control);
        set_generic_password_options(user_key_b64.as_bytes(), password_options)
            .map_err(|err| format!("Could not store biometric unlock key ({})", err.code()))
    }

    fn evaluate_biometric_policy() -> Result<(), String> {
        let context = unsafe { LAContext::new() };
        let reason = NSString::from_str("unlock Passwall");
        let (tx, rx) = mpsc::channel();
        let block = StackBlock::new(move |success: Bool, _error: *mut NSError| {
            let _ = tx.send(success.as_bool());
        });

        unsafe {
            context.evaluatePolicy_localizedReason_reply(
                LAPolicy::DeviceOwnerAuthenticationWithBiometrics,
                &reason,
                &block,
            );
        }

        match rx.recv_timeout(Duration::from_secs(60)) {
            Ok(true) => Ok(()),
            Ok(false) => Err("Touch ID unlock was not completed".to_string()),
            Err(_) => Err("Touch ID unlock timed out".to_string()),
        }
    }

    pub fn is_available() -> bool {
        let context = unsafe { LAContext::new() };
        unsafe {
            context
                .canEvaluatePolicy_error(LAPolicy::DeviceOwnerAuthenticationWithBiometrics)
                .is_ok()
        }
    }

    pub fn store(email: &str, user_key_b64: &str) -> Result<(), String> {
        validate_secret(user_key_b64)?;
        if !is_available() {
            return Err("Touch ID is not available on this device".to_string());
        }

        let account = account_for(email)?;
        let fallback_account = fallback_account_for(email)?;
        let _ = delete_generic_password(SERVICE_NAME, &account);
        let _ = delete_generic_password(SERVICE_NAME, &fallback_account);

        match store_with_options(
            &account,
            user_key_b64,
            AccessControlOptions::BIOMETRY_CURRENT_SET,
        ) {
            Ok(()) => Ok(()),
            Err(current_set_error) => {
                let _ = delete_generic_password(SERVICE_NAME, &account);

                store_with_options(&account, user_key_b64, AccessControlOptions::USER_PRESENCE)
                    .or_else(|user_presence_error| {
                        set_generic_password(
                            SERVICE_NAME,
                            &fallback_account,
                            user_key_b64.as_bytes(),
                        )
                        .map_err(|err| {
                            format!(
                                "{}; fallback failed: {}; local auth fallback failed: {}",
                                current_set_error,
                                user_presence_error,
                                err.code()
                            )
                        })
                    })
            }
        }
    }

    pub fn get(email: &str) -> Result<Option<String>, String> {
        let account = account_for(email)?;
        match get_generic_password(SERVICE_NAME, &account) {
            Ok(bytes) => str::from_utf8(&bytes)
                .map(|value| Some(value.to_string()))
                .map_err(|_| "Biometric unlock key is invalid".to_string()),
            Err(err) => {
                let code = err.code();
                // errSecItemNotFound = -25300
                if code == -25300 {
                    let fallback_account = fallback_account_for(email)?;
                    evaluate_biometric_policy()?;
                    match get_generic_password(SERVICE_NAME, &fallback_account) {
                        Ok(bytes) => str::from_utf8(&bytes)
                            .map(|value| Some(value.to_string()))
                            .map_err(|_| "Biometric unlock key is invalid".to_string()),
                        Err(fallback_err) if fallback_err.code() == -25300 => Ok(None),
                        Err(_) => Err("Touch ID unlock failed".to_string()),
                    }
                } else {
                    Err("Touch ID unlock failed".to_string())
                }
            }
        }
    }

    pub fn remove(email: &str) -> Result<(), String> {
        let account = account_for(email)?;
        let fallback_account = fallback_account_for(email)?;
        let _ = delete_generic_password(SERVICE_NAME, &account);
        let _ = delete_generic_password(SERVICE_NAME, &fallback_account);
        Ok(())
    }

    pub fn has_key(email: &str) -> bool {
        let _ = email;
        false
    }
}

#[cfg(not(target_os = "macos"))]
mod platform {
    pub fn is_available() -> bool {
        false
    }

    pub fn store(_email: &str, _user_key_b64: &str) -> Result<(), String> {
        Err("Biometric unlock is not supported on this platform".to_string())
    }

    pub fn get(_email: &str) -> Result<Option<String>, String> {
        Ok(None)
    }

    pub fn remove(_email: &str) -> Result<(), String> {
        Ok(())
    }

    pub fn has_key(_email: &str) -> bool {
        false
    }
}

pub fn is_available() -> bool {
    platform::is_available()
}

pub fn store(email: &str, user_key_b64: &str) -> Result<(), String> {
    platform::store(email, user_key_b64)
}

pub fn get(email: &str) -> Result<Option<String>, String> {
    platform::get(email)
}

pub fn remove(email: &str) -> Result<(), String> {
    platform::remove(email)
}

pub fn has_key(email: &str) -> bool {
    platform::has_key(email)
}

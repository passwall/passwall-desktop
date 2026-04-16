use keyring::Entry;

const SERVICE_NAME: &str = "io.passwall.desktop";
const MAX_EMAIL_LEN: usize = 254;
const MAX_KEY_LEN: usize = 4096;

pub struct KeyStore;

impl KeyStore {
    pub fn new() -> Self {
        Self
    }

    fn validate_email(email: &str) -> Result<(), String> {
        if email.is_empty() {
            return Err("Email cannot be empty".into());
        }
        if email.len() > MAX_EMAIL_LEN {
            return Err("Email too long".into());
        }
        if !email.contains('@') {
            return Err("Invalid email format".into());
        }
        Ok(())
    }

    fn validate_key(key_b64: &str) -> Result<(), String> {
        if key_b64.is_empty() {
            return Err("Key cannot be empty".into());
        }
        if key_b64.len() > MAX_KEY_LEN {
            return Err("Key data too large".into());
        }
        if !key_b64.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'+' || b == b'/' || b == b'=') {
            return Err("Key contains invalid characters".into());
        }
        Ok(())
    }

    fn entry_for(email: &str) -> Result<Entry, String> {
        Entry::new(SERVICE_NAME, email).map_err(|e| format!("Keyring error: {}", e))
    }

    pub fn store(&self, email: &str, key_b64: &str) -> Result<(), String> {
        Self::validate_email(email)?;
        Self::validate_key(key_b64)?;
        let entry = Self::entry_for(email)?;
        entry
            .set_password(key_b64)
            .map_err(|_| "Failed to store key in keychain".into())
    }

    pub fn retrieve(&self, email: &str) -> Result<Option<String>, String> {
        Self::validate_email(email)?;
        let entry = Self::entry_for(email)?;
        match entry.get_password() {
            Ok(password) => Ok(Some(password)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(_) => Err("Failed to retrieve key from keychain".into()),
        }
    }

    pub fn remove(&self, email: &str) -> Result<(), String> {
        Self::validate_email(email)?;
        let entry = Self::entry_for(email)?;
        match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(_) => Err("Failed to remove key from keychain".into()),
        }
    }

    pub fn is_available() -> bool {
        Entry::new(SERVICE_NAME, "__passwall_availability_check__").is_ok()
    }
}

#[cfg(test)]
mod tests {
    use super::{KeyStore, MAX_KEY_LEN};

    #[test]
    fn validate_email_rejects_empty() {
        assert_eq!(
            KeyStore::validate_email("").unwrap_err(),
            "Email cannot be empty"
        );
    }

    #[test]
    fn validate_email_rejects_without_at() {
        assert!(KeyStore::validate_email("not-an-email").is_err());
    }

    #[test]
    fn validate_email_accepts_simple() {
        assert!(KeyStore::validate_email("a@b.co").is_ok());
    }

    #[test]
    fn validate_email_rejects_too_long() {
        let long = format!("{}@x.io", "a".repeat(300));
        assert!(KeyStore::validate_email(&long).is_err());
    }

    #[test]
    fn validate_key_rejects_empty() {
        assert_eq!(
            KeyStore::validate_key("").unwrap_err(),
            "Key cannot be empty"
        );
    }

    #[test]
    fn validate_key_rejects_invalid_chars() {
        assert!(KeyStore::validate_key("abc+def spaces").is_err());
    }

    #[test]
    fn validate_key_accepts_standard_base64() {
        assert!(KeyStore::validate_key("YWJj+/==").is_ok());
    }

    #[test]
    fn validate_key_rejects_too_large() {
        let huge = "a".repeat(MAX_KEY_LEN + 1);
        assert!(KeyStore::validate_key(&huge).is_err());
    }
}

//! Pure helpers for detecting native-messaging host mode from argv (unit-tested).

/// True when this process should run the Chrome native messaging protocol on stdio.
pub fn should_infer_native_messaging_host(args: &[String]) -> bool {
    if let Some(argv0) = args.first() {
        if let Some(name) = std::path::Path::new(argv0).file_name().and_then(|n| n.to_str()) {
            let lower = name.to_ascii_lowercase();
            if lower == "com.passwall.desktop"
                || lower == "com.passwall.desktop.exe"
                || lower.starts_with("passwall-native-messaging-host")
            {
                return true;
            }
        }
    }
    args.iter().any(|a| {
        a.starts_with("chrome-extension://") && a.ends_with('/') && a.len() > 40
    })
}

/// Chrome passes the caller origin as one of the argv entries.
pub fn caller_origin_from_args(args: &[String]) -> Option<String> {
    args.iter().find(|a| {
        a.starts_with("chrome-extension://") && a.ends_with('/') && a.len() > 40
    }).cloned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn infer_from_passwall_native_host_prefix() {
        let args = vec!["/opt/passwall-native-messaging-host-aarch64".to_string()];
        assert!(should_infer_native_messaging_host(&args));
    }

    #[test]
    fn infer_from_com_passwall_desktop_binary_name() {
        let args = vec!["/Applications/Passwall.app/.../com.passwall.desktop".to_string()];
        assert!(should_infer_native_messaging_host(&args));
    }

    #[test]
    fn infer_from_chrome_extension_argv() {
        let args = vec![
            "host".to_string(),
            "chrome-extension://blaiihhmnjllkfnkmkidahhegbmlghmo/".to_string(),
        ];
        assert!(should_infer_native_messaging_host(&args));
    }

    #[test]
    fn no_infer_for_plain_desktop_app_argv() {
        let args = vec!["/Applications/Passwall.app/Contents/MacOS/Passwall".to_string()];
        assert!(!should_infer_native_messaging_host(&args));
    }

    #[test]
    fn chrome_extension_argv_too_short_is_ignored() {
        let args = vec!["chrome-extension://short/".to_string()];
        assert!(!should_infer_native_messaging_host(&args));
    }

    #[test]
    fn extracts_caller_origin() {
        let origin = "chrome-extension://blaiihhmnjllkfnkmkidahhegbmlghmo/".to_string();
        let args = vec!["bin".to_string(), origin.clone()];
        assert_eq!(caller_origin_from_args(&args), Some(origin));
    }

    #[test]
    fn no_origin_when_missing() {
        assert_eq!(
            caller_origin_from_args(&["app".to_string()]),
            None
        );
    }
}

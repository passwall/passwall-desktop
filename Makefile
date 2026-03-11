ARCH ?= arm64

.PHONY: mac-dmg-local mac-dmg-local-x64 mac-dmg-local-arm64 mac-sign-local mac-sign-local-x64 mac-sign-local-arm64 mac-release-local mac-release-local-x64 mac-release-local-arm64

mac-dmg-local:
	bash scripts/mac-dmg-local.sh $(ARCH)

mac-dmg-local-arm64:
	bash scripts/mac-dmg-local.sh arm64

mac-dmg-local-x64:
	bash scripts/mac-dmg-local.sh x64

mac-sign-local:
	bash scripts/mac-sign-notarize-local.sh $(ARCH)

mac-sign-local-arm64:
	bash scripts/mac-sign-notarize-local.sh arm64

mac-sign-local-x64:
	bash scripts/mac-sign-notarize-local.sh x64

mac-release-local:
	bash scripts/mac-release-local.sh $(ARCH)

mac-release-local-arm64:
	bash scripts/mac-release-local.sh arm64

mac-release-local-x64:
	bash scripts/mac-release-local.sh x64

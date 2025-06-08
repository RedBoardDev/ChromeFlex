/**
 * Content Script
 * Main entry point for the Chrome extension content script
 */

import { IS_DEVELOPMENT } from "@/config/env";
import { featureManager } from "@/core/feature-manager";
import { onReady } from "@/utils/events";
import { logger } from "@/utils/logger";

// Global error handler
window.addEventListener("error", (event) => {
	logger.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
	logger.error("Unhandled promise rejection:", event.reason);
});

// Initialize the extension
async function initializeExtension(): Promise<void> {
	try {
		logger.info("🚀 ChromeFlex starting...");

		// Initialize the feature manager
		await featureManager.initialize();

		// Activate features
		await featureManager.activateFeatures();

		logger.info("✅ ChromeFlex initialized successfully");

		// Expose debug utilities in development
		if (IS_DEVELOPMENT) {
			(window as unknown as { ChromeFlex: unknown }).ChromeFlex = {
				featureManager,
				logger,
				getStatus: () => featureManager.getStatus(),
				reload: () => featureManager.reloadFeatures(),
			};

			logger.info("🔧 Debug utilities available at window.ChromeFlex");
		}
	} catch (error) {
		logger.error("❌ Failed to initialize ChromeFlex:", error);
	}
}

// Handle page navigation for SPAs
let lastUrl = location.href;
const checkForUrlChange = (): void => {
	if (location.href !== lastUrl) {
		lastUrl = location.href;
		logger.debug("🔄 URL changed, reloading features");
		featureManager.reloadFeatures().catch((error) => {
			logger.error("Failed to reload features after URL change:", error);
		});
	}
};

// Check for URL changes every second
setInterval(checkForUrlChange, 1000);

// Listen for browser back/forward navigation
window.addEventListener("popstate", () => {
	logger.debug("🔄 Navigation detected, reloading features");
	setTimeout(() => {
		featureManager.reloadFeatures().catch((error) => {
			logger.error("Failed to reload features after navigation:", error);
		});
	}, 100);
});

// Start the extension when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initializeExtension);
} else {
	initializeExtension();
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
	logger.info("🧹 Cleaning up ChromeFlex...");
	featureManager.deactivateFeatures().catch((error) => {
		logger.error("Error during cleanup:", error);
	});
});

// Background service worker for ChromeFlex
import { logger } from "@/utils/logger";

// Extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
	logger.info("ChromeFlex installed:", details.reason);

	if (details.reason === "install") {
		logger.info("First time installation");
	} else if (details.reason === "update") {
		logger.info("Extension updated from", details.previousVersion);
	}
});

chrome.runtime.onStartup.addListener(() => {
	logger.info("ChromeFlex background script started");
});

// Handle extension icon click (if you add a popup later)
chrome.action?.onClicked.addListener((tab) => {
	logger.info("Extension icon clicked for tab:", tab.id);

	// You can add popup logic here or send messages to content script
	if (tab.id) {
		chrome.tabs
			.sendMessage(tab.id, {
				type: "EXTENSION_CLICKED",
				timestamp: Date.now(),
			})
			.catch(() => {
				// Content script not ready or not injected
				logger.debug("Could not send message to content script");
			});
	}
});

// Message handling between background and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	logger.debug(
		"Background received message:",
		message,
		"from:",
		sender.tab?.id,
	);

	switch (message.type) {
		case "GET_EXTENSION_INFO":
			sendResponse({
				version: chrome.runtime.getManifest().version,
				id: chrome.runtime.id,
			});
			break;

		case "LOG_EVENT":
			logger.info("Event from content script:", message.data);
			break;

		default:
			logger.warn("Unknown message type:", message.type);
	}

	return true; // Keep message channel open for async responses
});

// Tab management
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete" && tab.url) {
		logger.debug("Tab updated:", tabId, tab.url);

		// You can send messages to content script when page loads
		chrome.tabs
			.sendMessage(tabId, {
				type: "TAB_UPDATED",
				url: tab.url,
				timestamp: Date.now(),
			})
			.catch(() => {
				// Content script not ready yet
			});
	}
});

// Storage change monitoring
chrome.storage.onChanged.addListener((changes, namespace) => {
	logger.debug("Storage changed:", changes, "in namespace:", namespace);

	// Notify content scripts about storage changes
	chrome.tabs.query({}, (tabs) => {
		for (const tab of tabs) {
			if (tab.id) {
				chrome.tabs
					.sendMessage(tab.id, {
						type: "STORAGE_CHANGED",
						changes,
						namespace,
						timestamp: Date.now(),
					})
					.catch(() => {
						// Content script not available
					});
			}
		}
	});
});

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
	logger.debug("Port connected:", port.name);

	port.onDisconnect.addListener(() => {
		logger.debug("Port disconnected:", port.name);
	});
});

// Error handling
self.addEventListener("error", (event) => {
	logger.error("Background script error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
	logger.error("Background script unhandled rejection:", event.reason);
});

logger.info("ChromeFlex background script loaded");

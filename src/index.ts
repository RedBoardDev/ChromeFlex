// Core exports
export { BaseFeature } from "@/core/base-feature";
export { ChromeFlexEventBus, eventBus } from "@/core/event-bus";
export {
	ChromeFlexFeatureRegistry,
	featureRegistry,
} from "@/core/feature-registry";
export {
	ChromeFlexFeatureManager,
	featureManager,
} from "@/core/feature-manager";

// Types exports
export type {
	Feature,
	FeatureConfig,
	FeatureContext,
	FeatureRegistry,
	EventBus,
	EventPayload,
	ChromeFlexEvent,
	EventListener,
	Logger,
} from "@/types";

export { FeatureState, LogLevel } from "@/types";

// Utilities exports
export {
	createElement,
	waitForElement,
	getElement,
	getAllElements,
	addButton,
	insertElement,
	setStyles,
	toggleClass,
	hasClass,
	isVisible,
	getElementPosition,
	isInViewport,
} from "@/utils/dom";

export {
	ChromeFlexStorage,
	storage,
	setItem,
	getItem,
	removeItem,
	clearStorage,
} from "@/utils/storage";

export {
	debounce,
	throttle,
	EventManager,
	onReady,
	onLoad,
	waitForEvent,
	dispatchCustomEvent,
	trackMousePosition,
} from "@/utils/events";

export {
	ChromeFlexLogger,
	logger,
	createFeatureLogger,
} from "@/utils/logger";

import { eventBus } from "@/core/event-bus";
// Import for default export
import { featureManager } from "@/core/feature-manager";
import { featureRegistry } from "@/core/feature-registry";
import { logger } from "@/utils/logger";
import { storage } from "@/utils/storage";

// For backward compatibility and convenience
export default {
	featureManager,
	eventBus,
	featureRegistry,
	logger,
	storage,
};

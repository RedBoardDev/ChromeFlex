import { BaseFeature } from "@/core/base-feature";
import type { FeatureConfigInput, FeatureContext } from "@/types";

export default class TestFeatureFeature extends BaseFeature {
	constructor() {
		const config: FeatureConfigInput = {
			name: "test-feature",
			matches: ["https://example.com/*"], // Update with your target URLs
			priority: 10,
			enabled: true,
			shouldActivate: (context: FeatureContext) => {
				// Custom activation logic here
				// Return true if this feature should run on the current page
				return true;
			},
			errorRecovery: {
				maxRetries: 3,
				retryDelay: 1000,
				fallbackMode: true,
			},
			settings: {
				// Add any feature-specific settings here
				// Example: theme: 'dark', enableAnimations: true
			},
		};

		super(config);
	}

	protected async onInit(context: FeatureContext): Promise<void> {
		this.logger.info("Initializing test-feature feature");

		// Initialize your feature here
		// - Subscribe to events using this.onEvent()
		// - Setup data structures
		// - Prepare resources

		// Example: Listen to events
		// this.onEvent("some-event", (event) => {
		//   this.logger.debug("Received event:", event.payload);
		// });
	}

	protected async onStart(context: FeatureContext): Promise<void> {
		this.logger.info("Starting test-feature feature");

		// Main feature logic here
		// - Add DOM elements using this.addElement()
		// - Start listeners
		// - Begin active functionality

		// Example: Add a button
		// const button = document.createElement("button");
		// button.textContent = "My Feature Button";
		// button.onclick = () => this.handleButtonClick();
		// document.body.appendChild(button);
		// this.addElement("main-button", button);

		// Example: Add cleanup task
		// this.addCleanupTask(() => {
		//   console.log("Custom cleanup for test-feature");
		// });
	}

	protected async onStop(): Promise<void> {
		this.logger.info("Stopping test-feature feature");

		// Cleanup here
		// - Remove DOM elements (automatic if using this.addElement())
		// - Clear intervals/timeouts (automatic if using this.setTimeout/setInterval)
		// - Stop listeners
		// - Pause functionality

		// Note: DOM elements and timers are automatically cleaned up
		// Custom cleanup tasks are also automatically executed
	}

	protected async onDestroy(): Promise<void> {
		this.logger.info("Destroying test-feature feature");

		// Final cleanup here
		// - Reset internal state
		// - Release any remaining resources
		// - Cleanup is mostly automatic via BaseFeature

		this.emitEvent("test-feature:destroyed", {
			timestamp: Date.now(),
		});
	}

	// Example private methods

	// private handleButtonClick(): void {
	//   try {
	//     this.logger.info("Button clicked!");
	//
	//     this.emitEvent("test-feature:button-clicked", {
	//       timestamp: Date.now(),
	//       url: window.location.href,
	//     });
	//   } catch (error) {
	//     this.logger.error("Error in button click:", error);
	//     throw error; // Let the error boundary handle it
	//   }
	// }

	// private setupEventListeners(): void {
	//   this.onEvent("some-external-event", (event) => {
	//     this.logger.debug("Received external event:", event.payload);
	//   });
	// }
}

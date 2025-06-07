import { BaseFeature } from "@/core/base-feature";
import type { FeatureConfigInput, FeatureContext } from "@/types";
import { addButton } from "@/utils/dom";
import { EventManager } from "@/utils/events";

export default class ExampleButtonFeature extends BaseFeature {
	private eventManager = new EventManager();
	private button: HTMLButtonElement | null = null;
	private clickCount = 0;

	constructor() {
		const config: FeatureConfigInput = {
			name: "example-button",
			matches: ["https://example.com/*", "https://google.com/*"],
			priority: 10,
			enabled: true,
			shouldActivate: (context: FeatureContext) => {
				// Custom activation logic moved to shouldActivate
				return context.document.querySelector("body") !== null;
			},
			errorRecovery: {
				maxRetries: 2,
				retryDelay: 2000,
				fallbackMode: true,
			},
		};

		super(config);
	}

	protected async onInit(context: FeatureContext): Promise<void> {
		this.logger.info("Initializing example button feature");

		// Subscribe to events using the new safe method
		this.setupEventListeners();

		// Emit initialization event
		this.emitEvent("example-button:initialized", {
			url: context.url,
			timestamp: context.timestamp,
		});
	}

	protected async onStart(context: FeatureContext): Promise<void> {
		this.logger.info("Starting example button feature");

		// Add the button to the page
		this.button = addButton(
			"body",
			`ChromeFlex Button (${this.clickCount})`,
			() => this.handleButtonClick(),
			{
				id: "chromeflex-example-button",
				class: "chromeflex-button",
			},
		);

		if (this.button) {
			// Store button in elements map for automatic cleanup
			this.addElement("main-button", this.button);

			// Apply styles
			this.applyButtonStyles(this.button);

			// Add hover effects using the new event manager
			this.eventManager.addEventListener(this.button, "mouseenter", () => {
				if (this.button) {
					this.button.style.transform = "scale(1.05)";
					this.button.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
				}
			});

			this.eventManager.addEventListener(this.button, "mouseleave", () => {
				if (this.button) {
					this.button.style.transform = "scale(1)";
					this.button.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
				}
			});

			// Add cleanup task for event manager
			this.addCleanupTask(() => this.eventManager.cleanup());

			this.logger.info("Button added successfully");
		} else {
			throw new Error("Failed to add button to page");
		}

		// Listen for page changes
		this.setupPageChangeListener();
	}

	protected async onStop(): Promise<void> {
		this.logger.info("Stopping example button feature");

		// Elements will be automatically cleaned up by BaseFeature
		// Event manager will be cleaned up by the cleanup task
		this.button = null;
	}

	protected async onDestroy(): Promise<void> {
		this.logger.info("Destroying example button feature");

		// Reset state
		this.clickCount = 0;

		this.emitEvent("example-button:destroyed", {
			totalClicks: this.clickCount,
		});
	}

	private applyButtonStyles(button: HTMLButtonElement): void {
		// Use CSS classes instead of inline styles for CSP compliance
		const styles = `
			.chromeflex-button {
				position: fixed !important;
				top: 20px !important;
				right: 20px !important;
				z-index: 10000 !important;
				padding: 10px 15px !important;
				background: #4CAF50 !important;
				color: white !important;
				border: none !important;
				border-radius: 5px !important;
				cursor: pointer !important;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
				font-size: 14px !important;
				box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
				transition: all 0.2s ease !important;
			}
		`;

		// Inject styles if not already present
		let styleElement = document.querySelector(
			"#chromeflex-button-styles",
		) as HTMLStyleElement;
		if (!styleElement) {
			styleElement = document.createElement("style");
			styleElement.id = "chromeflex-button-styles";
			styleElement.textContent = styles;
			document.head.appendChild(styleElement);

			// Add to cleanup
			this.addElement("button-styles", styleElement);
		}
	}

	private handleButtonClick(): void {
		try {
			this.clickCount++;
			this.logger.info(`Button clicked! Count: ${this.clickCount}`);

			// Update button text
			if (this.button) {
				this.button.textContent = `ChromeFlex Button (${this.clickCount})`;
			}

			// Emit click event
			this.emitEvent("example-button:clicked", {
				clickCount: this.clickCount,
				timestamp: Date.now(),
				url: window.location.href,
			});

			// Fun animation
			if (this.button) {
				const originalColor = this.button.style.background;
				this.button.style.background = this.getRandomColor();

				// Use our safe setTimeout wrapper
				const timerId = setTimeout(() => {
					if (this.button) {
						this.button.style.background = "#4CAF50";
					}
				}, 200);

				// Timer will be automatically cleaned up by BaseFeature
			}
		} catch (error) {
			// Errors in event handlers are automatically caught by the error boundary
			this.logger.error("Error in button click handler:", error);
			throw error; // Re-throw so the error boundary can handle it
		}
	}

	private setupEventListeners(): void {
		// Listen to our own events for demo
		this.onEvent("example-button:clicked", (event) => {
			const clickCount = event.payload.clickCount as number;
			if (clickCount % 5 === 0) {
				this.logger.info(`Milestone reached: ${clickCount} clicks!`);
			}
		});

		// Listen to other extension events
		this.onEvent("manager:features-activated", (event) => {
			this.logger.debug("Features were activated:", event.payload);
		});

		// Listen for health checks
		this.onEvent("manager:health-check", (event) => {
			const { healthy, problematic } = event.payload as {
				healthy: number;
				problematic: number;
			};

			if (problematic > 0) {
				this.logger.debug(
					`Health check: ${healthy} healthy, ${problematic} problematic features`,
				);
			}
		});
	}

	private setupPageChangeListener(): void {
		// Use a more efficient approach than polling
		let lastUrl = location.href;

		// Listen for history changes
		const originalPushState = history.pushState;
		const originalReplaceState = history.replaceState;

		const checkUrlChange = () => {
			if (location.href !== lastUrl) {
				lastUrl = location.href;
				this.logger.info("URL changed:", lastUrl);
				this.emitEvent("example-button:url-changed", {
					newUrl: lastUrl,
					timestamp: Date.now(),
				});
			}
		};

		// Override history methods
		history.pushState = function (...args) {
			originalPushState.apply(this, args);
			checkUrlChange();
		};

		history.replaceState = function (...args) {
			originalReplaceState.apply(this, args);
			checkUrlChange();
		};

		// Listen for browser navigation
		window.addEventListener("popstate", checkUrlChange);

		// Restore original methods on cleanup
		this.addCleanupTask(() => {
			history.pushState = originalPushState;
			history.replaceState = originalReplaceState;
			window.removeEventListener("popstate", checkUrlChange);
		});
	}

	private getRandomColor(): string {
		const colors = [
			"#FF6B6B",
			"#4ECDC4",
			"#45B7D1",
			"#96CEB4",
			"#FECA57",
			"#FF9FF3",
			"#F38BA8",
			"#A8E6CF",
			"#FFD93D",
			"#6C5CE7",
		];
		return colors[Math.floor(Math.random() * colors.length)] || "#4CAF50";
	}
}

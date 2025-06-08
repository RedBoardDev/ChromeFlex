/**
 * Button Manager
 * Handles the creation and management of the review filter button
 */

import { createGitHubButton } from "@/helpers";
import { GITHUB_PR_REVIEW_FILTER_CONFIG } from "./config";
import type { FilterConfig } from "./types";

export class ButtonManager {
	private button: HTMLButtonElement | null = null;
	private observer: MutationObserver | null = null;
	private onClickHandler: (() => void) | null = null;

	constructor(private config: FilterConfig) {}

	/**
	 * Set up the button observer to detect when the target button appears
	 */
	setupButtonObserver(onButtonClick: () => void): void {
		this.onClickHandler = onButtonClick;

		// Create a persistent observer that always watches for the target button
		this.observer = new MutationObserver(() => {
			this.checkAndCreateButton();
		});

		// Start observing
		this.observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		// Initial check
		this.checkAndCreateButton();
	}

	/**
	 * Check if target button exists and create our button if needed
	 */
	private checkAndCreateButton(): void {
		const targetButton = document.querySelector(
			GITHUB_PR_REVIEW_FILTER_CONFIG.SELECTORS.TARGET_BUTTON,
		);

		if (targetButton) {
			// Check if our button already exists
			if (!this.button || !document.contains(this.button)) {
				this.createAndInjectButton(targetButton);
			}
		}
	}

	/**
	 * Create and inject the review filter button
	 */
	private createAndInjectButton(targetButton: Element): void {
		// Remove any existing button with our identifier
		const existingButton = document.querySelector(
			GITHUB_PR_REVIEW_FILTER_CONFIG.SELECTORS.REVIEW_BUTTON_IDENTIFIER,
		);
		existingButton?.remove();

		// Find container (parent of target button)
		const container = targetButton.parentElement;
		if (!container) {
			console.warn("Could not find container for button injection");
			return;
		}

		// Create the button
		this.button = createGitHubButton({
			text: GITHUB_PR_REVIEW_FILTER_CONFIG.FILTER.BUTTON_TEXT,
			className: GITHUB_PR_REVIEW_FILTER_CONFIG.FILTER.BUTTON_CLASSES,
			attributes: {
				"data-chromeflex-button": "review-requested",
			},
			onClick: () => {
				this.onClickHandler?.();
			},
		});

		// Inject the button
		container.appendChild(this.button);
	}

	/**
	 * Clean up resources
	 */
	cleanup(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}

		if (this.button && document.contains(this.button)) {
			this.button.remove();
		}

		this.button = null;
		this.onClickHandler = null;
	}

	/**
	 * Check if button exists and is in DOM
	 */
	isButtonActive(): boolean {
		return !!(this.button && document.contains(this.button));
	}
}

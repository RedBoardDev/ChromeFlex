/**
 * Button Manager
 * Handles creation and management of filter buttons
 */

import { createGitHubButton } from "@/helpers";
import type { FilterConfig } from "./types";

export class ButtonManager {
	private button: HTMLButtonElement | null = null;
	private container: Element | null = null;

	constructor(
		private config: FilterConfig,
		private onButtonClick: () => void,
	) {}

	/**
	 * Create and inject the filter button
	 */
	createButton(): boolean {
		// Find container for button injection
		this.container = document.querySelector(this.config.targetButtonSelector);
		if (!this.container) {
			return false;
		}

		// Create button
		this.button = createGitHubButton({
			text: this.config.buttonText,
			onClick: this.onButtonClick,
			className: "btn btn-sm",
		});

		// Inject button
		if (this.container.parentNode) {
			this.container.parentNode.insertBefore(
				this.button,
				this.container.nextSibling,
			);
		}

		return true;
	}

	/**
	 * Remove the button from DOM
	 */
	removeButton(): void {
		if (this.button) {
			this.button.remove();
			this.button = null;
		}
	}

	/**
	 * Check if button exists in DOM
	 */
	isButtonActive(): boolean {
		return this.button !== null && document.contains(this.button);
	}

	/**
	 * Update button text
	 */
	updateButtonText(text: string): void {
		if (this.button) {
			this.button.textContent = text;
		}
	}
}

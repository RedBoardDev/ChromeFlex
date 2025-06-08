import { waitForElement } from "@/utils/dom";

/**
 * Generic Select2 manipulation utilities
 */

export interface Select2Option {
	value: string;
	text: string;
}

export interface Select2UpdateOptions {
	timeout?: number;
	retries?: number;
}

/**
 * Wait for a Select2 element to appear in the DOM
 */
export async function waitForSelect2Element(
	selector: string,
	options: Select2UpdateOptions = {},
): Promise<HTMLElement | null> {
	const { timeout = 5000, retries = 10 } = options;

	return await waitForElement<HTMLElement>(selector, {
		timeout,
		retries,
	});
}

/**
 * Open a Select2 dropdown and select the first available option using keyboard navigation
 */
export async function selectFirstSelect2OptionFast(
	containerSelector: string,
	options: Select2UpdateOptions = {},
): Promise<boolean> {
	try {
		const container = await waitForSelect2Element(containerSelector, options);
		if (!container) {
			return false;
		}

		// Get the original select element
		const containerId = container.id;
		let originalSelect: HTMLSelectElement | null = null;

		if (containerId?.startsWith("s2id_")) {
			const originalSelectId = containerId.substring(5);
			originalSelect = document.getElementById(
				originalSelectId,
			) as HTMLSelectElement;
		}

		// Try direct DOM manipulation

		container.click();
		await new Promise((resolve) => setTimeout(resolve, 300));

		const mousedownEvent = new MouseEvent("mousedown", { bubbles: true });
		container.dispatchEvent(mousedownEvent);
		await new Promise((resolve) => setTimeout(resolve, 300));

		// Check if dropdown is open
		const isDropdownOpen =
			container.classList.contains("select2-dropdown-open") ||
			document.querySelector(".select2-dropdown-open") ||
			document.querySelector(".select2-results");

		if (isDropdownOpen) {
			// Wait a bit for dropdown to stabilize
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Simulate TAB key press to navigate to first option
			const tabEvent = new KeyboardEvent("keydown", {
				key: "Tab",
				code: "Tab",
				keyCode: 9,
				which: 9,
				bubbles: true,
				cancelable: true,
			});

			// Send TAB to the container or active element
			const activeElement = document.activeElement as HTMLElement;
			const targetForTab =
				activeElement === container ? container : activeElement || container;

			targetForTab.dispatchEvent(tabEvent);

			// Wait a bit for TAB navigation and selection
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Check if selection worked by looking at the visual state
			const chosenElement = container.querySelector(
				".select2-chosen",
			) as HTMLElement;
			if (
				chosenElement &&
				chosenElement.textContent?.trim() !== "Select a repository"
			) {
				return true;
			}

			// Alternative: Try arrow keys navigation
			const arrowDownEvent = new KeyboardEvent("keydown", {
				key: "ArrowDown",
				code: "ArrowDown",
				keyCode: 40,
				which: 40,
				bubbles: true,
				cancelable: true,
			});

			const currentActive = document.activeElement as HTMLElement;
			const targetForArrow = currentActive || container;
			targetForArrow.dispatchEvent(arrowDownEvent);
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Check again after ArrowDown
			if (
				chosenElement &&
				chosenElement.textContent?.trim() !== "Select a repository"
			) {
				return true;
			}
		}

		return false;
	} catch (error) {
		return false;
	}
}

/**
 * Get the current value of a Select2 element
 */
export function getSelect2Value(
	containerSelector: string,
): Select2Option | null {
	try {
		const container = document.querySelector(containerSelector);
		if (!container) {
			return null;
		}

		const chosenElement =
			container.querySelector<HTMLElement>(".select2-chosen");
		if (!chosenElement) {
			return null;
		}

		return {
			value: chosenElement.getAttribute("data-value") || "",
			text: chosenElement.textContent || "",
		};
	} catch (error) {
		return null;
	}
}

/**
 * Branch Name Updater
 * Handles updating the branch name input field in the Jira interface
 */

import { JIRA_BRANCH_HELPER_CONFIG } from "./config";
import type { BranchNameUpdateResult } from "./types";

/**
 * Update the branch name input field
 */
export async function updateBranchNameInput(
	branchName: string,
): Promise<BranchNameUpdateResult> {
	try {
		const inputElement = await findBranchNameInput();
		if (!inputElement) {
			return {
				success: false,
				error: "Branch name input field not found",
			};
		}

		// Clear the current value
		inputElement.value = "";
		inputElement.dispatchEvent(new Event("input", { bubbles: true }));
		inputElement.dispatchEvent(new Event("change", { bubbles: true }));

		// Set the new branch name
		inputElement.value = branchName;

		// Trigger various events to ensure the change is registered
		inputElement.dispatchEvent(new Event("input", { bubbles: true }));
		inputElement.dispatchEvent(new Event("change", { bubbles: true }));
		inputElement.dispatchEvent(new Event("blur", { bubbles: true }));
		inputElement.dispatchEvent(new Event("keyup", { bubbles: true }));

		// Focus the element to ensure it's active
		inputElement.focus();

		// Verify the value was set
		const currentValue = inputElement.value;
		if (currentValue !== branchName) {
			return {
				success: false,
				error: `Failed to set branch name. Expected: ${branchName}, Got: ${currentValue}`,
			};
		}

		return {
			success: true,
			branchName: currentValue,
		};
	} catch (error) {
		return {
			success: false,
			error: `Branch name update failed: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Find the branch name input element
 */
async function findBranchNameInput(): Promise<HTMLInputElement | null> {
	const maxAttempts = 10;
	const delay = 500;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		// Try primary selector
		let element = document.querySelector(
			JIRA_BRANCH_HELPER_CONFIG.SELECTORS.BRANCH_NAME_INPUT,
		) as HTMLInputElement;

		if (element && element.offsetParent !== null) {
			return element;
		}

		// Try alternative selectors if primary fails
		const alternativeSelectors = [
			'input[name="branch-name"]',
			'input[id*="branchName"]',
			'input[placeholder*="branch name"]',
			'input[placeholder*="Enter branch"]',
		];

		for (const selector of alternativeSelectors) {
			element = document.querySelector(selector) as HTMLInputElement;
			if (element && element.offsetParent !== null) {
				return element;
			}
		}

		// Wait before next attempt
		if (attempt < maxAttempts - 1) {
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	return null;
}

/**
 * Check if branch name input is ready for update
 */
export function isBranchNameInputReady(): boolean {
	const element = document.querySelector(
		JIRA_BRANCH_HELPER_CONFIG.SELECTORS.BRANCH_NAME_INPUT,
	) as HTMLInputElement;

	return !!(
		element &&
		element.offsetParent !== null &&
		!element.disabled &&
		!element.readOnly
	);
}

/**
 * Wait for branch name input to be ready
 */
export async function waitForBranchNameInput(
	timeout = JIRA_BRANCH_HELPER_CONFIG.TIMING.MISTRAL_API_TIMEOUT,
): Promise<boolean> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		if (isBranchNameInputReady()) {
			return true;
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	return false;
}

/**
 * Repository Selector
 * Handles automatic selection of repository in Select2 dropdown
 */

import { selectFirstSelect2OptionFast, waitForSelect2Element } from "@/helpers";
import { JIRA_BRANCH_HELPER_CONFIG } from "./config";
import type { BranchFieldInfo, RepositorySelectionResult } from "./types";

/**
 * Set up repository field auto-selection
 */
export async function setupRepositoryAutoSelection(): Promise<RepositorySelectionResult> {
	try {
		// Wait for Select2 element to appear
		const repositoryContainer = await waitForSelect2Element(
			JIRA_BRANCH_HELPER_CONFIG.SELECTORS.REPOSITORY,
			{
				timeout: JIRA_BRANCH_HELPER_CONFIG.TIMING.SELECT2_TIMEOUT,
				retries: JIRA_BRANCH_HELPER_CONFIG.TIMING.SELECT2_RETRIES,
			},
		);

		if (!repositoryContainer) {
			return {
				success: false,
				error: "Repository Select2 container not found",
			};
		}

		// Perform auto-selection
		const success = await selectFirstSelect2OptionFast(
			JIRA_BRANCH_HELPER_CONFIG.SELECTORS.REPOSITORY,
			{
				timeout: JIRA_BRANCH_HELPER_CONFIG.TIMING.SELECTION_TIMEOUT,
				retries: JIRA_BRANCH_HELPER_CONFIG.TIMING.SELECTION_RETRIES,
			},
		);

		if (success) {
			// Get selected repository name
			const selectedRepository = getSelectedRepositoryName(repositoryContainer);

			return {
				success: true,
				selectedRepository,
			};
		}
		return {
			success: false,
			error: "Repository auto-selection failed",
		};
	} catch (error) {
		return {
			success: false,
			error: `Error in repository field setup: ${error}`,
		};
	}
}

/**
 * Get the name of the currently selected repository
 */
function getSelectedRepositoryName(container: HTMLElement): string {
	try {
		const chosenElement = container.querySelector(
			".select2-chosen",
		) as HTMLElement;
		return chosenElement?.textContent?.trim() || "Unknown";
	} catch (error) {
		return "Unknown";
	}
}

/**
 * Check if branch fields were updated after repository selection
 */
export function checkBranchFieldsUpdated(): BranchFieldInfo[] {
	const foundFields: BranchFieldInfo[] = [];

	for (const selector of JIRA_BRANCH_HELPER_CONFIG.SELECTORS.BRANCH_FIELDS) {
		const branchField = document.querySelector(selector);
		if (branchField) {
			foundFields.push({
				selector,
				element: branchField,
				isVisible: isElementVisible(branchField),
			});
		}
	}

	return foundFields;
}

/**
 * Check if an element is visible
 */
function isElementVisible(element: Element): boolean {
	const htmlElement = element as HTMLElement;
	return !!(
		htmlElement.offsetWidth ||
		htmlElement.offsetHeight ||
		htmlElement.getClientRects().length
	);
}

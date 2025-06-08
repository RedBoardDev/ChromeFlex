/**
 * Page Observer
 * Watches for dynamic changes on the page and re-triggers repository selection
 */

import { JIRA_BRANCH_HELPER_CONFIG } from "./config";
import { setupRepositoryAutoSelection } from "./repository-selector";

/**
 * Set up observer to watch for dynamic changes on the page
 */
export function setupPageObserver(
	onRepositoryUpdated?: () => void,
): () => void {
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
				const hasSelect2Element = Array.from(mutation.addedNodes).some(
					(node) => {
						if (node.nodeType === Node.ELEMENT_NODE) {
							const element = node as Element;
							return (
								element.matches?.(
									JIRA_BRANCH_HELPER_CONFIG.SELECTORS.REPOSITORY,
								) ||
								element.querySelector?.(
									JIRA_BRANCH_HELPER_CONFIG.SELECTORS.REPOSITORY,
								)
							);
						}
						return false;
					},
				);

				if (hasSelect2Element) {
					handleRepositoryFieldRedetection(onRepositoryUpdated);
				}
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	// Return cleanup function
	return () => {
		observer.disconnect();
	};
}

/**
 * Handle re-detection of repository field
 */
async function handleRepositoryFieldRedetection(
	onRepositoryUpdated?: () => void,
): Promise<void> {
	try {
		const result = await setupRepositoryAutoSelection();
		if (result.success) {
			onRepositoryUpdated?.();
		}
	} catch (error) {
		// Silent error handling - repository re-detection will retry naturally
	}
}

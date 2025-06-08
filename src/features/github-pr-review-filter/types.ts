/**
 * Types for GitHub PR Review Filter Feature
 */

import type { GitHubPullRequestsInfo } from "./github-url";

export interface FilterConfig {
	/**
	 * Query string to apply when filtering for review requests
	 */
	reviewFilterQuery: string;
	/**
	 * Button text
	 */
	buttonText: string;
	/**
	 * Selector for the "Open all" button to attach our button next to
	 */
	targetButtonSelector: string;
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
	reviewFilterQuery:
		"sort:updated-desc is:pr is:open user-review-requested:@me",
	buttonText: "Review PR",
	targetButtonSelector: "button.btn-link.rgh-open-all-conversations.px-2",
};

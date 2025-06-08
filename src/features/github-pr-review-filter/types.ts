/**
 * GitHub PR Review Filter Feature Types
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

export interface ButtonManagerState {
	isActive: boolean;
	button: HTMLButtonElement | null;
	observer: MutationObserver | null;
}

export interface NavigationEvent {
	url: string;
	timestamp: number;
	type: "spa" | "full";
}

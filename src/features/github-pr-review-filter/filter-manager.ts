/**
 * Filter Manager
 * Handles navigation to review PRs with proper filtering
 */

import { GITHUB_PR_REVIEW_FILTER_CONFIG } from "./config";
import type { GitHubPullRequestsInfo } from "./github-url";
import type { FilterConfig } from "./types";

export class FilterManager {
	private urlInfo: GitHubPullRequestsInfo | null = null;

	constructor(private config: FilterConfig) {}

	/**
	 * Update URL information
	 */
	updateUrlInfo(urlInfo: GitHubPullRequestsInfo | null): void {
		this.urlInfo = urlInfo;
	}

	/**
	 * Navigate to review PRs with proper filtering
	 */
	goToReviewPRs(): void {
		if (!this.urlInfo) {
			throw new Error("No URL info available for navigation");
		}

		// Build the filtered URL
		const reviewUrl = this.buildReviewUrl();

		// Navigate to the review PRs page
		window.location.href = reviewUrl;
	}

	/**
	 * Build the review URL with filtering
	 */
	private buildReviewUrl(): string {
		if (!this.urlInfo) {
			throw new Error("No URL info available");
		}

		const baseUrl = `https://github.com/${this.urlInfo.repository.owner}/${this.urlInfo.repository.name}/pulls`;
		const query = GITHUB_PR_REVIEW_FILTER_CONFIG.FILTER.REVIEW_QUERY;

		return `${baseUrl}?q=${encodeURIComponent(query)}`;
	}
}

/**
 * Filter Manager
 * Handles navigation to PR review filter
 */

import { navigateToUrl } from "./github-navigation";
import {
	type GitHubPullRequestsInfo,
	buildGitHubPullRequestsUrl,
} from "./github-url";
import type { FilterConfig } from "./types";

export class FilterManager {
	private urlInfo: GitHubPullRequestsInfo | null = null;

	constructor(private config: FilterConfig) {}

	/**
	 * Update the current URL info
	 */
	updateUrlInfo(urlInfo: GitHubPullRequestsInfo | null): void {
		this.urlInfo = urlInfo;
	}

	/**
	 * Navigate to review PR filter
	 */
	goToReviewPRs(): void {
		if (!this.urlInfo) {
			throw new Error("No URL info available");
		}

		const targetUrl = buildGitHubPullRequestsUrl(this.urlInfo.repository, {
			q: this.config.reviewFilterQuery,
		});

		navigateToUrl({ url: targetUrl });
	}
}

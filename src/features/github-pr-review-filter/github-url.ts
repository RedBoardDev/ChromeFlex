/**
 * GitHub URL Helper
 * Utilities for parsing and validating GitHub URLs
 */

export interface GitHubRepository {
	owner: string;
	name: string;
}

export interface GitHubPullRequestsInfo {
	repository: GitHubRepository;
	searchParams: URLSearchParams;
}

/**
 * Validates if a URL is a GitHub pull requests page
 */
export function isGitHubPullRequestsPage(url: string): boolean {
	try {
		// Pattern to match GitHub PR pages with optional query parameters and fragments
		const urlPattern =
			/^https:\/\/github\.com\/[^\/]+\/[^\/]+\/pulls(?:\/.*)?(?:\?.*)?(?:#.*)?$/;
		const patternMatch = urlPattern.test(url);

		if (!patternMatch) {
			return false;
		}

		// Additional verification using pathname parsing
		const urlObj = new URL(url);
		const pathParts = urlObj.pathname.split("/").filter(Boolean);

		// Verify it's actually a pulls page by checking the path structure
		return pathParts.length >= 3 && pathParts[2] === "pulls";
	} catch (error) {
		// URL parsing failed
		return false;
	}
}

/**
 * Parses a GitHub URL to extract repository and pull request information
 */
export function parseGitHubPullRequestsUrl(
	url: string,
): GitHubPullRequestsInfo | null {
	try {
		if (!isGitHubPullRequestsPage(url)) {
			return null;
		}

		const urlObj = new URL(url);
		const pathParts = urlObj.pathname.split("/").filter(Boolean);

		if (pathParts.length >= 3 && pathParts[0] && pathParts[1]) {
			return {
				repository: {
					owner: pathParts[0],
					name: pathParts[1],
				},
				searchParams: urlObj.searchParams,
			};
		}

		return null;
	} catch (error) {
		return null;
	}
}

/**
 * Builds a GitHub pull requests URL with query parameters
 */
export function buildGitHubPullRequestsUrl(
	repository: GitHubRepository,
	queryParams: Record<string, string> = {},
): string {
	try {
		const url = new URL(
			`https://github.com/${repository.owner}/${repository.name}/pulls`,
		);

		// Add query parameters
		for (const [key, value] of Object.entries(queryParams)) {
			url.searchParams.set(key, value);
		}

		return url.toString();
	} catch (error) {
		// Fallback to basic URL if construction fails
		return `https://github.com/${repository.owner}/${repository.name}/pulls`;
	}
}

/**
 * Generic URL matching utilities
 */

export interface UrlMatchOptions {
	caseSensitive?: boolean;
	exactMatch?: boolean;
}

/**
 * Check if a URL matches a given pattern
 */
export function matchesUrlPattern(
	url: string,
	pattern: string | RegExp,
	options: UrlMatchOptions = {},
): boolean {
	const { caseSensitive = true, exactMatch = false } = options;

	if (typeof pattern === "string") {
		// Convert glob-style pattern to regex
		let regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");

		if (exactMatch) {
			regexPattern = `^${regexPattern}$`;
		}

		const flags = caseSensitive ? "g" : "gi";
		const regex = new RegExp(regexPattern, flags);
		return regex.test(url);
	}

	return pattern.test(url);
}

/**
 * Extract query parameters from a URL
 */
export function getUrlParams(url: string): Record<string, string> {
	try {
		const urlObj = new URL(url);
		const params: Record<string, string> = {};

		for (const [key, value] of urlObj.searchParams) {
			params[key] = value;
		}

		return params;
	} catch (error) {
		return {};
	}
}

/**
 * Check if URL has required parameters
 */
export function hasRequiredParams(
	url: string,
	requiredParams: string[],
): boolean {
	const params = getUrlParams(url);
	return requiredParams.every((param) => param in params);
}

/**
 * Build a URL with parameters
 */
export function buildUrl(
	baseUrl: string,
	params: Record<string, string>,
): string {
	try {
		const url = new URL(baseUrl);
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}
		return url.toString();
	} catch (error) {
		return baseUrl;
	}
}

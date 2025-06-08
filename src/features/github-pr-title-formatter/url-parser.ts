/**
 * GitHub URL Parser for PR Title Formatter
 */

import { GITHUB_PR_TITLE_FORMATTER_CONFIG } from "./config";
import type { UrlInfo } from "./types";

/**
 * Parse l'URL GitHub pour extraire le nom de la branche
 */
export function parseGitHubUrl(url: string): UrlInfo {
	const urlInfo: UrlInfo = {
		url,
		branchName: null,
		isValidUrl: false,
	};

	// Vérifie si l'URL correspond au pattern attendu
	const isValidUrl = GITHUB_PR_TITLE_FORMATTER_CONFIG.URL_MATCHES.some(
		(pattern) => new RegExp(pattern.replace(/\*/g, ".*")).test(url),
	);

	if (!isValidUrl) {
		return urlInfo;
	}

	urlInfo.isValidUrl = true;

	// Extrait le nom de branche depuis l'URL
	const branchMatch = url.match(
		GITHUB_PR_TITLE_FORMATTER_CONFIG.PATTERNS.BRANCH_NAME,
	);
	if (branchMatch?.[1]) {
		urlInfo.branchName = decodeURIComponent(branchMatch[1]);
	}

	return urlInfo;
}

/**
 * Obtient l'URL actuelle et extrait les informations de branche
 */
export function getCurrentUrlInfo(): UrlInfo {
	return parseGitHubUrl(window.location.href);
}

/**
 * Vérifie si l'URL actuelle est une page de création de PR
 */
export function isCreatePRPage(): boolean {
	const urlInfo = getCurrentUrlInfo();
	return urlInfo.isValidUrl && urlInfo.branchName !== null;
}

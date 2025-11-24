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
	const matchesPattern = GITHUB_PR_TITLE_FORMATTER_CONFIG.URL_MATCHES.some(
		(pattern) => new RegExp(`^${pattern.replace(/\*/g, ".*")}$`).test(url),
	);

	if (!matchesPattern) {
		return urlInfo;
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(url);
	} catch {
		return urlInfo;
	}

	// Vérifie que l'on est bien sur GitHub
	if (!parsedUrl.hostname.includes("github.com")) {
		return urlInfo;
	}

	// Découpe le chemin pour trouver la section "compare"
	const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
	const compareIndex = pathSegments.indexOf("compare");

	if (compareIndex === -1) {
		return urlInfo;
	}

	const afterCompareSegments = pathSegments.slice(compareIndex + 1);
	if (afterCompareSegments.length === 0) {
		return urlInfo;
	}

	// Récupère la partie après "compare/" (peut contenir base...head ou juste head)
	const comparePart = decodeURIComponent(afterCompareSegments.join("/"));
	if (!comparePart) {
		return urlInfo;
	}

	// Si format base...head, on garde la partie head (branche source)
	const branchCandidate = comparePart.includes("...")
		? (comparePart.split("...").pop() ?? null)
		: comparePart;

	if (branchCandidate) {
		urlInfo.branchName = branchCandidate;
		urlInfo.isValidUrl = true;
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

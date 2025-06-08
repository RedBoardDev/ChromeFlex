/**
 * Jira URL Parser
 * Handles parsing and validation of Jira branch creation URLs
 */

import { getUrlParams, hasRequiredParams, matchesUrlPattern } from "@/helpers";
import { JIRA_BRANCH_HELPER_CONFIG } from "./config";
import type { JiraBranchCreationParams } from "./types";

/**
 * Check if URL is a Jira branch creation page
 */
export function isJiraBranchCreationPage(url: string): boolean {
	return (
		matchesUrlPattern(url, JIRA_BRANCH_HELPER_CONFIG.JIRA_URL_PATTERN) &&
		hasRequiredParams(url, JIRA_BRANCH_HELPER_CONFIG.REQUIRED_PARAMS)
	);
}

/**
 * Parse Jira branch creation URL parameters
 */
export function parseJiraBranchCreationUrl(
	url: string,
): JiraBranchCreationParams | null {
	if (!isJiraBranchCreationPage(url)) {
		return null;
	}

	try {
		const params = getUrlParams(url);

		// Validate all required parameters exist
		if (
			!params.issueKey ||
			!params.issueSummary ||
			!params.jwt ||
			!params.addonkey
		) {
			return null;
		}

		return {
			issueKey: params.issueKey,
			issueSummary: params.issueSummary,
			jwt: params.jwt,
			addonkey: params.addonkey,
		};
	} catch (error) {
		return null;
	}
}

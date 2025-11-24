/**
 * Jira Branch Helper Feature Configuration
 */

import { ENV_CONFIG } from "@/config/env";

export const JIRA_BRANCH_HELPER_CONFIG = {
	// URL patterns
	JIRA_URL_PATTERN: "https://github.atlassian.com/github/create-branch*",
	URL_MATCHES: ["https://github.atlassian.com/github/create-branch*"],

	// Required URL parameters
	REQUIRED_PARAMS: ["issueKey", "issueSummary", "jwt", "addonkey"] as string[],

	// DOM selectors
	SELECTORS: {
		REPOSITORY: "a.select2-choice",
		BRANCH_NAME_INPUT: "#branchNameText",
		BRANCH_FIELDS: [
			'select[name*="branch"]',
			'select[name*="from"]',
			'[data-field="branch"]',
			'[id*="branch"]',
			'[class*="branch"]',
		],
	},

	// Mistral API configuration
	MISTRAL_API: {
		BASE_URL: "https://api.mistral.ai/v1/chat/completions",
		MODEL: "mistral-small",
		MAX_TOKENS: 100,
		TEMPERATURE: 0.1,
		API_KEY: ENV_CONFIG.MISTRAL_API_KEY,
		PROMPT_TEMPLATE: `Analyze this Jira issue summary and generate a concise branch name component.

Issue Summary: "{summary}"

Return ONLY a JSON object with this exact format:
{
  "prefix": "feat|fix|chore",
  "improvedSummary": "maximum-6-descriptive-words-separated-by-hyphens"
}

Rules:
- feat Commits that add, adjust or remove a new feature
- fix Commits that fix a bug
- chore Commits that do not add a new feature or fix a bug, but are necessary for the project to run (e.g. updating dependencies, formatting code, etc.)
- Use maximum 6 descriptive English words
- All lowercase, separated by hyphens
- Be concise and technical
- Focus on the main action/component being changed`,
	},

	// Timeouts and delays
	TIMING: {
		DOM_LOAD_DELAY: 1000,
		SELECT2_TIMEOUT: 5000,
		SELECT2_RETRIES: 10,
		SELECTION_TIMEOUT: 2000,
		SELECTION_RETRIES: 1,
		BRANCH_CHECK_DELAY: 1000,
		MISTRAL_API_TIMEOUT: 8000,
		BRANCH_NAME_UPDATE_DELAY: 500,
	},

	// Feature settings
	FEATURE_CONFIG: {
		name: "jira-branch-helper",
		priority: 10,
		enabled: true,
		errorRecovery: {
			maxRetries: 1,
			retryDelay: 1000,
			fallbackMode: true,
		},
		settings: {
			autoSelectFirstRepository: true,
			autoGenerateBranchName: true,
		},
	},
} as const;

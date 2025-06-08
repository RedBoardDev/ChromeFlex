/**
 * GitHub PR Review Filter Feature Configuration
 */

export const GITHUB_PR_REVIEW_FILTER_CONFIG = {
	// URL patterns
	URL_MATCHES: [
		"https://github.com/*/*/pulls*",
		"https://github.com/*/*/pulls/*",
	],

	// DOM selectors
	SELECTORS: {
		TARGET_BUTTON: "button.btn-link.rgh-open-all-conversations.px-2",
		REVIEW_BUTTON_IDENTIFIER: '[data-chromeflex-button="review-requested"]',
	},

	// Filter configuration
	FILTER: {
		REVIEW_QUERY: "sort:updated-desc is:pr is:open user-review-requested:@me",
		BUTTON_TEXT: "Review PR",
		BUTTON_CLASSES: "btn-link px-2",
	},

	// Timing configuration
	TIMING: {
		OBSERVER_DEBOUNCE: 100,
		NAVIGATION_DEBOUNCE: 500,
	},

	// Feature settings
	FEATURE_CONFIG: {
		name: "github-pr-review-filter",
		priority: 10,
		enabled: true,
		errorRecovery: {
			maxRetries: 3,
			retryDelay: 1000,
			fallbackMode: true,
		},
		settings: {
			buttonText: "Review PR",
			filterQuery: "sort:updated-desc is:pr is:open user-review-requested:@me",
		},
	},
} as const;
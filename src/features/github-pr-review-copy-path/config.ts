/**
 * GitHub PR Review Copy Path Feature Configuration
 */

export const GITHUB_PR_REVIEW_COPY_CONFIG = {
	URL_MATCHES: ["https://github.com/*/*/pull/*"],
	SELECTORS: {
		REVIEW_THREAD_SUMMARY: "summary.js-toggle-outdated-comments",
		FILE_LINK: "a.Link--primary.wb-break-all",
		CONTAINER: ".d-flex.flex-items-center",
	},
	CLASSES: {
		BUTTON:
			"btn-octicon btn-octicon-muted chromeflex-copy-path-btn ml-2 p-1 tooltipped tooltipped-s",
		ICON: "octicon octicon-copy",
	},
	STRINGS: {
		COPY_LABEL: "Copy file link",
		COPIED_LABEL: "Copied!",
		COPY_FAILED_LABEL: "Copy failed",
	},
	FEATURE_CONFIG: {
		name: "github-pr-review-copy-path",
		priority: 8,
		enabled: true,
	},
} as const;

import { BaseFeature } from "@/core/base-feature";
import type { FeatureConfigInput, FeatureContext } from "@/types";
import { isGitHubPullRequestsPage, parseGitHubPullRequestsUrl } from "./github-url";
import { setupNavigationListener } from "./github-navigation";
import { FilterManager } from "./filter-manager";
import { ButtonManager } from "./button-manager";
import { DEFAULT_FILTER_CONFIG, type FilterConfig } from "./types";

export default class GitHubPrReviewFilterFeature extends BaseFeature {
	private filterManager: FilterManager;
	private buttonManager: ButtonManager;
	private filterConfig: FilterConfig;
	private navigationCleanup: (() => void) | null = null;

	constructor() {
		const featureConfig: FeatureConfigInput = {
			name: "github-pr-review-filter",
			matches: [
				"https://github.com/*/*/pulls*",
				"https://github.com/*/*/pulls/*",
			],
			priority: 10,
			enabled: true,
			shouldActivate: (context: FeatureContext) => {
				const isGitHubPrPage = isGitHubPullRequestsPage(context.url);
				this.logger.debug(`Checking activation for URL: ${context.url}`);
				this.logger.debug(`Is GitHub PR page: ${isGitHubPrPage}`);
				return isGitHubPrPage;
			},
			errorRecovery: {
				maxRetries: 3,
				retryDelay: 1000,
				fallbackMode: true,
			},
			settings: {
				buttonText: DEFAULT_FILTER_CONFIG.buttonText,
				filterQuery: DEFAULT_FILTER_CONFIG.reviewFilterQuery,
			},
		};

		super(featureConfig);

		// Initialize filter config
		this.filterConfig = DEFAULT_FILTER_CONFIG;

		// Initialize managers
		this.filterManager = new FilterManager(this.filterConfig);
		this.buttonManager = new ButtonManager(this.filterConfig);
	}

	protected async onInit(context: FeatureContext): Promise<void> {
		this.logger.info("Initializing GitHub PR Review Filter feature");

		// Parse current URL
		const urlInfo = parseGitHubPullRequestsUrl(context.url);
		if (!urlInfo) {
			this.logger.debug("Not on a PR page, skipping initialization");
			return;
		}

		this.logger.debug("GitHub URL info:", urlInfo);

		// Update filter manager
		this.filterManager.updateUrlInfo(urlInfo);

		// Setup navigation listener for SPA navigation
		this.setupNavigationListener();
	}

	protected async onStart(context: FeatureContext): Promise<void> {
		this.logger.info("Starting GitHub PR Review Filter feature");
		this.logger.info(`Current URL: ${context.url}`);

		const urlInfo = parseGitHubPullRequestsUrl(context.url);
		if (!urlInfo) {
			this.logger.debug("Not on a PR page, skipping start");
			return;
		}

		this.logger.info("On PR page, setting up button observer");

		// Update URL info
		this.filterManager.updateUrlInfo(urlInfo);

		// Setup button observer
		this.buttonManager.setupButtonObserver(() => {
			this.handleButtonClick();
		});
	}

	protected async onStop(): Promise<void> {
		this.logger.info("Stopping GitHub PR Review Filter feature");

		// Cleanup button manager
		this.buttonManager.cleanup();

		// Reset filter URL info
		this.filterManager.updateUrlInfo(null);
	}

	protected async onDestroy(): Promise<void> {
		this.logger.info("Destroying GitHub PR Review Filter feature");

		// Cleanup navigation listener
		if (this.navigationCleanup) {
			this.navigationCleanup();
			this.navigationCleanup = null;
		}

		// Cleanup managers
		this.buttonManager.cleanup();

		this.emitEvent("github-pr-review-filter:destroyed", {
			timestamp: Date.now(),
		});
	}

	// ============================================================================
	// Private Methods
	// ============================================================================

	/**
	 * Setup navigation listener for SPA navigation detection
	 */
	private setupNavigationListener(): void {
		this.navigationCleanup = setupNavigationListener((url) => {
			this.handleNavigation(url);
		});

		// Clean up on feature destruction
		this.addCleanupTask(() => {
			if (this.navigationCleanup) {
				this.navigationCleanup();
				this.navigationCleanup = null;
			}
		});
	}

	/**
	 * Handle navigation events
	 */
	private handleNavigation(url: string): void {
		const urlInfo = parseGitHubPullRequestsUrl(url);

		if (urlInfo) {
			// Update filter manager
			this.filterManager.updateUrlInfo(urlInfo);

			// Check if we need to recreate the button
			if (!this.buttonManager.isButtonActive()) {
				this.buttonManager.setupButtonObserver(() => {
					this.handleButtonClick();
				});
			}
		}
	}

	/**
	 * Handle button click - navigate to review PRs
	 */
	private handleButtonClick(): void {
		try {
			this.logger.info("Review PR button clicked - navigating to review PRs");

			// Navigate to review PRs
			this.filterManager.goToReviewPRs();

			// Emit event
			this.emitEvent("github-pr-review-filter:navigated", {
				timestamp: Date.now(),
				url: window.location.href,
			});
		} catch (error) {
			this.logger.error("Error in button click:", error);
		}
	}
}

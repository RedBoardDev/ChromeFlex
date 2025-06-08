import { BaseFeature } from "@/core/base-feature";
import type { FeatureConfigInput, FeatureContext } from "@/types";
import { GITHUB_PR_TITLE_FORMATTER_CONFIG } from "./config";
import {
	findTitleInput,
	setupInputListeners,
	updateTitleInput,
	waitForTitleInput,
} from "./input-manager";
import { PageObserver } from "./page-observer";
import { formatTitleFromBranchName } from "./title-formatter";
import type { TitleFormatterState } from "./types";
import { getCurrentUrlInfo, isCreatePRPage } from "./url-parser";

export default class GitHubPRTitleFormatterFeature extends BaseFeature {
	private formatterState: TitleFormatterState;
	private pageObserver: PageObserver | null = null;

	constructor() {
		const config: FeatureConfigInput = {
			...GITHUB_PR_TITLE_FORMATTER_CONFIG.FEATURE_CONFIG,
			matches: GITHUB_PR_TITLE_FORMATTER_CONFIG.URL_MATCHES,
			shouldActivate: (context: FeatureContext) => {
				const isCreatePR = isCreatePRPage();
				this.logger.debug(`Checking activation for URL: ${context.url}`);
				this.logger.debug(`Is GitHub Create PR page: ${isCreatePR}`);
				return isCreatePR;
			},
		};

		super(config);

		// Initialize formatter state
		this.formatterState = {
			isActive: false,
			titleInput: null,
			lastProcessedBranch: null,
			userHasEdited: false,
		};
	}

	protected async onInit(context: FeatureContext): Promise<void> {
		this.logger.info("Initializing GitHub PR Title Formatter feature");

		// Setup page observer for URL changes
		this.setupPageObserver();

		// Initial check for current URL
		await this.handleUrlChange(context.url);
	}

	protected async onStart(context: FeatureContext): Promise<void> {
		this.logger.info("Starting GitHub PR Title Formatter feature");
		this.logger.info(`Current URL: ${context.url}`);

		// Start the page observer
		if (this.pageObserver) {
			this.pageObserver.start();
		}

		// Process current page
		await this.processCurrentPage();
	}

	protected async onStop(): Promise<void> {
		this.logger.info("Stopping GitHub PR Title Formatter feature");

		// Reset state
		this.formatterState.isActive = false;
		this.formatterState.titleInput = null;
	}

	protected async onDestroy(): Promise<void> {
		this.logger.info("Destroying GitHub PR Title Formatter feature");

		// Stop page observer
		if (this.pageObserver) {
			this.pageObserver.stop();
			this.pageObserver = null;
		}

		// Reset all formatter state
		this.formatterState = {
			isActive: false,
			titleInput: null,
			lastProcessedBranch: null,
			userHasEdited: false,
		};

		this.emitEvent("github-pr-title-formatter:destroyed", {
			timestamp: Date.now(),
		});
	}

	// ============================================================================
	// Private Methods
	// ============================================================================

	/**
	 * Setup page observer for URL changes
	 */
	private setupPageObserver(): void {
		this.pageObserver = new PageObserver((url: string) => {
			void this.handleUrlChange(url);
		});

		// Clean up on feature destruction
		this.addCleanupTask(() => {
			if (this.pageObserver) {
				this.pageObserver.stop();
				this.pageObserver = null;
			}
		});
	}

	/**
	 * Handle URL changes
	 */
	private async handleUrlChange(url: string): Promise<void> {
		try {
			this.logger.debug(`URL change detected: ${url}`);

			// Check if we're on a create PR page
			if (!isCreatePRPage()) {
				if (this.formatterState.isActive) {
					this.logger.debug("Page is no longer compatible, deactivating");
					this.deactivatePageFeature();
				}
				return;
			}

			// Activate for this page
			await this.activatePageFeature();
		} catch (error) {
			this.logger.error("Error handling URL change:", error);
		}
	}

	/**
	 * Process the current page if it's a create PR page
	 */
	private async processCurrentPage(): Promise<void> {
		if (isCreatePRPage()) {
			await this.activatePageFeature();
		}
	}

	/**
	 * Activate the feature for the current page
	 */
	private async activatePageFeature(): Promise<void> {
		try {
			this.logger.debug("Activating feature for current page...");

			// Get URL info
			const urlInfo = getCurrentUrlInfo();
			if (!urlInfo.branchName) {
				this.logger.debug("No branch name found in URL");
				return;
			}

			// Skip if same branch and user has edited
			if (
				this.formatterState.lastProcessedBranch === urlInfo.branchName &&
				this.formatterState.userHasEdited
			) {
				this.logger.debug("Branch already processed and user has edited");
				return;
			}

			// Wait for title input to be available
			this.logger.debug("Waiting for title input...");
			const titleInput = await waitForTitleInput();
			if (!titleInput) {
				this.logger.debug("Title input not found");
				return;
			}

			this.formatterState.titleInput = titleInput;
			this.formatterState.isActive = true;
			this.formatterState.lastProcessedBranch = urlInfo.branchName;

			// Format and update title if needed
			if (
				!this.formatterState.userHasEdited ||
				this.formatterState.lastProcessedBranch !== urlInfo.branchName
			) {
				const formattedTitle = formatTitleFromBranchName(urlInfo.branchName);

				this.logger.info(`Formatting title for branch: ${urlInfo.branchName}`);
				this.logger.info(`Generated title: ${formattedTitle.title}`);

				// Update title input with delay
				setTimeout(() => {
					updateTitleInput(titleInput, formattedTitle.title);
				}, GITHUB_PR_TITLE_FORMATTER_CONFIG.TIMING.INPUT_UPDATE_DELAY);

				// Reset user edit flag for new branch
				this.formatterState.userHasEdited = false;

				// Emit event
				this.emitEvent("github-pr-title-formatter:title-formatted", {
					timestamp: Date.now(),
					branchName: urlInfo.branchName,
					formattedTitle: formattedTitle.title,
					hasTicket: formattedTitle.hasTicket,
					hasPrefix: formattedTitle.hasPrefix,
				});
			}

			// Setup input listeners to detect manual edits
			setupInputListeners(titleInput, this.formatterState, () => {
				this.logger.debug("Manual edit detected");
				this.emitEvent("github-pr-title-formatter:manual-edit-detected", {
					timestamp: Date.now(),
					branchName: urlInfo.branchName,
				});
			});

			this.logger.debug("Feature activated for this page");
		} catch (error) {
			this.logger.error("Error activating feature:", error);
		}
	}

	/**
	 * Deactivate the feature for the current page
	 */
	private deactivatePageFeature(): void {
		this.formatterState.isActive = false;
		this.formatterState.titleInput = null;
		// Keep lastProcessedBranch and userHasEdited for the session
	}

	/**
	 * Check if the feature is currently active
	 */
	public isActive(): boolean {
		return this.formatterState.isActive;
	}

	/**
	 * Get current state (for debugging)
	 */
	public getState(): Readonly<TitleFormatterState> {
		return { ...this.formatterState };
	}
}

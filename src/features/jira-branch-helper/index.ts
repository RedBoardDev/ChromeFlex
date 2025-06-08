/**
 * Jira Branch Helper Feature
 * Automatically selects the first repository and generates branch names in GitHub branch creation pages from Jira
 */

import { BaseFeature } from "@/core/base-feature";
import type { FeatureConfigInput, FeatureContext } from "@/types";

import { generateBranchName } from "./branch-name-generator";
import {
	updateBranchNameInput,
	waitForBranchNameInput,
} from "./branch-name-updater";
import { JIRA_BRANCH_HELPER_CONFIG } from "./config";
import {
	isJiraBranchCreationPage,
	parseJiraBranchCreationUrl,
} from "./jira-url-parser";
import { setupPageObserver } from "./page-observer";
import {
	checkBranchFieldsUpdated,
	setupRepositoryAutoSelection,
} from "./repository-selector";
import type { JiraBranchCreationParams } from "./types";

export default class JiraBranchHelperFeature extends BaseFeature {
	private jiraParams: JiraBranchCreationParams | null = null;
	private repositorySelectionDone = false;

	constructor() {
		const config: FeatureConfigInput = {
			...JIRA_BRANCH_HELPER_CONFIG.FEATURE_CONFIG,
			matches: JIRA_BRANCH_HELPER_CONFIG.URL_MATCHES,
			shouldActivate: (context: FeatureContext) => {
				return isJiraBranchCreationPage(context.url);
			},
		};

		super(config);
	}

	protected async onInit(context: FeatureContext): Promise<void> {
		this.logger.info("Initializing jira-branch-helper feature");

		this.jiraParams = parseJiraBranchCreationUrl(context.url);
		if (this.jiraParams) {
			this.logger.info("Detected Jira branch creation page", {
				issueKey: this.jiraParams.issueKey,
				issueSummary: this.jiraParams.issueSummary,
			});

			this.emitEvent("jira-branch-helper:detected", {
				...this.jiraParams,
				url: context.url,
				timestamp: context.timestamp,
			});
		}
	}

	protected async onStart(context: FeatureContext): Promise<void> {
		if (!this.jiraParams) {
			this.logger.warn("No Jira parameters found, feature will not activate");
			return;
		}

		this.logger.info("Starting jira-branch-helper feature", {
			issueKey: this.jiraParams.issueKey,
		});

		try {
			// Auto-select first repository
			await this.handleRepositoryAutoSelection();

			// Set up page observer for dynamic content (after initial selection)
			await this.setupPageObserver();

			// Generate and set branch name
			await this.handleBranchNameGeneration();

			this.logger.info("Jira branch helper setup completed successfully");
		} catch (error) {
			this.logger.error("Failed to setup jira-branch-helper:", error);
			throw error;
		}
	}

	protected async onStop(): Promise<void> {
		this.logger.info("Stopping jira-branch-helper feature");
		this.repositorySelectionDone = false;
	}

	protected async onDestroy(): Promise<void> {
		this.logger.info("Destroying jira-branch-helper feature");
		this.jiraParams = null;
		this.repositorySelectionDone = false;
	}

	/**
	 * Set up page observer for dynamic content changes
	 */
	private async setupPageObserver(): Promise<void> {
		try {
			const cleanup = setupPageObserver(() => {
				// Only re-trigger if repository selection wasn't already done manually
				if (!this.repositorySelectionDone) {
					this.handleRepositoryAutoSelection();
				}
			});

			// Store cleanup function for proper cleanup
			this.addCleanupTask(cleanup);

			this.logger.debug("Page observer setup completed");
		} catch (error) {
			this.logger.warn("Page observer setup failed:", error);
		}
	}

	/**
	 * Handle repository auto-selection
	 */
	private async handleRepositoryAutoSelection(): Promise<void> {
		if (
			!JIRA_BRANCH_HELPER_CONFIG.FEATURE_CONFIG.settings
				.autoSelectFirstRepository
		) {
			this.logger.info("Repository auto-selection is disabled");
			return;
		}

		// Skip if already done
		if (this.repositorySelectionDone) {
			this.logger.debug("Repository selection already done, skipping");
			return;
		}

		try {
			this.logger.info("Setting up repository auto-selection...");

			const selectionResult = await setupRepositoryAutoSelection();

			if (selectionResult.success) {
				this.repositorySelectionDone = true;

				this.logger.info("Repository auto-selection completed", {
					repository: selectionResult.selectedRepository,
				});

				this.emitEvent("jira-branch-helper:repository-selected", {
					repository: selectionResult.selectedRepository,
					timestamp: Date.now(),
				});

				// Wait for branch fields to be updated after repository selection
				const fieldsUpdated = checkBranchFieldsUpdated();
				if (fieldsUpdated.length > 0) {
					this.logger.debug("Branch fields updated after repository selection");
				} else {
					this.logger.warn("Branch fields may not have updated properly");
				}
			} else {
				this.logger.warn("Repository auto-selection failed", {
					error: selectionResult.error,
				});
			}
		} catch (error) {
			this.logger.error("Repository auto-selection process failed:", error);
		}
	}

	/**
	 * Handle branch name generation process
	 */
	private async handleBranchNameGeneration(): Promise<void> {
		if (!this.jiraParams) {
			throw new Error(
				"No Jira parameters available for branch name generation",
			);
		}

		// Check if auto-generation is enabled
		if (
			!JIRA_BRANCH_HELPER_CONFIG.FEATURE_CONFIG.settings.autoGenerateBranchName
		) {
			this.logger.info("Branch name auto-generation is disabled");
			return;
		}

		try {
			// Generate branch name using Mistral AI
			this.logger.info("Generating branch name...", {
				issueKey: this.jiraParams.issueKey,
				issueSummary: this.jiraParams.issueSummary,
			});

			const generationResult = await generateBranchName(this.jiraParams);

			if (!generationResult.success) {
				this.logger.warn("Branch name generation failed", {
					error: generationResult.error,
				});
				return;
			}

			this.logger.info("Branch name generated successfully", {
				branchName: generationResult.branchName,
			});

			// Wait for branch name input to be ready
			const inputReady = await waitForBranchNameInput();
			if (!inputReady) {
				this.logger.warn("Branch name input field not ready, skipping update");
				return;
			}

			// Update the branch name input
			if (generationResult.branchName) {
				const updateResult = await updateBranchNameInput(
					generationResult.branchName,
				);

				if (updateResult.success) {
					this.logger.info("Branch name updated successfully", {
						branchName: updateResult.branchName,
					});

					this.emitEvent("jira-branch-helper:branch-name-updated", {
						branchName: updateResult.branchName,
						timestamp: Date.now(),
					});
				} else {
					this.logger.warn("Branch name update failed", {
						error: updateResult.error,
					});
				}
			}
		} catch (error) {
			this.logger.error("Branch name generation process failed:", error);
		}
	}
}

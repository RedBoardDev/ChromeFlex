import type { Feature, FeatureContext, FeatureError } from "@/types";
import { FeatureState } from "@/types";
import { logger } from "@/utils/logger";
import { eventBus } from "./event-bus";
import { featureRegistry } from "./feature-registry";

export class ChromeFlexFeatureManager {
	private context: FeatureContext | null = null;
	private isInitialized = false;
	private errorCount = 0;
	private lastHealthCheck = 0;
	private readonly healthCheckInterval = 30000; // 30 seconds

	async initialize(): Promise<void> {
		if (this.isInitialized) {
			logger.warn("FeatureManager already initialized");
			return;
		}

		logger.info("Initializing FeatureManager...");

		this.context = this.createContext();

		// Validate dependencies before initialization
		const validation = featureRegistry.validateDependencies();
		if (!validation.valid) {
			logger.error("Dependency validation failed:", validation.errors);
			throw new Error(
				`Dependency validation failed: ${validation.errors.join(", ")}`,
			);
		}

		// Set up error monitoring
		this.setupErrorMonitoring();

		// Load and register all features
		await this.loadFeatures();

		// Start health monitoring
		this.startHealthMonitoring();

		this.isInitialized = true;
		logger.info("FeatureManager initialized successfully");

		eventBus.emit(
			"manager:initialized",
			{
				featureCount: featureRegistry.getAll().length,
				healthyFeatures: featureRegistry.getHealthyFeatures().length,
				problematicFeatures: featureRegistry.getProblematicFeatures().length,
			},
			"manager",
		);
	}

	async activateFeatures(): Promise<void> {
		if (!this.isInitialized || !this.context) {
			logger.error("FeatureManager not initialized");
			return;
		}

		logger.info("Activating features...");

		const features = featureRegistry.getSortedFeatures();
		let activatedCount = 0;
		let errorCount = 0;
		let skippedCount = 0;

		for (const feature of features) {
			// Skip features that are in error state and can't retry
			if (feature.state === FeatureState.ERROR && !feature.canRetry()) {
				skippedCount++;
				logger.debug(
					`Skipped feature ${feature.name} (in error state, cannot retry)`,
				);
				continue;
			}

			// Skip disabled features
			if (feature.state === FeatureState.DISABLED) {
				skippedCount++;
				logger.debug(`Skipped feature ${feature.name} (disabled)`);
				continue;
			}

			try {
				if (feature.shouldActivate(this.context)) {
					await this.safeActivateFeature(feature);
					activatedCount++;
				} else {
					skippedCount++;
					logger.debug(
						`Skipped feature ${feature.name} (not matching current context)`,
					);
				}
			} catch (error) {
				errorCount++;
				logger.error(`Failed to activate feature ${feature.name}:`, error);
				// Error is already handled by the feature's error boundary
			}
		}

		logger.info(
			`Feature activation complete: ${activatedCount} activated, ${skippedCount} skipped, ${errorCount} errors`,
		);

		eventBus.emit(
			"manager:features-activated",
			{
				activated: activatedCount,
				skipped: skippedCount,
				errors: errorCount,
				total: features.length,
			},
			"manager",
		);
	}

	private async safeActivateFeature(feature: Feature): Promise<void> {
		if (!this.context) {
			throw new Error("FeatureManager context not initialized");
		}

		await feature.init(this.context);
		await feature.start(this.context);
		logger.debug(`Activated feature: ${feature.name}`);
	}

	async deactivateFeatures(): Promise<void> {
		if (!this.isInitialized) {
			logger.warn("FeatureManager not initialized");
			return;
		}

		logger.info("Deactivating features...");

		const runningFeatures = featureRegistry.getByState(FeatureState.RUNNING);
		let deactivatedCount = 0;
		let errorCount = 0;

		// Deactivate in reverse order to respect dependencies
		for (const feature of [...runningFeatures].reverse()) {
			try {
				await feature.stop();
				await feature.destroy();
				deactivatedCount++;
				logger.debug(`Deactivated feature: ${feature.name}`);
			} catch (error) {
				errorCount++;
				logger.error(`Failed to deactivate feature ${feature.name}:`, error);
				// Continue with other features even if one fails
			}
		}

		logger.info(
			`Feature deactivation complete: ${deactivatedCount} deactivated, ${errorCount} errors`,
		);

		eventBus.emit(
			"manager:features-deactivated",
			{
				deactivated: deactivatedCount,
				errors: errorCount,
			},
			"manager",
		);
	}

	async reloadFeatures(): Promise<void> {
		logger.info("Reloading features...");

		await this.deactivateFeatures();

		// Update context with current state
		this.context = this.createContext();

		// Reset error counts for a fresh start
		this.errorCount = 0;

		await this.activateFeatures();
	}

	// Reload only specific features
	async reloadFeature(featureName: string): Promise<void> {
		logger.info(`Reloading feature: ${featureName}`);

		const feature = featureRegistry.get(featureName);
		if (!feature) {
			logger.error(`Feature ${featureName} not found`);
			return;
		}

		try {
			// Stop and destroy if running
			if (feature.state === FeatureState.RUNNING) {
				await feature.stop();
			}
			await feature.destroy();

			// Reset the feature
			feature.reset();

			// Try to activate again
			if (this.context && feature.shouldActivate(this.context)) {
				await this.safeActivateFeature(feature);
				logger.info(`Feature ${featureName} reloaded successfully`);
			} else {
				logger.info(`Feature ${featureName} not activated (context mismatch)`);
			}
		} catch (error) {
			logger.error(`Failed to reload feature ${featureName}:`, error);
		}
	}

	// Error monitoring and recovery
	private setupErrorMonitoring(): void {
		// Listen for feature errors
		eventBus.on("feature:error", (event) => {
			const { feature, error, canRetry } = event.payload as {
				feature: string;
				error: FeatureError;
				canRetry: boolean;
			};

			// Record the error in the registry
			featureRegistry.recordError(error);
			this.errorCount++;

			logger.warn(
				`Feature ${feature} encountered an error in ${error.phase}: ${error.error.message}`,
			);

			// If feature can't retry, emit a critical error
			if (!canRetry) {
				eventBus.emit(
					"manager:feature-disabled",
					{
						feature,
						reason: "max_retries_exceeded",
						error: error.error.message,
					},
					"manager",
				);
			}
		});

		// Listen for feature entering fallback mode
		eventBus.on("feature:fallback", (event) => {
			const { feature, reason } = event.payload as {
				feature: string;
				reason: string;
			};

			logger.warn(`Feature ${feature} entered fallback mode: ${reason}`);

			eventBus.emit(
				"manager:feature-fallback",
				{
					feature,
					reason,
				},
				"manager",
			);
		});
	}

	private startHealthMonitoring(): void {
		const healthCheck = () => {
			const now = Date.now();

			// Only run health check every 30 seconds
			if (now - this.lastHealthCheck < this.healthCheckInterval) {
				return;
			}

			this.lastHealthCheck = now;
			this.performHealthCheck();
		};

		// Initial health check
		setTimeout(() => this.performHealthCheck(), 5000);

		// Periodic health checks
		setInterval(healthCheck, this.healthCheckInterval);
	}

	private performHealthCheck(): void {
		const stats = featureRegistry.getErrorStats();
		const healthyFeatures = featureRegistry.getHealthyFeatures();
		const problematicFeatures = featureRegistry.getProblematicFeatures();

		logger.debug(
			`Health check: ${healthyFeatures.length} healthy, ${problematicFeatures.length} problematic features`,
		);

		// Emit health status
		eventBus.emit(
			"manager:health-check",
			{
				timestamp: Date.now(),
				healthy: healthyFeatures.length,
				problematic: problematicFeatures.length,
				totalErrors: stats.totalErrors,
				recentErrors: stats.recentErrors.length,
				errorsByFeature: stats.errorsByFeature,
			},
			"manager",
		);

		// Try to recover features that might be able to retry now
		for (const feature of problematicFeatures) {
			if (feature.state === FeatureState.ERROR && feature.canRetry()) {
				// Reset the feature to allow retry
				feature.reset();
				logger.info(`Reset feature ${feature.name} for potential retry`);
			}
		}
	}

	// Get status for debugging
	getStatus(): {
		initialized: boolean;
		features: {
			total: number;
			byState: Record<string, number>;
			healthy: number;
			problematic: number;
		};
		errors: {
			total: number;
			recent: number;
			byFeature: Record<string, number>;
		};
		context: FeatureContext | null;
	} {
		const features = featureRegistry.getAll();
		const byState: Record<string, number> = {};

		for (const state of Object.values(FeatureState)) {
			byState[state] = featureRegistry.getByState(state).length;
		}

		const stats = featureRegistry.getErrorStats();

		return {
			initialized: this.isInitialized,
			features: {
				total: features.length,
				byState,
				healthy: featureRegistry.getHealthyFeatures().length,
				problematic: featureRegistry.getProblematicFeatures().length,
			},
			errors: {
				total: stats.totalErrors,
				recent: stats.recentErrors.length,
				byFeature: stats.errorsByFeature,
			},
			context: this.context,
		};
	}

	// Emergency methods
	async emergencyStop(): Promise<void> {
		logger.warn("Emergency stop initiated");

		try {
			await this.deactivateFeatures();
			this.isInitialized = false;

			eventBus.emit(
				"manager:emergency-stop",
				{
					timestamp: Date.now(),
					reason: "manual_trigger",
				},
				"manager",
			);
		} catch (error) {
			logger.error("Error during emergency stop:", error);
		}
	}

	clearAllErrors(): void {
		featureRegistry.clearAllErrors();
		this.errorCount = 0;
		logger.info("Cleared all feature errors");
	}

	private createContext(): FeatureContext {
		return {
			url: window.location.href,
			document: document,
			userAgent: navigator.userAgent,
			timestamp: Date.now(),
		};
	}

	private async loadFeatures(): Promise<void> {
		// Import all features statically to avoid dynamic import issues in Chrome extensions
		const featureClasses = await this.importAllFeatures();

		logger.info(`Loading ${featureClasses.length} feature modules`);

		for (const FeatureClass of featureClasses) {
			try {
				const feature = new FeatureClass();
				featureRegistry.register(feature);
				logger.debug(`Successfully loaded feature: ${feature.name}`);
			} catch (error) {
				logger.error("Failed to instantiate feature:", error);
			}
		}
	}

	private async importAllFeatures(): Promise<Array<new () => Feature>> {
		// Static imports to avoid dynamic import resolution issues in Chrome extensions
		const features: Array<new () => Feature> = [];

		try {
			// Import github-pr-review-filter feature
			const { default: GithubPrReviewFilterFeature } = await import(
				"../features/github-pr-review-filter/index.js"
			);
			features.push(GithubPrReviewFilterFeature);
		} catch (error) {
			logger.warn("Could not load github-pr-review-filter feature:", error);
		}

		try {
			// Import jira-branch-helper feature
			const { default: JiraBranchHelperFeature } = await import(
				"../features/jira-branch-helper/index.js"
			);
			features.push(JiraBranchHelperFeature);
		} catch (error) {
			logger.warn("Could not load jira-branch-helper feature:", error);
		}

		return features;
	}
}

// Singleton instance
export const featureManager = new ChromeFlexFeatureManager();

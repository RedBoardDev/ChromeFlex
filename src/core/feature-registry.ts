import type {
	Feature,
	FeatureError,
	FeatureRegistry,
	FeatureState,
} from "@/types";
import { logger } from "@/utils/logger";
import { eventBus } from "./event-bus";

export class ChromeFlexFeatureRegistry implements FeatureRegistry {
	private readonly features = new Map<string, Feature>();
	private readonly dependencies = new Map<string, readonly string[]>();
	private readonly errors: FeatureError[] = [];

	register(feature: Feature): void {
		if (this.features.has(feature.name)) {
			logger.warn(`Feature ${feature.name} is already registered`);
			return;
		}

		this.features.set(feature.name, feature);

		// Register dependencies
		if (feature.config.dependencies) {
			this.dependencies.set(feature.name, feature.config.dependencies);
		}

		// Listen for errors from this feature
		this.setupErrorTracking(feature);

		logger.debug(`Registered feature: ${feature.name}`);

		eventBus.emit(
			"feature:registered",
			{
				name: feature.name,
				config: feature.config,
			},
			"registry",
		);
	}

	unregister(name: string): void {
		const feature = this.features.get(name);
		if (!feature) {
			logger.warn(`Feature ${name} is not registered`);
			return;
		}

		this.features.delete(name);
		this.dependencies.delete(name);

		// Remove feature-specific errors
		const featureErrorCount = this.errors.length;
		for (let i = this.errors.length - 1; i >= 0; i--) {
			if (this.errors[i]?.featureName === name) {
				this.errors.splice(i, 1);
			}
		}

		if (this.errors.length < featureErrorCount) {
			logger.debug(
				`Removed ${featureErrorCount - this.errors.length} errors for feature ${name}`,
			);
		}

		logger.debug(`Unregistered feature: ${name}`);

		eventBus.emit(
			"feature:unregistered",
			{
				name,
			},
			"registry",
		);
	}

	get(name: string): Feature | undefined {
		return this.features.get(name);
	}

	getAll(): readonly Feature[] {
		return Array.from(this.features.values());
	}

	getByState(state: FeatureState): readonly Feature[] {
		return Array.from(this.features.values()).filter(
			(feature) => feature.state === state,
		);
	}

	getErrors(): readonly FeatureError[] {
		return [...this.errors];
	}

	// Get sorted features respecting dependencies
	getSortedFeatures(): readonly Feature[] {
		const sorted: Feature[] = [];
		const visited = new Set<string>();
		const visiting = new Set<string>();

		const visit = (featureName: string): void => {
			if (visited.has(featureName)) {
				return;
			}

			if (visiting.has(featureName)) {
				logger.error(`Circular dependency detected involving ${featureName}`);
				return;
			}

			visiting.add(featureName);

			const feature = this.features.get(featureName);
			if (!feature) {
				logger.warn(`Feature ${featureName} not found during sorting`);
				visiting.delete(featureName);
				return;
			}

			// Visit dependencies first
			const deps = this.dependencies.get(featureName) || [];
			for (const dep of deps) {
				visit(dep);
			}

			visiting.delete(featureName);
			visited.add(featureName);
			sorted.push(feature);
		};

		// Process all features
		for (const feature of this.features.values()) {
			visit(feature.name);
		}

		// Sort by priority (higher priority first)
		return sorted.sort(
			(a, b) => (b.config.priority || 0) - (a.config.priority || 0),
		);
	}

	// Validate dependency tree
	validateDependencies(): {
		valid: boolean;
		errors: readonly string[];
	} {
		const errors: string[] = [];

		for (const [featureName, deps] of this.dependencies) {
			for (const dep of deps) {
				if (!this.features.has(dep)) {
					errors.push(
						`Feature ${featureName} depends on ${dep} which is not registered`,
					);
				}
			}
		}

		// Check for circular dependencies
		const visited = new Set<string>();
		const visiting = new Set<string>();

		const checkCircular = (featureName: string, path: string[]): void => {
			if (visited.has(featureName)) {
				return;
			}

			if (visiting.has(featureName)) {
				errors.push(
					`Circular dependency: ${path.join(" -> ")} -> ${featureName}`,
				);
				return;
			}

			visiting.add(featureName);

			const deps = this.dependencies.get(featureName) || [];
			for (const dep of deps) {
				checkCircular(dep, [...path, featureName]);
			}

			visiting.delete(featureName);
			visited.add(featureName);
		};

		for (const featureName of this.features.keys()) {
			checkCircular(featureName, []);
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	// Error tracking
	private setupErrorTracking(feature: Feature): void {
		// Cette méthode sera appelée par l'EventBus quand une feature émet une erreur
		// On ne peut pas directement écouter ici car on créerait une dépendance circulaire
		// L'événement sera capturé par le FeatureManager
	}

	// Called by FeatureManager when an error occurs
	recordError(error: FeatureError): void {
		this.errors.push(error);

		// Keep only last 100 errors to prevent memory leaks
		if (this.errors.length > 100) {
			this.errors.splice(0, this.errors.length - 100);
		}

		logger.debug(
			`Recorded error for feature ${error.featureName}: ${error.error.message}`,
		);
	}

	// Get error statistics
	getErrorStats(): {
		totalErrors: number;
		errorsByFeature: Record<string, number>;
		recentErrors: readonly FeatureError[];
	} {
		const errorsByFeature: Record<string, number> = {};

		for (const error of this.errors) {
			errorsByFeature[error.featureName] =
				(errorsByFeature[error.featureName] || 0) + 1;
		}

		// Recent errors from last 5 minutes
		const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
		const recentErrors = this.errors.filter(
			(error) => error.timestamp > fiveMinutesAgo,
		);

		return {
			totalErrors: this.errors.length,
			errorsByFeature,
			recentErrors,
		};
	}

	// Clear errors for a specific feature
	clearFeatureErrors(featureName: string): void {
		const beforeCount = this.errors.length;
		for (let i = this.errors.length - 1; i >= 0; i--) {
			if (this.errors[i]?.featureName === featureName) {
				this.errors.splice(i, 1);
			}
		}

		const removedCount = beforeCount - this.errors.length;
		if (removedCount > 0) {
			logger.debug(`Cleared ${removedCount} errors for feature ${featureName}`);
		}
	}

	// Clear all errors
	clearAllErrors(): void {
		const count = this.errors.length;
		this.errors.length = 0;

		if (count > 0) {
			logger.debug(`Cleared all ${count} errors`);
		}
	}

	// Get healthy features (not in error state)
	getHealthyFeatures(): readonly Feature[] {
		return this.getAll().filter(
			(feature) => feature.state !== "error" && feature.state !== "disabled",
		);
	}

	// Get problematic features
	getProblematicFeatures(): readonly Feature[] {
		return this.getAll().filter(
			(feature) =>
				feature.state === "error" ||
				feature.state === "disabled" ||
				feature.state === "fallback",
		);
	}
}

// Singleton instance
export const featureRegistry = new ChromeFlexFeatureRegistry();

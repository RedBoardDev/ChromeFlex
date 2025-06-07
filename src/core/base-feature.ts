import type {
	ErrorRecoveryStrategy,
	Feature,
	FeatureConfig,
	FeatureConfigInput,
	FeatureContext,
	FeatureError,
	FeatureState,
	URLMatcher,
} from "@/types";
import { FeatureState as State } from "@/types";
import { createFeatureLogger } from "@/utils/logger";
import { eventBus } from "./event-bus";

export abstract class BaseFeature implements Feature {
	public readonly name: string;
	public readonly config: FeatureConfig;

	private _state: FeatureState = State.IDLE;
	private _lastError: FeatureError | undefined;
	private _retryCount = 0;

	protected readonly logger: ReturnType<typeof createFeatureLogger>;
	protected readonly eventBus = eventBus;
	protected readonly elements = new Map<string, Element>();
	protected readonly timers = new Set<number>();
	protected readonly intervals = new Set<number>();
	protected readonly cleanupTasks = new Set<() => void>();

	// Default error recovery strategy
	private readonly errorRecovery: ErrorRecoveryStrategy;

	constructor(inputConfig: FeatureConfigInput) {
		this.name = inputConfig.name;

		// Normalize input config to full config, ensuring URLMatcher compatibility
		this.config = {
			...inputConfig,
			matches: inputConfig.matches as readonly URLMatcher[],
			enabled: inputConfig.enabled ?? true,
			priority: inputConfig.priority ?? 0,
			errorRecovery: {
				maxRetries: 3,
				retryDelay: 1000,
				fallbackMode: true,
				...inputConfig.errorRecovery,
			},
		};

		// Set up error recovery
		this.errorRecovery = {
			maxRetries: 3,
			retryDelay: 1000,
			fallbackMode: true,
			...this.config.errorRecovery,
		};

		this.logger = createFeatureLogger(this.config.name);

		// Set up error boundary
		this.setupErrorBoundary();
	}

	public get state(): FeatureState {
		return this._state;
	}

	public get lastError(): FeatureError | undefined {
		return this._lastError;
	}

	public get retryCount(): number {
		return this._retryCount;
	}

	public canRetry(): boolean {
		return this._retryCount < this.errorRecovery.maxRetries;
	}

	public reset(): void {
		this._retryCount = 0;
		this._lastError = undefined;
		if (this._state === State.ERROR) {
			this.setState(State.IDLE);
		}
	}

	private setState(newState: FeatureState): void {
		const oldState = this._state;
		this._state = newState;

		this.eventBus.emit(
			"feature:state-changed",
			{
				feature: this.name,
				oldState,
				newState,
				retryCount: this._retryCount,
				lastError: this._lastError,
			},
			this.name,
		);

		this.logger.debug(`State changed: ${oldState} -> ${newState}`);
	}

	public handleError(error: Error, phase: string): void {
		const featureError: FeatureError = {
			featureName: this.name,
			phase: phase as FeatureError["phase"],
			error,
			timestamp: Date.now(),
			context: {
				url: window.location.href,
				userAgent: navigator.userAgent,
			},
		};

		this._lastError = featureError;
		this._retryCount++;

		// Log error with context
		this.logger.error(
			`Error in ${phase} (attempt ${this._retryCount}/${this.errorRecovery.maxRetries}):`,
			error,
		);

		// Emit error event
		this.eventBus.emit(
			"feature:error",
			{
				feature: this.name,
				error: featureError,
				canRetry: this.canRetry(),
			},
			this.name,
		);

		// Set error state
		this.setState(State.ERROR);

		// Attempt recovery if possible
		if (this.canRetry()) {
			this.scheduleRetry(phase);
		} else if (this.errorRecovery.fallbackMode) {
			this.enterFallbackMode();
		} else {
			this.setState(State.DISABLED);
		}
	}

	private scheduleRetry(phase: string): void {
		const delay = this.errorRecovery.retryDelay * this._retryCount; // Exponential backoff

		this.logger.info(`Scheduling retry in ${delay}ms`);

		const timerId = window.setTimeout(async () => {
			this.timers.delete(timerId);

			try {
				switch (phase) {
					case "init":
						await this.init(this.createCurrentContext());
						break;
					case "start":
						await this.start(this.createCurrentContext());
						break;
					// stop et destroy ne sont généralement pas retry
				}
			} catch (error) {
				// L'erreur sera gérée par le wrapper safe
				this.logger.warn("Retry failed, will try again if possible");
			}
		}, delay);

		this.timers.add(timerId);
	}

	private enterFallbackMode(): void {
		this.setState(State.FALLBACK);
		this.logger.warn("Entering fallback mode");

		// Nettoyage de sécurité
		this.safeCleanup();

		// Mode fallback basique : juste logger que la feature est en fallback
		this.eventBus.emit(
			"feature:fallback",
			{
				feature: this.name,
				reason: "max_retries_exceeded",
			},
			this.name,
		);
	}

	private setupErrorBoundary(): void {
		// Note: L'error boundary sera principalement géré via les wrappers safe des méthodes lifecycle
		// et les méthodes protégées setTimeout/setInterval
	}

	// Protected timer methods with error boundaries
	protected setTimeout(callback: () => void, delay: number): number {
		const wrappedCallback = () => {
			try {
				callback();
			} catch (error) {
				this.handleError(error as Error, "timer");
			}
		};

		const timerId = window.setTimeout(wrappedCallback, delay);
		this.timers.add(timerId);
		return timerId;
	}

	protected setInterval(callback: () => void, delay: number): number {
		const wrappedCallback = () => {
			try {
				callback();
			} catch (error) {
				this.handleError(error as Error, "interval");
			}
		};

		const intervalId = window.setInterval(wrappedCallback, delay);
		this.intervals.add(intervalId);
		return intervalId;
	}

	// Wrappers safe pour les méthodes lifecycle
	public async init(context: FeatureContext): Promise<void> {
		if (this._state !== State.IDLE && this._state !== State.ERROR) {
			this.logger.warn(`Cannot init feature in state ${this._state}`);
			return;
		}

		return this.safeExecute("init", async () => {
			this.setState(State.INITIALIZING);
			await this.onInit(context);
			this.setState(State.INITIALIZED);
			this.logger.info("Feature initialized successfully");
			this._retryCount = 0; // Reset retry count on success
		});
	}

	public async start(context: FeatureContext): Promise<void> {
		if (
			this._state !== State.INITIALIZED &&
			this._state !== State.STOPPED &&
			this._state !== State.ERROR
		) {
			this.logger.warn(`Cannot start feature in state ${this._state}`);
			return;
		}

		return this.safeExecute("start", async () => {
			this.setState(State.STARTING);
			await this.onStart(context);
			this.setState(State.RUNNING);
			this.logger.info("Feature started successfully");
			this._retryCount = 0; // Reset retry count on success
		});
	}

	public async stop(): Promise<void> {
		if (this._state !== State.RUNNING && this._state !== State.ERROR) {
			this.logger.warn(`Cannot stop feature in state ${this._state}`);
			return;
		}

		return this.safeExecute("stop", async () => {
			this.setState(State.STOPPING);
			await this.onStop();
			this.setState(State.STOPPED);
			this.logger.info("Feature stopped successfully");
		});
	}

	public async destroy(): Promise<void> {
		return this.safeExecute("destroy", async () => {
			try {
				if (this._state === State.RUNNING) {
					await this.stop();
				}

				await this.onDestroy();
				this.safeCleanup();
				this.setState(State.IDLE);
				this.logger.info("Feature destroyed successfully");
			} catch (error) {
				// Même si destroy échoue, on fait le cleanup
				this.safeCleanup();
				throw error;
			}
		});
	}

	private async safeExecute(
		phase: string,
		operation: () => Promise<void>,
	): Promise<void> {
		try {
			await operation();
		} catch (error) {
			this.handleError(error as Error, phase);
			throw error; // Re-throw pour que l'appelant sache qu'il y a eu une erreur
		}
	}

	private safeCleanup(): void {
		try {
			// Cleanup timers
			for (const timerId of this.timers) {
				clearTimeout(timerId);
			}
			this.timers.clear();

			// Cleanup intervals
			for (const intervalId of this.intervals) {
				clearInterval(intervalId);
			}
			this.intervals.clear();

			// Cleanup DOM elements
			for (const [key, element] of this.elements) {
				try {
					element.remove();
				} catch (error) {
					this.logger.warn(`Failed to remove element ${key}:`, error);
				}
			}
			this.elements.clear();

			// Run custom cleanup tasks
			for (const cleanup of this.cleanupTasks) {
				try {
					cleanup();
				} catch (error) {
					this.logger.warn("Cleanup task failed:", error);
				}
			}
			this.cleanupTasks.clear();
		} catch (error) {
			this.logger.error("Error during safe cleanup:", error);
		}
	}

	public shouldActivate(context: FeatureContext): boolean {
		if (!this.config.enabled) {
			return false;
		}

		// Ne pas activer si la feature est en erreur et ne peut pas retry
		if (this._state === State.ERROR && !this.canRetry()) {
			return false;
		}

		// Ne pas activer si disabled
		if (this._state === State.DISABLED) {
			return false;
		}

		// Check custom activation condition
		if (this.config.shouldActivate) {
			try {
				return this.config.shouldActivate(context);
			} catch (error) {
				this.logger.warn("Error in shouldActivate:", error);
				return false;
			}
		}

		// Enhanced URL matching
		return this.config.matches.some((matcher) => {
			try {
				if (typeof matcher === "string") {
					const regex = new RegExp(matcher.replace(/\*/g, ".*"));
					return regex.test(context.url);
				}
				if (matcher instanceof RegExp) {
					return matcher.test(context.url);
				}
				if (typeof matcher === "function") {
					return matcher(context.url, context);
				}
				return false;
			} catch (error) {
				this.logger.warn("Error in URL matching:", error);
				return false;
			}
		});
	}

	private createCurrentContext(): FeatureContext {
		return {
			url: window.location.href,
			document: document,
			userAgent: navigator.userAgent,
			timestamp: Date.now(),
		};
	}

	// Abstract methods to be implemented by subclasses
	protected abstract onInit(context: FeatureContext): Promise<void> | void;
	protected abstract onStart(context: FeatureContext): Promise<void> | void;
	protected abstract onStop(): Promise<void> | void;
	protected abstract onDestroy(): Promise<void> | void;

	// Utility methods for subclasses
	protected emitEvent<T extends Record<string, unknown>>(
		type: string,
		payload: T,
	): void {
		try {
			this.eventBus.emit(type, payload, this.name);
		} catch (error) {
			this.logger.warn("Failed to emit event:", error);
		}
	}

	protected onEvent<T extends Record<string, unknown>>(
		type: string,
		listener: (event: { payload: T }) => void | Promise<void>,
	): () => void {
		try {
			const unsubscribe = this.eventBus.on(type, listener);
			this.cleanupTasks.add(unsubscribe);
			return unsubscribe;
		} catch (error) {
			this.logger.warn("Failed to setup event listener:", error);
			return () => {}; // Return no-op function
		}
	}

	// Helper methods pour le développement facile
	protected addElement(key: string, element: Element): void {
		this.elements.set(key, element);
	}

	protected getElement(key: string): Element | undefined {
		return this.elements.get(key);
	}

	protected removeElement(key: string): boolean {
		const element = this.elements.get(key);
		if (element) {
			element.remove();
			this.elements.delete(key);
			return true;
		}
		return false;
	}

	protected addCleanupTask(task: () => void): void {
		this.cleanupTasks.add(task);
	}
}

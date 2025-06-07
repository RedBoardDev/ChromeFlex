// Core types
export interface FeatureContext {
	readonly url: string;
	readonly document: Document;
	readonly userAgent: string;
	readonly timestamp: number;
}

// Error handling types
export interface FeatureError {
	readonly featureName: string;
	readonly phase: "init" | "start" | "stop" | "destroy";
	readonly error: Error;
	readonly timestamp: number;
	readonly context?: Partial<FeatureContext>;
}

export interface ErrorRecoveryStrategy {
	readonly maxRetries: number;
	readonly retryDelay: number;
	readonly fallbackMode: boolean;
}

// Enhanced URL matching types
export type URLMatcher =
	| string
	| RegExp
	| ((url: string, context: FeatureContext) => boolean);

export interface FeatureConfig {
	readonly name: string;
	readonly matches: readonly URLMatcher[];
	readonly priority?: number;
	readonly enabled?: boolean;
	readonly dependencies?: readonly string[];
	readonly shouldActivate?: (context: FeatureContext) => boolean;
	readonly errorRecovery?: Partial<ErrorRecoveryStrategy>;
	readonly settings?: Record<string, unknown>;
}

export interface Feature {
	readonly name: string;
	readonly config: FeatureConfig;
	readonly state: FeatureState;
	readonly lastError: FeatureError | undefined;
	readonly retryCount: number;

	init(context: FeatureContext): Promise<void> | void;
	start(context: FeatureContext): Promise<void> | void;
	stop(): Promise<void> | void;
	destroy(): Promise<void> | void;
	shouldActivate(context: FeatureContext): boolean;

	// Error handling
	handleError(error: Error, phase: string): void;
	canRetry(): boolean;
	reset(): void;
}

export enum FeatureState {
	IDLE = "idle",
	INITIALIZING = "initializing",
	INITIALIZED = "initialized",
	STARTING = "starting",
	RUNNING = "running",
	STOPPING = "stopping",
	STOPPED = "stopped",
	ERROR = "error",
	DISABLED = "disabled",
	FALLBACK = "fallback",
}

// Event system types
export interface EventPayload {
	readonly [key: string]: unknown;
}

export interface ChromeFlexEvent<T extends EventPayload = EventPayload> {
	readonly type: string;
	readonly payload: T;
	readonly timestamp: number;
	readonly source: string;
}

export type EventListener<T extends EventPayload = EventPayload> = (
	event: ChromeFlexEvent<T>,
) => Promise<void> | void;

export interface EventBus {
	emit<T extends EventPayload>(type: string, payload: T, source?: string): void;
	on<T extends EventPayload>(
		type: string,
		listener: EventListener<T>,
	): () => void;
	off<T extends EventPayload>(type: string, listener: EventListener<T>): void;
	once<T extends EventPayload>(type: string, listener: EventListener<T>): void;
}

// Registry types
export interface FeatureRegistry {
	register(feature: Feature): void;
	unregister(name: string): void;
	get(name: string): Feature | undefined;
	getAll(): readonly Feature[];
	getByState(state: FeatureState): readonly Feature[];
	getErrors(): readonly FeatureError[];
}

// Logger types
export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export interface Logger {
	debug(message: string, ...args: unknown[]): void;
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
}

// Utility types
export type URLPattern = string;
export type Selector = string;

export interface DOMUtilOptions {
	timeout?: number;
	retries?: number;
}

// Helper types for easier development - developer-friendly input types
export type SafePartial<T> = {
	[P in keyof T]?: T[P] extends object ? SafePartial<T[P]> : T[P];
};

// Simplified input type for feature creation that's developer-friendly
export interface FeatureConfigInput {
	readonly name: string;
	readonly matches: readonly (string | RegExp)[];
	readonly priority?: number;
	readonly enabled?: boolean;
	readonly dependencies?: readonly string[];
	readonly shouldActivate?: (context: FeatureContext) => boolean;
	readonly errorRecovery?: {
		readonly maxRetries?: number;
		readonly retryDelay?: number;
		readonly fallbackMode?: boolean;
	};
	readonly settings?: Record<string, unknown>;
}

// Type helpers for feature development
export type AsyncOrSync<T> = T | Promise<T>;
export type FeatureLifecycleMethod<T = void> = () => AsyncOrSync<T>;
export type FeatureInitMethod = (context: FeatureContext) => AsyncOrSync<void>;

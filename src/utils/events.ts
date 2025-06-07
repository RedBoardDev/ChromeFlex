// Enhanced event utilities with proper typing and cleanup
export type EventCallback<T extends Event = Event> = (
	event: T,
) => void | Promise<void>;

export interface EventListenerOptions {
	readonly once?: boolean;
	readonly passive?: boolean;
	readonly capture?: boolean;
	readonly signal?: AbortSignal;
}

// Debounce function with proper typing
export function debounce<T extends readonly unknown[]>(
	fn: (...args: T) => void,
	delay: number,
): (...args: T) => void {
	let timeoutId: number | undefined;

	return (...args: T): void => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}

		timeoutId = window.setTimeout(() => {
			fn(...args);
		}, delay);
	};
}

// Throttle function with proper typing
export function throttle<T extends readonly unknown[]>(
	fn: (...args: T) => void,
	limit: number,
): (...args: T) => void {
	let inThrottle = false;

	return (...args: T): void => {
		if (!inThrottle) {
			fn(...args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}

// Enhanced event listener management
export class EventManager {
	private readonly listeners = new Map<
		Element | Window | Document,
		Map<string, Set<EventCallback>>
	>();
	private readonly abortController = new AbortController();

	addEventListener<K extends keyof HTMLElementEventMap>(
		target: HTMLElement,
		type: K,
		callback: EventCallback<HTMLElementEventMap[K]>,
		options?: EventListenerOptions,
	): () => void;
	addEventListener<K extends keyof WindowEventMap>(
		target: Window,
		type: K,
		callback: EventCallback<WindowEventMap[K]>,
		options?: EventListenerOptions,
	): () => void;
	addEventListener<K extends keyof DocumentEventMap>(
		target: Document,
		type: K,
		callback: EventCallback<DocumentEventMap[K]>,
		options?: EventListenerOptions,
	): () => void;
	addEventListener(
		target: Element | Window | Document,
		type: string,
		callback: EventCallback,
		options: EventListenerOptions = {},
	): () => void {
		const fullOptions: AddEventListenerOptions = {
			...options,
			signal: options.signal || this.abortController.signal,
		};

		target.addEventListener(type, callback as EventListener, fullOptions);

		// Track the listener for cleanup
		this.trackListener(target, type, callback);

		// Return cleanup function
		return () => {
			target.removeEventListener(type, callback as EventListener, fullOptions);
			this.untrackListener(target, type, callback);
		};
	}

	removeEventListener(
		target: Element | Window | Document,
		type: string,
		callback: EventCallback,
	): void {
		target.removeEventListener(type, callback as EventListener);
		this.untrackListener(target, type, callback);
	}

	// Remove all listeners for a target
	removeAllListeners(target: Element | Window | Document): void {
		const targetListeners = this.listeners.get(target);
		if (targetListeners) {
			for (const [type, callbacks] of targetListeners) {
				for (const callback of callbacks) {
					target.removeEventListener(type, callback as EventListener);
				}
			}
			this.listeners.delete(target);
		}
	}

	// Remove all listeners managed by this instance
	cleanup(): void {
		this.abortController.abort();
		this.listeners.clear();
	}

	private trackListener(
		target: Element | Window | Document,
		type: string,
		callback: EventCallback,
	): void {
		if (!this.listeners.has(target)) {
			this.listeners.set(target, new Map());
		}

		const targetListeners = this.listeners.get(target);
		if (!targetListeners) return;
		if (!targetListeners.has(type)) {
			targetListeners.set(type, new Set());
		}

		targetListeners.get(type)?.add(callback);
	}

	private untrackListener(
		target: Element | Window | Document,
		type: string,
		callback: EventCallback,
	): void {
		const targetListeners = this.listeners.get(target);
		if (targetListeners) {
			const typeListeners = targetListeners.get(type);
			if (typeListeners) {
				typeListeners.delete(callback);
				if (typeListeners.size === 0) {
					targetListeners.delete(type);
				}
			}
			if (targetListeners.size === 0) {
				this.listeners.delete(target);
			}
		}
	}
}

// Utility functions for common event patterns
export function onReady(callback: () => void): void {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", callback, { once: true });
	} else {
		// DOM is already ready
		callback();
	}
}

export function onLoad(callback: () => void): void {
	if (document.readyState === "complete") {
		callback();
	} else {
		window.addEventListener("load", callback, { once: true });
	}
}

// Wait for a specific event
export function waitForEvent<K extends keyof HTMLElementEventMap>(
	target: HTMLElement,
	type: K,
	timeout?: number,
): Promise<HTMLElementEventMap[K]>;
export function waitForEvent<K extends keyof WindowEventMap>(
	target: Window,
	type: K,
	timeout?: number,
): Promise<WindowEventMap[K]>;
export function waitForEvent<K extends keyof DocumentEventMap>(
	target: Document,
	type: K,
	timeout?: number,
): Promise<DocumentEventMap[K]>;
export function waitForEvent(
	target: Element | Window | Document,
	type: string,
	timeout?: number,
): Promise<Event> {
	return new Promise((resolve, reject) => {
		let timeoutId: number | undefined;

		const cleanup = (): void => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId);
			}
		};

		const listener = (event: Event): void => {
			cleanup();
			resolve(event);
		};

		target.addEventListener(type, listener, { once: true });

		if (timeout !== undefined) {
			timeoutId = window.setTimeout(() => {
				target.removeEventListener(type, listener);
				reject(new Error(`Event ${type} timeout after ${timeout}ms`));
			}, timeout);
		}
	});
}

// Custom event dispatch utility
export function dispatchCustomEvent<T = unknown>(
	target: Element | Window | Document,
	type: string,
	detail?: T,
	options: CustomEventInit = {},
): boolean {
	const event = new CustomEvent(type, {
		detail,
		bubbles: true,
		cancelable: true,
		...options,
	});

	return target.dispatchEvent(event);
}

// Mouse position tracking
export interface MousePosition {
	readonly x: number;
	readonly y: number;
}

export function trackMousePosition(): {
	readonly position: MousePosition;
	readonly cleanup: () => void;
} {
	let position: MousePosition = { x: 0, y: 0 };

	const updatePosition = (event: MouseEvent): void => {
		position = { x: event.clientX, y: event.clientY };
	};

	document.addEventListener("mousemove", updatePosition, { passive: true });

	return {
		get position() {
			return position;
		},
		cleanup: () => {
			document.removeEventListener("mousemove", updatePosition);
		},
	};
}

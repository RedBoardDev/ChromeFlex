import type {
	ChromeFlexEvent,
	EventBus,
	EventListener,
	EventPayload,
} from "@/types";

export class ChromeFlexEventBus implements EventBus {
	private readonly listeners = new Map<string, Set<EventListener>>();

	emit<T extends EventPayload>(
		type: string,
		payload: T,
		source = "unknown",
	): void {
		const event: ChromeFlexEvent<T> = {
			type,
			payload,
			timestamp: Date.now(),
			source,
		};

		const eventListeners = this.listeners.get(type);
		if (!eventListeners) return;

		// Execute listeners safely
		for (const listener of eventListeners) {
			try {
				const result = listener(event);
				// Handle async listeners
				if (result instanceof Promise) {
					result.catch((error) => {
						console.error(
							`[EventBus] Error in async listener for event ${type}:`,
							error,
						);
					});
				}
			} catch (error) {
				console.error(`[EventBus] Error in listener for event ${type}:`, error);
			}
		}
	}

	on<T extends EventPayload>(
		type: string,
		listener: EventListener<T>,
	): () => void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}

		const eventListeners = this.listeners.get(type);
		if (!eventListeners) return () => {};
		eventListeners.add(listener as EventListener);

		// Return unsubscribe function
		return () => {
			eventListeners.delete(listener as EventListener);
			if (eventListeners.size === 0) {
				this.listeners.delete(type);
			}
		};
	}

	off<T extends EventPayload>(type: string, listener: EventListener<T>): void {
		const eventListeners = this.listeners.get(type);
		if (eventListeners) {
			eventListeners.delete(listener as EventListener);
			if (eventListeners.size === 0) {
				this.listeners.delete(type);
			}
		}
	}

	once<T extends EventPayload>(type: string, listener: EventListener<T>): void {
		const onceListener: EventListener<T> = (event) => {
			this.off(type, onceListener);
			return listener(event);
		};
		this.on(type, onceListener);
	}

	// Utility methods
	getEventTypes(): readonly string[] {
		return Array.from(this.listeners.keys());
	}

	getListenerCount(type: string): number {
		return this.listeners.get(type)?.size ?? 0;
	}

	clear(): void {
		this.listeners.clear();
	}
}

// Singleton instance
export const eventBus = new ChromeFlexEventBus();

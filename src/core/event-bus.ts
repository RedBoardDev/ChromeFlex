import type {
	ChromeFlexEvent,
	EventBus,
	EventListener,
	EventPayload,
} from "@/types";
import { logger } from "@/utils/logger";

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
		if (!eventListeners || eventListeners.size === 0) return;

		// Execute listeners safely
		for (const listener of eventListeners) {
			try {
				const result = listener(event);
				if (result instanceof Promise) {
					result.catch((error) => {
						logger.error(`Async event listener error for ${type}:`, error);
					});
				}
			} catch (error) {
				logger.error(`Event listener error for ${type}:`, error);
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
		if (eventListeners) {
			eventListeners.add(listener as EventListener);
		}

		// Return unsubscribe function
		return () => {
			const listeners = this.listeners.get(type);
			if (listeners) {
				listeners.delete(listener as EventListener);
				if (listeners.size === 0) {
					this.listeners.delete(type);
				}
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

	clear(): void {
		this.listeners.clear();
	}

	getListenerCount(type: string): number {
		return this.listeners.get(type)?.size ?? 0;
	}
}

export const eventBus = new ChromeFlexEventBus();

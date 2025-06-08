import { z } from "zod";

// Chrome storage utilities with fallback to localStorage
export interface StorageOptions {
	readonly useLocal?: boolean;
	readonly ttl?: number; // Time to live in milliseconds
}

interface StorageData<T = unknown> {
	readonly value: T;
	readonly timestamp: number;
	readonly ttl?: number | undefined;
}

// Zod schema for storage data validation
const StorageDataSchema = z.object({
	value: z.unknown(),
	timestamp: z.number(),
	ttl: z.number().optional(),
});

export class ChromeFlexStorage {
	// Chrome storage (preferred)
	async set<T>(
		key: string,
		value: T,
		options: StorageOptions = {},
	): Promise<void> {
		const data: StorageData<T> = {
			value,
			timestamp: Date.now(),
			ttl: options.ttl,
		};

		if (options.useLocal || !chrome?.storage?.sync) {
			return this.setLocal(key, data);
		}

		try {
			await chrome.storage.sync.set({ [key]: data });
		} catch (error) {
			// Fallback to localStorage on Chrome storage failure
			return this.setLocal(key, data);
		}
	}

	async get<T>(
		key: string,
		defaultValue?: T,
		options: StorageOptions = {},
	): Promise<T | undefined> {
		if (options.useLocal || !chrome?.storage?.sync) {
			return this.getLocal(key, defaultValue);
		}

		try {
			const result = await chrome.storage.sync.get(key);
			const data = result[key] as StorageData<T> | undefined;

			if (!data) {
				return defaultValue;
			}

			// Check TTL
			if (data.ttl && Date.now() - data.timestamp > data.ttl) {
				await this.remove(key, options);
				return defaultValue;
			}

			return data.value;
		} catch (error) {
			// Fallback to localStorage on Chrome storage failure
			return this.getLocal(key, defaultValue);
		}
	}

	async remove(key: string, options: StorageOptions = {}): Promise<void> {
		if (options.useLocal || !chrome?.storage?.sync) {
			return this.removeLocal(key);
		}

		try {
			await chrome.storage.sync.remove(key);
		} catch (error) {
			// Fallback to localStorage on Chrome storage failure
			return this.removeLocal(key);
		}
	}

	async clear(options: StorageOptions = {}): Promise<void> {
		if (options.useLocal || !chrome?.storage?.sync) {
			return this.clearLocal();
		}

		try {
			await chrome.storage.sync.clear();
		} catch (error) {
			// Fallback to localStorage on Chrome storage failure
			return this.clearLocal();
		}
	}

	async getAll<T = unknown>(
		options: StorageOptions = {},
	): Promise<Record<string, T>> {
		if (options.useLocal || !chrome?.storage?.sync) {
			return this.getAllLocal();
		}

		try {
			const result = await chrome.storage.sync.get();
			const processed: Record<string, T> = {};

			for (const [key, data] of Object.entries(result)) {
				if (this.isValidStorageData(data)) {
					// Check TTL
					if (!data.ttl || Date.now() - data.timestamp <= data.ttl) {
						processed[key] = data.value as T;
					} else {
						// Remove expired item
						await this.remove(key, options);
					}
				}
			}

			return processed;
		} catch (error) {
			// Fallback to localStorage on Chrome storage failure
			return this.getAllLocal();
		}
	}

	// localStorage methods
	private setLocal<T>(key: string, data: StorageData<T>): void {
		try {
			localStorage.setItem(`chromeflex:${key}`, JSON.stringify(data));
		} catch (error) {
			throw new Error(`Failed to set localStorage item: ${error}`);
		}
	}

	private getLocal<T>(key: string, defaultValue?: T): T | undefined {
		try {
			const item = localStorage.getItem(`chromeflex:${key}`);
			if (!item) {
				return defaultValue;
			}

			const data = JSON.parse(item) as StorageData<T>;

			// Check TTL
			if (data.ttl && Date.now() - data.timestamp > data.ttl) {
				this.removeLocal(key);
				return defaultValue;
			}

			return data.value;
		} catch (error) {
			return defaultValue;
		}
	}

	private removeLocal(key: string): void {
		localStorage.removeItem(`chromeflex:${key}`);
	}

	private clearLocal(): void {
		const keys = Object.keys(localStorage).filter((key) =>
			key.startsWith("chromeflex:"),
		);
		for (const key of keys) {
			localStorage.removeItem(key);
		}
	}

	private getAllLocal<T = unknown>(): Record<string, T> {
		const result: Record<string, T> = {};
		const prefix = "chromeflex:";

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(prefix)) {
				const originalKey = key.slice(prefix.length);
				const value = this.getLocal(originalKey);
				if (value !== undefined) {
					result[originalKey] = value as T;
				}
			}
		}

		return result;
	}

	private isValidStorageData(data: unknown): data is StorageData {
		return StorageDataSchema.safeParse(data).success;
	}
}

// Singleton instance
export const storage = new ChromeFlexStorage();

// Convenience functions
export const setItem = storage.set.bind(storage);
export const getItem = storage.get.bind(storage);
export const removeItem = storage.remove.bind(storage);
export const clearStorage = storage.clear.bind(storage);

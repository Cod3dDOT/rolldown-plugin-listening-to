/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

export class Cache<T> {
	readonly #ttl: number;
	#memoryCache: T | null = null;
	#timestamp = 0;

	constructor(ttlMs: number) {
		this.#ttl = ttlMs;
	}

	#isValid(): boolean {
		return this.#memoryCache !== null && Date.now() - this.#timestamp < this.#ttl;
	}

	get(): T | null {
		return this.#isValid() ? this.#memoryCache : null;
	}

	set(data: T): void {
		this.#memoryCache = data;
		this.#timestamp = Date.now();
	}

	clear(): void {
		this.#memoryCache = null;
		this.#timestamp = 0;
	}
}

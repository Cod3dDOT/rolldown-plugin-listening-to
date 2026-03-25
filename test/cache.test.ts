/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// biome-ignore lint/correctness/noUnresolvedImports: bun built-in module
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Cache } from "../src/util/cache.ts";

describe("Cache", () => {
	let originalDateNow: () => number;
	let mockTime: number;

	beforeEach(() => {
		originalDateNow = Date.now;
		mockTime = 1_000_000_000_000;
		Date.now = () => mockTime;
	});

	afterEach(() => {
		Date.now = originalDateNow;
	});

	const advanceTime = (ms: number) => {
		mockTime += ms;
	};

	describe("get", () => {
		it("should return null when cache is empty", () => {
			const cache = new Cache<string>(5000);
			expect(cache.get()).toBeNull();
		});

		it("should return cached data within TTL", () => {
			const cache = new Cache<string>(5000);
			cache.set("test data");
			expect(cache.get()).toBe("test data");
		});

		it("should return cached data just before TTL expires", () => {
			const cache = new Cache<string>(5000);
			cache.set("test data");

			advanceTime(4999);
			expect(cache.get()).toBe("test data");
		});

		it("should return null after TTL expires", () => {
			const cache = new Cache<string>(5000);
			cache.set("test data");

			advanceTime(5001);
			expect(cache.get()).toBeNull();
		});

		it("should work with complex objects", () => {
			interface TestData {
				id: number;
				name: string;
				nested: { value: boolean };
			}

			const cache = new Cache<TestData>(5000);
			const data: TestData = {
				id: 1,
				name: "test",
				nested: { value: true }
			};

			cache.set(data);
			expect(cache.get()).toEqual(data);
		});
	});

	describe("set", () => {
		it("should store data", () => {
			const cache = new Cache<number>(5000);
			cache.set(42);
			expect(cache.get()).toBe(42);
		});

		it("should update existing data", () => {
			const cache = new Cache<string>(5000);
			cache.set("first");
			cache.set("second");
			expect(cache.get()).toBe("second");
		});

		it("should reset TTL when data is updated", () => {
			const cache = new Cache<string>(5000);
			cache.set("first");

			advanceTime(3000);
			cache.set("second");

			advanceTime(3000);
			expect(cache.get()).toBe("second");
		});
	});

	describe("clear", () => {
		it("should clear cached data", () => {
			const cache = new Cache<string>(5000);
			cache.set("test data");
			cache.clear();
			expect(cache.get()).toBeNull();
		});

		it("should reset timestamp", () => {
			const cache = new Cache<string>(5000);
			cache.set("test data");
			cache.clear();
			cache.set("new data");

			advanceTime(4999);
			expect(cache.get()).toBe("new data");
		});

		it("should be safe to call on empty cache", () => {
			const cache = new Cache<string>(5000);
			expect(() => cache.clear()).not.toThrow();
			expect(cache.get()).toBeNull();
		});
	});

	describe("TTL variations", () => {
		it("should work with very short TTL", () => {
			const cache = new Cache<string>(100);
			cache.set("test");

			advanceTime(99);
			expect(cache.get()).toBe("test");

			advanceTime(2);
			expect(cache.get()).toBeNull();
		});

		it("should work with very long TTL", () => {
			const cache = new Cache<string>(1_000_000);
			cache.set("test");

			advanceTime(999_999);
			expect(cache.get()).toBe("test");
		});
	});
});

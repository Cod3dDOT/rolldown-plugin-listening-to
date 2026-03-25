/*
 * SPDX-FileCopyrightText: 2025 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { MusicTrack } from "../src/types.ts";

// Create a mock module for fetchMusicTrack
const mockFetchMusicTrack = mock(() => Promise.resolve({} as MusicTrack));

// Mock the module
mock.module("../src/index.ts", () => ({
	fetchMusicTrack: mockFetchMusicTrack,
}));

import { createPlugin } from "../src/plugin.ts";

const mockTrack: MusicTrack = {
	title: "Test Song",
	artist: "Test Artist",
	album: "Test Album",
	albumCover: "data:image/webp;base64,test",
	services: {},
};

describe("createPlugin", () => {
	beforeEach(() => {
		mockFetchMusicTrack.mockReset();
	});

	describe("options validation", () => {
		it("should throw error when apiKey is missing", () => {
			expect(() =>
				createPlugin({ userId: "testuser", apiKey: "" }),
			).toThrow("API key and user ID must be specified");
		});

		it("should throw error when userId is missing", () => {
			expect(() =>
				createPlugin({ userId: "", apiKey: "testkey" }),
			).toThrow("API key and user ID must be specified");
		});

		it("should use default TTL when not provided", () => {
			expect(() =>
				createPlugin({ userId: "testuser", apiKey: "testkey" }),
			).not.toThrow();
		});

		it("should accept custom TTL", () => {
			expect(() =>
				createPlugin({
					userId: "testuser",
					apiKey: "testkey",
					cacheTTL: 10_000,
				}),
			).not.toThrow();
		});
	});

	describe("plugin metadata", () => {
		it("should have correct plugin name", () => {
			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			expect(plugin.name).toBe("vite-listening-to");
		});
	});

	describe("resolveId", () => {
		it("should resolve virtual module ID", () => {
			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			const result = plugin.resolveId?.(
				"virtual:vite-listening-to",
				"",
				{},
			);
			expect(result).toBe("\0virtual:vite-listening-to");
		});

		it("should return undefined for other IDs", () => {
			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			const result = plugin.resolveId?.("some-other-module", "", {});
			expect(result).toBeUndefined();
		});
	});

	describe("load", () => {
		it("should return undefined for non-virtual modules", async () => {
			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			const result = await plugin.load?.("\0some-other-module");
			expect(result).toBeUndefined();
		});

		it("should fetch and return track data on first load", async () => {
			mockFetchMusicTrack.mockResolvedValue(mockTrack);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			const result = await plugin.load?.("\0virtual:vite-listening-to");

			expect(mockFetchMusicTrack).toHaveBeenCalledWith(
				"testkey",
				"testuser",
			);
			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(1);
			expect(result).toContain("export const musicTrack");
			expect(result).toContain('"title":"Test Song"');
		});

		it("should use cached track on subsequent loads", async () => {
			mockFetchMusicTrack.mockResolvedValue(mockTrack);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});

			await plugin.load?.("\0virtual:vite-listening-to");
			await plugin.load?.("\0virtual:vite-listening-to");
			await plugin.load?.("\0virtual:vite-listening-to");

			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(1);
		});

		it("should export valid JavaScript", async () => {
			mockFetchMusicTrack.mockResolvedValue(mockTrack);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			const result = await plugin.load?.("\0virtual:vite-listening-to");

			expect(result).toMatch(
				/^export const musicTrack: MusicTrack = {.*};$/,
			);
		});

		it("should handle track with undefined albumCover", async () => {
			const trackWithoutCover = { ...mockTrack, albumCover: null };
			mockFetchMusicTrack.mockResolvedValue(trackWithoutCover);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			const result = await plugin.load?.("\0virtual:vite-listening-to");

			expect(result).toContain('"albumCover":null');
		});
	});

	describe("cache TTL behavior", () => {
		it("should refetch track after cache TTL expires", async () => {
			const shortTtl = 100; // 100ms
			mockFetchMusicTrack.mockResolvedValue(mockTrack);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
				cacheTTL: shortTtl,
			});

			// First load
			await plugin.load?.("\0virtual:vite-listening-to");
			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(1);

			// Wait for TTL to expire
			await new Promise((resolve) => setTimeout(resolve, shortTtl + 50));

			// Second load after TTL - should fetch again
			await plugin.load?.("\0virtual:vite-listening-to");
			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(2);
		});

		it("should use cache when TTL has not expired", async () => {
			const longTtl = 10_000;
			mockFetchMusicTrack.mockResolvedValue(mockTrack);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
				cacheTTL: longTtl,
			});

			await plugin.load?.("\0virtual:vite-listening-to");
			await plugin.load?.("\0virtual:vite-listening-to");

			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(1);
		});
	});

	describe("error handling", () => {
		it("should handle fetch errors gracefully", async () => {
			const error = new Error("API Error");
			mockFetchMusicTrack.mockRejectedValue(error);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});

			await expect(
				plugin.load?.("\0virtual:vite-listening-to"),
			).rejects.toThrow("API Error");
		});

		it("should not cache failed fetches", async () => {
			mockFetchMusicTrack
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce(mockTrack);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});

			// First call fails
			await expect(
				plugin.load?.("\0virtual:vite-listening-to"),
			).rejects.toThrow();

			// Second call should attempt fetch again (not use cached error)
			const result = await plugin.load?.("\0virtual:vite-listening-to");
			expect(result).toContain('"title":"Test Song"');
			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(2);
		});
	});

	describe("track data serialization", () => {
		it("should handle empty services object", async () => {
			mockFetchMusicTrack.mockResolvedValue(mockTrack);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});

			const result = await plugin.load?.("\0virtual:vite-listening-to");

			expect(result).toContain('"services":{}');
		});

		it("should serialize services data correctly", async () => {
			const trackWithServices = {
				...mockTrack,
				services: {
					spotify: "https://open.spotify.com/track/123",
					apple: "https://music.apple.com/track/456",
				},
			};
			mockFetchMusicTrack.mockResolvedValue(trackWithServices);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			const result = await plugin.load?.("\0virtual:vite-listening-to");

			expect(result).toContain(
				'"spotify":"https://open.spotify.com/track/123"',
			);
			expect(result).toContain(
				'"apple":"https://music.apple.com/track/456"',
			);
		});

		it("should handle special characters in track data", async () => {
			const trackWithSpecialChars = {
				...mockTrack,
				title: "Song with \"quotes\" and 'apostrophes'",
				artist: "Artist & The Band",
				album: "Album\nWith\tSpecial Chars",
			};
			mockFetchMusicTrack.mockResolvedValue(trackWithSpecialChars);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			const result = await plugin.load?.("\0virtual:vite-listening-to");

			// JSON.stringify should escape these properly
			expect(result).toContain('\\"quotes\\"');
			expect(result).toContain("&");
			expect(result).toContain("\\n");
		});

		it("should handle unicode characters", async () => {
			const trackWithUnicode = {
				...mockTrack,
				title: "Song 音楽 🎵",
				artist: "Артист",
			};
			mockFetchMusicTrack.mockResolvedValue(trackWithUnicode);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			const result = await plugin.load?.("\0virtual:vite-listening-to");

			expect(result).toBeDefined();
			expect(() =>
				JSON.parse(
					result!
						.replace("export const musicTrack: MusicTrack = ", "")
						.slice(0, -1),
				),
			).not.toThrow();
		});
	});

	describe("TypeScript type export", () => {
		it("should include MusicTrack type annotation", async () => {
			mockFetchMusicTrack.mockResolvedValue(mockTrack);

			const plugin = createPlugin({
				userId: "testuser",
				apiKey: "testkey",
			});
			const result = await plugin.load?.("\0virtual:vite-listening-to");

			expect(result).toContain("export const musicTrack: MusicTrack");
		});
	});

	describe("multiple plugin instances", () => {
		it("should maintain separate caches for different instances", async () => {
			const track1 = { ...mockTrack, title: "Song 1" };
			const track2 = { ...mockTrack, title: "Song 2" };

			mockFetchMusicTrack
				.mockResolvedValueOnce(track1)
				.mockResolvedValueOnce(track2);

			const plugin1 = createPlugin({ userId: "user1", apiKey: "key1" });
			const plugin2 = createPlugin({ userId: "user2", apiKey: "key2" });

			const result1 = await plugin1.load?.("\0virtual:vite-listening-to");
			const result2 = await plugin2.load?.("\0virtual:vite-listening-to");

			expect(result1).toContain('"title":"Song 1"');
			expect(result2).toContain('"title":"Song 2"');
			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(2);
		});
	});
});

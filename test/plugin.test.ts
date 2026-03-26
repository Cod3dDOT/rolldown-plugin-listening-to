/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// biome-ignore-all lint/complexity/noExcessiveLinesPerFunction: tests

// biome-ignore lint/correctness/noUnresolvedImports: bun built-in module
import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { MusicTrack } from "../src/types.d.ts";

const VIRTUAL_ID = "virtual:rolldown-plugin-listening-to";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockFetchMusicTrack = mock(() => Promise.resolve({} as MusicTrack));

mock.module("../src/api/index.ts", () => ({
	fetchMusicTrack: mockFetchMusicTrack
}));

// Minimal plugin context — only the hooks we actually call
const pluginContext = {
	error: mock((_msg: string): never => {
		throw new Error(_msg);
	}),
	warn: mock((_msg: string) => {})
	// biome-ignore lint/suspicious/noExplicitAny: again, its complicated
} as any;

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockTrack: MusicTrack = {
	album: "Test Album",
	albumCover: "data:image/webp;base64,test",
	artist: "Test Artist",
	services: {},
	title: "Test Song"
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { createPlugin } from "../src/plugin.ts";

function makePlugin(overrides: Partial<Parameters<typeof createPlugin>[0]> = {}) {
	return createPlugin({ apiKey: "testkey", userId: "testuser", ...overrides });
}

// biome-ignore lint/suspicious/noExplicitAny: its complicated
function matchesFilter(filter: any, id: string) {
	if (!filter) return true;

	if (filter.id instanceof RegExp) {
		return filter.id.test(id);
	}

	// fallback (future-proofing)
	if (typeof filter.id === "function") {
		return filter.id(id);
	}

	return true;
}

async function load(plugin: ReturnType<typeof makePlugin>, id: string) {
	const hook = plugin.load;

	if (!hook) return;

	// Vite-style
	if (typeof hook === "function") {
		return hook.call(pluginContext, id);
	}

	// Rolldown-style
	if (typeof hook === "object" && "handler" in hook) {
		if (!matchesFilter(hook.filter, id)) {
			return;
		}
		return hook.handler.call(pluginContext, id);
	}

	return;
}

function resolveId(plugin: ReturnType<typeof makePlugin>, id: string) {
	const hook = plugin.resolveId;

	if (!hook) return;

	// Vite-style
	if (typeof hook === "function") {
		return hook.call(pluginContext, id, "", { isEntry: false });
	}

	// Rolldown-style
	if (typeof hook === "object" && "handler" in hook) {
		if (!matchesFilter(hook.filter, id)) {
			return;
		}
		return hook.handler.call(pluginContext, id, "", { isEntry: false });
	}

	return;
}

function parseResult(result: string | undefined | null) {
	if (!result) return null;
	// Strip `export const musicTrack = ` prefix and trailing `;`
	const json = result.replace(/^export const musicTrack[^=]+=\s*/, "").replace(/;\s*$/, "");
	return JSON.parse(json) as MusicTrack;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("createPlugin", () => {
	beforeEach(() => {
		mockFetchMusicTrack.mockReset();
		pluginContext.warn.mockReset();
		pluginContext.error.mockReset();
	});

	// ── Options validation ───────────────────────────────────────────────────

	describe("options validation", () => {
		it("throws when apiKey is missing", () => {
			expect(() => createPlugin({ apiKey: "", userId: "testuser" })).toThrow(
				"API key and user ID must be specified"
			);
		});

		it("throws when userId is missing", () => {
			expect(() => createPlugin({ apiKey: "testkey", userId: "" })).toThrow(
				"API key and user ID must be specified"
			);
		});

		it("accepts valid options with default TTL", () => {
			expect(() => makePlugin()).not.toThrow();
		});

		it("accepts a custom cacheTTL", () => {
			expect(() => makePlugin({ cacheTTL: 10_000 })).not.toThrow();
		});
	});

	// ── Plugin metadata ──────────────────────────────────────────────────────

	describe("plugin metadata", () => {
		it("has the correct plugin name", () => {
			expect(makePlugin().name).toBe("rolldown-plugin-listening-to");
		});
	});

	// ── resolveId ────────────────────────────────────────────────────────────

	describe("resolveId", () => {
		it("resolves the virtual module ID", () => {
			expect(resolveId(makePlugin(), VIRTUAL_ID)).toBe(RESOLVED_ID);
		});

		it("returns undefined for unknown IDs", () => {
			expect(resolveId(makePlugin(), "some-other-module")).toBeUndefined();
		});
	});

	// ── load ─────────────────────────────────────────────────────────────────

	describe("load", () => {
		it("returns undefined for non-virtual modules", async () => {
			expect(await load(makePlugin(), "\0some-other-module")).toBeUndefined();
		});

		it("fetches track data on first load", async () => {
			mockFetchMusicTrack.mockResolvedValue(mockTrack);
			const plugin = makePlugin();

			await load(plugin, RESOLVED_ID);

			expect(mockFetchMusicTrack).toHaveBeenCalledWith("testkey", "testuser", expect.anything());
			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(1);
		});

		it("returns a valid ES module string", async () => {
			mockFetchMusicTrack.mockResolvedValue(mockTrack);
			const result = await load(makePlugin(), RESOLVED_ID);

			expect(result).toMatch(/^export const musicTrack/);
		});

		it("serializes the track correctly", async () => {
			mockFetchMusicTrack.mockResolvedValue(mockTrack);
			const result = await load(makePlugin(), RESOLVED_ID);
			const parsed = parseResult(result as string);

			expect(parsed).toEqual(mockTrack);
		});

		it("handles null albumCover", async () => {
			mockFetchMusicTrack.mockResolvedValue({ ...mockTrack, albumCover: null });
			const result = await load(makePlugin(), RESOLVED_ID);
			const parsed = parseResult(result as string);

			expect(parsed?.albumCover).toBeNull();
		});

		it("handles empty services", async () => {
			mockFetchMusicTrack.mockResolvedValue({ ...mockTrack, services: {} });
			const result = await load(makePlugin(), RESOLVED_ID);
			const parsed = parseResult(result as string);

			expect(parsed?.services).toEqual({});
		});

		it("serializes streaming service URLs correctly", async () => {
			const services = {
				apple: "https://music.apple.com/track/456",
				spotify: "https://open.spotify.com/track/123"
			};
			mockFetchMusicTrack.mockResolvedValue({ ...mockTrack, services });
			const result = await load(makePlugin(), RESOLVED_ID);
			const parsed = parseResult(result as string);

			expect(parsed?.services).toEqual(services);
		});

		it("safely round-trips special characters via JSON", async () => {
			const track = {
				...mockTrack,
				album: "Album\nWith\tSpecial Chars",
				artist: "Artist & The Band",
				title: `Song with "quotes" and 'apostrophes'`
			};
			mockFetchMusicTrack.mockResolvedValue(track);
			const result = await load(makePlugin(), RESOLVED_ID);
			const parsed = parseResult(result as string);

			expect(parsed).toEqual(track);
		});

		it("safely round-trips unicode characters", async () => {
			const track = { ...mockTrack, artist: "Артист", title: "Song 音楽 🎵" };
			mockFetchMusicTrack.mockResolvedValue(track);
			const result = await load(makePlugin(), RESOLVED_ID);
			const parsed = parseResult(result as string);

			expect(parsed).toEqual(track);
		});
	});

	// ── Caching ──────────────────────────────────────────────────────────────

	describe("caching", () => {
		it("uses cached track on subsequent loads", async () => {
			mockFetchMusicTrack.mockResolvedValue(mockTrack);
			const plugin = makePlugin();

			await load(plugin, RESOLVED_ID);
			await load(plugin, RESOLVED_ID);
			await load(plugin, RESOLVED_ID);

			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(1);
		});

		it("refetches after the TTL expires", async () => {
			mockFetchMusicTrack.mockResolvedValue(mockTrack);
			const plugin = makePlugin({ cacheTTL: 100 });

			await load(plugin, RESOLVED_ID);
			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(1);

			await new Promise((resolve) => setTimeout(resolve, 150));

			await load(plugin, RESOLVED_ID);
			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(2);
		});

		it("does not cache failed fetches", async () => {
			mockFetchMusicTrack
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce(mockTrack);

			const plugin = makePlugin();

			expect(load(plugin, RESOLVED_ID)).rejects.toThrow("Network error");

			const result = await load(plugin, RESOLVED_ID);
			expect(parseResult(result as string)).toEqual(mockTrack);
			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(2);
		});
	});

	// ── Multiple instances ───────────────────────────────────────────────────

	describe("multiple instances", () => {
		it("maintains separate caches per instance", async () => {
			const track1 = { ...mockTrack, title: "Song 1" };
			const track2 = { ...mockTrack, title: "Song 2" };
			mockFetchMusicTrack.mockResolvedValueOnce(track1).mockResolvedValueOnce(track2);

			const plugin1 = createPlugin({ apiKey: "key1", userId: "user1" });
			const plugin2 = createPlugin({ apiKey: "key2", userId: "user2" });

			const result1 = parseResult((await load(plugin1, RESOLVED_ID)) as string);
			const result2 = parseResult((await load(plugin2, RESOLVED_ID)) as string);

			expect(result1?.title).toBe("Song 1");
			expect(result2?.title).toBe("Song 2");
			expect(mockFetchMusicTrack).toHaveBeenCalledTimes(2);
		});
	});
});

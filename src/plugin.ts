/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

import type { Plugin } from "vite";
import { fetchMusicTrack } from "@/api/index.ts";
import type { LastFmPluginOptions, MusicTrack, ResolvedPluginOptions } from "@/types.d.ts";
import { Cache } from "@/util/cache.ts";

const VIRTUAL_MODULE_ID = "virtual:vite-listening-to";
const RESOLVED_ID = `\0${VIRTUAL_MODULE_ID}`;

const DEFAULT_OPTIONS: ResolvedPluginOptions = {
	apiKey: "",
	// biome-ignore lint/style/noMagicNumbers: 5 minutes
	cacheTTL: 5 * 60 * 1000,
	providers: ["musicbrainz", "openwhyd", "odesli"],
	userId: ""
} as const;

function resolveOptions(options: LastFmPluginOptions): ResolvedPluginOptions {
	if (!(options.apiKey && options.userId)) {
		throw new Error("API key and user ID must be specified");
	}

	return {
		...DEFAULT_OPTIONS,
		...options
	};
}

export function createPlugin(options: LastFmPluginOptions): Plugin {
	const resolvedOptions = resolveOptions(options);
	const cache = new Cache<MusicTrack>(resolvedOptions.cacheTTL);

	return {
		// Run during both dev (serve) and production builds.
		// The cache is intentionally shared across environments within a
		// single build process (Vite 6+ builds all environments in one
		// process), so we only need one cache instance per plugin invocation.
		apply: "build",

		buildStart() {
			cache.clear();
		},

		async load(id) {
			if (id !== RESOLVED_ID) {
				return;
			}

			let track = cache.get();

			if (track === null) {
				this.warn("LAST-FM-TRACK: fetching fresh Last.fm data");
				track = await fetchMusicTrack(resolvedOptions.apiKey, resolvedOptions.userId, {
					use: resolvedOptions.providers
				});
				if (track) {
					cache.set(track);
					this.warn(`LAST-FM-TRACK: cached track: ${track.title}`);
				} else {
					this.error("LAST-FM-TRACK: could not fetch track");
				}
			} else {
				this.warn(`LAST-FM-TRACK: using cached track: ${track.title}`);
			}

			// Emit a fully self-contained ES module. The MusicTrack type is
			// only needed at compile-time by the consumer; the runtime value
			// is a plain object that matches the shape.
			return [
				`/** @type {import("vite-listening-to").MusicTrack} */`,
				`export const musicTrack = ${JSON.stringify(track, null, 2)};`
			].join("\n");
		},
		name: "vite-listening-to",

		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_ID;
			}
		}
	};
}

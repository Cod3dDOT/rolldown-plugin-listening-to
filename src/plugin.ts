/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// biome-ignore lint/correctness/noUnresolvedImports: idk atp
import { exactRegex } from "@rolldown/pluginutils";
import type { Plugin } from "rolldown";
import { fetchMusicTrack } from "@/api/index.ts";
import type { LastFmPluginOptions, MusicTrack, ResolvedPluginOptions } from "@/types.d.ts";
import { Cache } from "@/util/cache.ts";

const VIRTUAL_MODULE_ID = "virtual:rolldown-plugin-listening-to";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

const DEFAULT_OPTIONS: ResolvedPluginOptions = {
	apiKey: "",
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
		buildStart() {
			cache.clear();
		},

		load: {
			filter: { id: exactRegex(RESOLVED_VIRTUAL_MODULE_ID) },
			async handler() {
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

				// Emit a fully self-contained ES module.
				return `export const musicTrack = ${JSON.stringify(track, null, 2)};`;
			}
		},
		name: "rolldown-plugin-listening-to",
		resolveId: {
			filter: { id: exactRegex(VIRTUAL_MODULE_ID) },
			handler() {
				return RESOLVED_VIRTUAL_MODULE_ID;
			}
		}
	};
}

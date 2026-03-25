/*
 * SPDX-FileCopyrightText: 2025 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// provider / service types

export type StreamingServiceProvider = "odesli" | "musicbrainz" | "openwhyd";

export interface StreamingServices {
	spotify?: string;
	apple?: string;
	deezer?: string;
	youtube?: string;
	tidal?: string;
	soundcloud?: string;
	bandcamp?: string;
}

// core data shape

export interface MusicTrack {
	title: string;
	artist: string;
	album: string;
	/** Base64 WebP data URI, or null when no cover art is available. */
	albumCover: string | null;
	services: StreamingServices;
}

// plugin configuration

export interface LastFmPluginOptions {
	userId: string;
	apiKey: string;
	/**
	 * Which streaming-service providers to query.
	 * @default ["musicbrainz", "openwhyd", "odesli"]
	 */
	providers?: StreamingServiceProvider[];
	/**
	 * How long to cache a fetched track result, in milliseconds.
	 * @default 300_000 (5 minutes)
	 */
	cacheTTL?: number;
}

/** @internal */
export interface ResolvedPluginOptions {
	userId: string;
	apiKey: string;
	providers: StreamingServiceProvider[];
	cacheTTL: number;
}

// virtual module ambient declaration
// Add this to your project's `env.d.ts` (or any `.d.ts` file included by
// your tsconfig) so TypeScript understands `import … from "virtual:vite-listening-to"`.
declare module "virtual:vite-listening-to" {
	const musicTrack: import("vite-listening-to").MusicTrack;
	export { musicTrack };
}

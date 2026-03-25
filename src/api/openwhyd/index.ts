/*
 * SPDX-FileCopyrightText: 2025 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// biome-ignore lint/performance/noNamespaceImport: preferred way
import * as z from "zod/mini";
import { fetchAndValidate } from "@/api/fetch.ts";
import type { StreamingServices } from "@/types.d.ts";

const OpenwhydTrackSchema = z.object({
	id: z.string(),
	name: z.string(),
	eId: z.string(),
	img: z.optional(z.string()),
	url: z.optional(z.url()),
});

const OpenwhydResponseSchema = z.object({
	results: z.object({
		posts: z.array(OpenwhydTrackSchema),
	}),
});

export async function openwhydStreamingServices(
	title: string,
	artist: string,
): Promise<StreamingServices> {
	const apiUrl = new URL("https://openwhyd.org/search");
	apiUrl.searchParams.set("q", `${artist} ${title}`);
	apiUrl.searchParams.set("format", "json");

	const data = await fetchAndValidate(apiUrl, OpenwhydResponseSchema);
	if (!data || data?.results?.posts?.length === 0) {
		return {};
	}

	const services: StreamingServices = {};

	for (const { eId } of data.results.posts) {
		// Spotify
		if (eId.startsWith("spotify:track:") && !services.spotify) {
			const id = eId.split(":")[2];
			services.spotify = `https://open.spotify.com/track/${id}`;
		}

		// YouTube
		if (eId.startsWith("/yt/") && !services.youtube) {
			const id = eId.slice(4);
			services.youtube = `https://www.youtube.com/watch?v=${id}`;
		}

		// Deezer
		if (eId.startsWith("/dz/") && !services.deezer) {
			const id = eId.slice(4);
			services.deezer = `https://www.deezer.com/track/${id}`;
		}

		// SoundCloud
		if (eId.startsWith("/sc/") && !services.soundcloud) {
			const id = eId.slice(4);
			services.soundcloud = `https://soundcloud.com/${id}`;
		}

		// Bandcamp
		if (eId.startsWith("/bc/") && !services.bandcamp) {
			const id = eId.slice(4);
			services.bandcamp = `https://bandcamp.com/${id}`;
		}
	}

	return services;
}

/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// biome-ignore lint/performance/noNamespaceImport: preferred way
import * as z from "zod/mini";
import { fetchAndValidate } from "@/api/fetch.ts";
import type { StreamingServices } from "@/types.d.ts";

const OdesliLinkSchema = z.object({
	entityUniqueId: z.string(),
	url: z.url()
});

const OdesliEntitySchema = z.object({
	apiProvider: z.string(),
	artistName: z.optional(z.string()),
	id: z.string(),
	platforms: z.array(z.string()),
	thumbnailUrl: z.optional(z.string()),
	title: z.optional(z.string()),
	type: z.string()
});

const OdesliResponseSchema = z.object({
	entitiesByUniqueId: z.record(z.string(), OdesliEntitySchema),
	entityUniqueId: z.string(),
	linksByPlatform: z.optional(z.record(z.string(), OdesliLinkSchema)),
	pageUrl: z.url(),
	userCountry: z.string()
});

export async function odesliStreamingServices(url: string): Promise<StreamingServices> {
	const apiUrl = new URL("https://api.song.link/v1-alpha.1/links");
	apiUrl.searchParams.set("url", url);

	const data = await fetchAndValidate(apiUrl, OdesliResponseSchema);
	if (!data?.linksByPlatform) {
		return {};
	}

	const { linksByPlatform } = data;

	// mapping between Odesli keys and StreamingServices
	const platformMap: Record<keyof StreamingServices, keyof typeof linksByPlatform> = {
		apple: "appleMusic",
		bandcamp: "bandcamp",
		deezer: "deezer",
		soundcloud: "soundcloud",
		spotify: "spotify",
		tidal: "tidal",
		youtube: "youtube"
	};

	const result: StreamingServices = Object.fromEntries(
		Object.entries(platformMap)
			.map(([serviceKey, odesliKey]) => {
				const link = linksByPlatform[odesliKey];
				return link ? [serviceKey, link.url] : null;
			})
			.filter(Boolean) as [keyof StreamingServices, string][]
	) as StreamingServices;

	return result;
}

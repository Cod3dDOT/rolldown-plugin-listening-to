/*
 * SPDX-FileCopyrightText: 2025 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// biome-ignore lint/performance/noNamespaceImport: preferred way
import * as z from "zod/mini";
import { fetchAndValidate } from "@/api/fetch.ts";
import type { StreamingServices } from "@/types.d.ts";

const OdesliLinkSchema = z.object({
	url: z.url(),
	entityUniqueId: z.string(),
});

const OdesliEntitySchema = z.object({
	id: z.string(),
	type: z.string(),
	title: z.optional(z.string()),
	artistName: z.optional(z.string()),
	thumbnailUrl: z.optional(z.string()),
	apiProvider: z.string(),
	platforms: z.array(z.string()),
});

const OdesliResponseSchema = z.object({
	entityUniqueId: z.string(),
	userCountry: z.string(),
	pageUrl: z.url(),
	linksByPlatform: z.optional(z.record(z.string(), OdesliLinkSchema)),
	entitiesByUniqueId: z.record(z.string(), OdesliEntitySchema),
});

export async function odesliStreamingServices(
	url: string,
): Promise<StreamingServices> {
	const apiUrl = new URL("https://api.song.link/v1-alpha.1/links");
	apiUrl.searchParams.set("url", url);

	const data = await fetchAndValidate(apiUrl, OdesliResponseSchema);
	if (!data?.linksByPlatform) {
		return {};
	}

	const { linksByPlatform } = data;

	// mapping between Odesli keys and StreamingServices
	const platformMap: Record<
		keyof StreamingServices,
		keyof typeof linksByPlatform
	> = {
		spotify: "spotify",
		apple: "appleMusic",
		deezer: "deezer",
		youtube: "youtube",
		tidal: "tidal",
		soundcloud: "soundcloud",
		bandcamp: "bandcamp",
	};

	const result: StreamingServices = Object.fromEntries(
		Object.entries(platformMap)
			.map(([serviceKey, odesliKey]) => {
				const link = linksByPlatform[odesliKey];
				return link ? [serviceKey, link.url] : null;
			})
			.filter(Boolean) as [keyof StreamingServices, string][],
	) as StreamingServices;

	return result;
}

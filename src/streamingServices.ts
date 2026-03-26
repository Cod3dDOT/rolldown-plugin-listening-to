/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

import { musicbrainzStreamingServices } from "@/api/musicbrainz/index.ts";
import { odesliStreamingServices } from "@/api/odesli/index.ts";
import { openwhydStreamingServices } from "@/api/openwhyd/index.ts";
import type { StreamingServiceProvider, StreamingServices } from "./types.d.ts";

/** Merge multiple partial StreamingServices objects into one. */
const mergeServices = (...sources: Partial<StreamingServices>[]): StreamingServices =>
	Object.assign({}, ...sources);

/**
 * Pick the best available URL to hand to Odesli for cross-platform lookup.
 * Preference order: Spotify → Apple Music → YouTube.
 */
const selectBestReference = (services: StreamingServices): string | undefined =>
	services.spotify ?? services.apple ?? services.youtube;

type ProviderFn = (...args: string[]) => Promise<StreamingServices>;

const PROVIDER_MAP: Record<StreamingServiceProvider, ProviderFn> = {
	musicbrainz: musicbrainzStreamingServices,
	odesli: odesliStreamingServices,
	openwhyd: openwhydStreamingServices
};

export interface GetStreamingServicesConfig {
	/** Which providers to query. Defaults to all three. */
	use?: StreamingServiceProvider[];
}

/**
 * Fetch streaming-service links for a track.
 *
 * Odesli is always run last because it needs a reference URL from one
 * of the other providers. Non-Odesli providers are queried in parallel.
 */
export async function getStreamingServices(
	title: string,
	album: string,
	artist: string,
	config: GetStreamingServicesConfig = {}
): Promise<StreamingServices> {
	const { use = ["musicbrainz", "openwhyd", "odesli"] } = config;

	const baseProviderKeys = use.filter(
		(p): p is Exclude<StreamingServiceProvider, "odesli"> => p in PROVIDER_MAP && p !== "odesli"
	);
	const includeOdesli = use.includes("odesli");

	// Non-Odesli providers can all run concurrently.
	const baseResults = await Promise.all(
		baseProviderKeys.map((p) => PROVIDER_MAP[p](title, album, artist))
	);
	const baseServices = mergeServices(...baseResults);

	if (!includeOdesli) {
		return baseServices;
	}

	const referenceUrl = selectBestReference(baseServices);
	if (!referenceUrl) {
		// No URL to hand to Odesli — return what we have.
		return baseServices;
	}

	const odesliServices = await PROVIDER_MAP.odesli(referenceUrl);
	return mergeServices(baseServices, odesliServices);
}

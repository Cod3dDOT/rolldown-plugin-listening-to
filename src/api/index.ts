/*
 * SPDX-FileCopyrightText: 2025 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

import { getLastSong } from "@/api/lastfm/index.ts";
import { getStreamingServices } from "@/streamingServices.ts";
import type { GetStreamingServicesConfig } from "@/streamingServices.ts";
import { processAlbumCover } from "@/util/thumbnail.ts";
import type { MusicTrack } from "@/types.d.ts";

export async function fetchMusicTrack(
	apiKey: string,
	userId: string,
	config: GetStreamingServicesConfig = {},
): Promise<MusicTrack | null> {
	const lastFmTrack = await getLastSong(apiKey, userId);

	if (!lastFmTrack.title && !lastFmTrack.artist) {
		return null;
	}

	const [streamingServices, albumCover] = await Promise.all([
		getStreamingServices(lastFmTrack.title, lastFmTrack.artist, config),
		processAlbumCover(lastFmTrack.albumCover),
	]);

	return {
		title: lastFmTrack.title,
		artist: lastFmTrack.artist,
		album: lastFmTrack.album,
		albumCover,
		services: streamingServices,
	};
}

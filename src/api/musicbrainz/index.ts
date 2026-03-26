/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// biome-ignore lint/performance/noNamespaceImport: preferred way
import * as z from "zod/mini";
import { fetchAndValidate } from "@/api/fetch.ts";
import type { StreamingServices } from "@/types.d.ts";

const makeTrackIdSchema = (key: string) =>
	z.array(z.object({ [key]: z.optional(z.array(z.string())) }));

const MusicBrainzSpotifySchema = makeTrackIdSchema("spotify_track_ids");
const MusicBrainzAppleSchema = makeTrackIdSchema("apple_music_track_ids");

type MusicBrainzStreamingServices = Pick<StreamingServices, "spotify" | "apple">;

export async function musicbrainzStreamingServices(
	title: string,
	album: string,
	artist: string
): Promise<MusicBrainzStreamingServices> {
	const params = new URLSearchParams({
		artist_name: artist,
		release_name: album,
		track_name: title
	});
	const base = "https://labs.api.listenbrainz.org";

	const spotifyUrl = new URL(`/spotify-id-from-metadata/json?${params}`, base);
	const appleUrl = new URL(`/apple-music-id-from-metadata/json?${params}`, base);

	const [spotifyRes, appleRes] = await Promise.all([
		fetchAndValidate(spotifyUrl, MusicBrainzSpotifySchema),
		fetchAndValidate(appleUrl, MusicBrainzAppleSchema)
	]);

	const spotifyId = spotifyRes?.[0]?.spotify_track_ids?.[0];
	const appleId = appleRes?.[0]?.apple_music_track_ids?.[0];

	return {
		apple: appleId ? `https://music.apple.com/us/song/${appleId}` : undefined,
		spotify: spotifyId ? `https://open.spotify.com/track/${spotifyId}` : undefined
	};
}

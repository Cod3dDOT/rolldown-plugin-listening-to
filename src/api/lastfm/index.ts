/*
 * SPDX-FileCopyrightText: 2025 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// biome-ignore lint/performance/noNamespaceImport: preferred way
import * as z from "zod/mini";
import { fetchAndValidate } from "@/api/fetch.ts";

const LastFmImageSchema = z.object({
	size: z.string(),
	"#text": z.string(),
});

const LastFmTrackSchema = z.object({
	mbid: z.string(),
	name: z.string(),
	artist: z.object({ "#text": z.string() }),
	image: z.array(LastFmImageSchema),
	album: z.object({ "#text": z.string() }),
});

const LastFmUserResponseSchema = z.object({
	recenttracks: z.object({
		track: z.array(LastFmTrackSchema),
	}),
});

export interface LastFmTrack {
	mbid: string;
	title: string;
	artist: string;
	album: string;
	albumCover?: string;
}

export const getLastSong = async (
	key: string,
	user: string,
): Promise<LastFmTrack> => {
	const params = new URLSearchParams({
		method: "user.getrecenttracks",
		user,
		api_key: key,
		format: "json",
	});
	const url = new URL("https://ws.audioscrobbler.com/2.0/");

	url.search = params.toString();

	const userResponse = await fetchAndValidate(url, LastFmUserResponseSchema);

	const emptyTrack: LastFmTrack = {
		mbid: "",
		title: "",
		album: "",
		artist: "",
		albumCover: undefined,
	};

	if (!userResponse || userResponse?.recenttracks?.track?.length === 0) {
		return emptyTrack;
	}

	const lastTrack = userResponse.recenttracks.track[0];

	if (!lastTrack) {
		return emptyTrack;
	}

	let thumbnail = lastTrack.image?.[0]?.["#text"] || undefined;

	// Filter out Last.fm placeholder image
	if (
		thumbnail ===
		"https://lastfm.freetls.fastly.net/i/u/34s/2a96cbd8b46e442fc41c2b86b821562f.png"
	) {
		thumbnail = undefined;
	}

	return {
		mbid: lastTrack.mbid,
		title: lastTrack.name,
		album: lastTrack.album["#text"],
		artist: lastTrack.artist["#text"],
		albumCover: thumbnail,
	};
};

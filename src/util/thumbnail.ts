/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

import sharp from "sharp";
import { arrayBufferToDataUri } from "./urlToDataUrl.ts";

/** Square size used for album cover thumbnails (pixels). */
const IMAGE_SIZE = 50;

/**
 * Downloads an album cover, resizes it to a small square thumbnail,
 * re-encodes it as WebP, and returns a base64 data URI.
 *
 * Returns `null` when no URL is provided or processing fails.
 */
export async function processAlbumCover(
	imageUrl: string | null | undefined
): Promise<string | null> {
	if (!imageUrl) {
		return null;
	}

	try {
		const response = await fetch(imageUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status} fetching album cover`);
		}
		const arrayBuffer = await response.arrayBuffer();

		const resized = await sharp(Buffer.from(arrayBuffer))
			.resize(IMAGE_SIZE, IMAGE_SIZE, { fit: "cover" })
			.webp()
			.toBuffer();

		return arrayBufferToDataUri(resized, "image/webp");
	} catch (error) {
		console.error("Failed to process album cover:", error);
		return null;
	}
}

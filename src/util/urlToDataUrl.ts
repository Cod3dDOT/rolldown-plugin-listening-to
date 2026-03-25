/*
 * SPDX-FileCopyrightText: 2025 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

export async function urlToDataUri(url: string): Promise<string> {
	const response = await fetch(url);
	const buffer = await response.arrayBuffer();
	const contentType =
		response.headers.get("content-type") ?? "application/octet-stream";
	return arrayBufferToDataUri(buffer, contentType);
}

/**
 * Converts an ArrayBuffer or Node Buffer to a base64 data URI.
 */
export function arrayBufferToDataUri(
	buffer: ArrayBuffer | Buffer,
	contentType: string,
): string {
	const bytes = new Uint8Array(
		buffer instanceof ArrayBuffer ? buffer : buffer.buffer,
	);

	// Build the binary string in 8 KB chunks to stay well within
	// the engine's maximum argument count for Function.prototype.apply.
	const CHUNK = 8192;
	let binary = "";
	for (let i = 0; i < bytes.length; i += CHUNK) {
		binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
	}

	return `data:${contentType};base64,${btoa(binary)}`;
}

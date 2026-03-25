/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// biome-ignore lint/performance/noNamespaceImport: preferred way
import * as z from "zod/mini";

z.config(z.locales.en());

/**
 * Fetches a URL, parses the JSON body, and validates it against `schema`.
 *
 * Returns `null` on any network error, non-2xx status, or schema
 * validation failure so callers can use a single null-check.
 */
export async function fetchAndValidate<T>(
	url: URL,
	schema: z.ZodMiniType<T>,
	init?: RequestInit
): Promise<T | null> {
	const href = url.toString();
	try {
		const res = await fetch(url, init);
		if (!res.ok) {
			console.error(`fetchAndValidate: HTTP ${res.status} for ${href}`);
			return null;
		}
		const data: unknown = await res.json();
		const parsed = schema.safeParse(data);
		if (!parsed.success) {
			console.error(`fetchAndValidate: invalid response for ${href}`, parsed.error);
			return null;
		}
		return parsed.data;
	} catch (err) {
		console.error(`fetchAndValidate: error fetching ${href}`, err);
		return null;
	}
}

/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

// biome-ignore lint/performance/noBarrelFile: library entry point, not an app barrel
export { createPlugin as RolldownPluginListeningTo } from "@/plugin.ts";
export type { GetStreamingServicesConfig } from "@/streamingServices.ts";
export type {
	LastFmPluginOptions,
	MusicTrack,
	StreamingServiceProvider,
	StreamingServices
} from "@/types.d.ts";

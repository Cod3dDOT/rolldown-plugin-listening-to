import { Plugin } from "vite";
import * as vite_listening_to0 from "vite-listening-to";

//#region src/types.d.ts
/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */
// provider / service types
type StreamingServiceProvider = "odesli" | "musicbrainz" | "openwhyd";
interface StreamingServices {
  spotify?: string;
  apple?: string;
  deezer?: string;
  youtube?: string;
  tidal?: string;
  soundcloud?: string;
  bandcamp?: string;
}
// core data shape
interface MusicTrack {
  title: string;
  artist: string;
  album: string;
  /** Base64 WebP data URI, or null when no cover art is available. */
  albumCover: string | null;
  services: StreamingServices;
}
// plugin configuration
interface LastFmPluginOptions {
  userId: string;
  apiKey: string;
  /**
   * Which streaming-service providers to query.
   * @default ["musicbrainz", "openwhyd", "odesli"]
   */
  providers?: StreamingServiceProvider[];
  /**
   * How long to cache a fetched track result, in milliseconds.
   * @default 300_000 (5 minutes)
   */
  cacheTTL?: number;
}
// virtual module ambient declaration
// Add this to your project's `env.d.ts` (or any `.d.ts` file included by
// your tsconfig) so TypeScript understands `import … from "virtual:vite-listening-to"`.
// biome-ignore lint/correctness/noUnresolvedImports: ambient virtual module declaration
declare module "virtual:vite-listening-to" {
  const musicTrack: vite_listening_to0.MusicTrack;
  export { musicTrack };
}
//#endregion
//#region src/plugin.d.ts
declare function createPlugin(options: LastFmPluginOptions): Plugin;
//#endregion
//#region src/streamingServices.d.ts
interface GetStreamingServicesConfig {
  /** Which providers to query. Defaults to all three. */
  use?: StreamingServiceProvider[];
}
//#endregion
export { type GetStreamingServicesConfig, type LastFmPluginOptions, type MusicTrack, type StreamingServiceProvider, type StreamingServices, createPlugin as ViteListeningTo };
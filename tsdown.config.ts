/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

import { defineConfig } from "tsdown";

// biome-ignore lint/style/noDefaultExport: required by tsdown
export default defineConfig({
	clean: true,
	deps: { neverBundle: ["sharp", "vite", "zod"] },
	dts: true,
	entry: "src/index.ts",
	exports: true,
	format: "esm",
	minify: true,
	outDir: "dist",
	root: "src",
	target: "node20"
});

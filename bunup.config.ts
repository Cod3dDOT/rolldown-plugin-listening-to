/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

import { defineConfig } from "bunup";

// biome-ignore lint/style/noDefaultExport: required by bunup
export default defineConfig({
	dts: {
		minify: true
	},
	entry: "src/index.ts",
	external: ["sharp", "vite", "zod"],
	format: "esm",
	minify: true,
	name: "node",
	outDir: "dist",
	report: {
		brotli: true
	},
	sourceBase: "./src",
	target: "node"
});

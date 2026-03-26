/*
 * SPDX-FileCopyrightText: 2026 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	deps: { neverBundle: ["sharp", "zod"] },
	dts: true,
	entry: "src/index.ts",
	format: "esm",
	minify: true,
	outDir: "dist",
	root: "src",
	target: "node20"
});

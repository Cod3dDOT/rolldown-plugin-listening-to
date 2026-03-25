import { defineConfig } from "bunup";

export default defineConfig({
	entry: "src/index.ts",
	sourceBase: "./src",
	outDir: "dist",
	name: "node",
	format: "esm",
	target: "node",
	minify: true,
	external: ["sharp", "vite", "zod"],
	report: {
		brotli: true,
	},
	dts: {
		minify: true,
	},
});

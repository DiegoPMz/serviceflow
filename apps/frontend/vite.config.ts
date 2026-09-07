import path from "node:path";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: [
				"favicon.ico",
				"apple-touch-icon.png",
				"maskable-icon.png",
			],
			manifest: {
				name: "ServiceFlow",
				short_name: "ServiceFlow",
				description:
					"Consola técnica de alta densidad para la gestión y seguimiento de órdenes de servicio en campo para Daicomcopy.",
				lang: "es",
				theme_color: "oklch(0.145 0 0)",
				background_color: "oklch(0.145 0 0)",
				orientation: "portrait",
				icons: [
					{
						src: "pwa-64x64.png",
						sizes: "64x64",
						type: "image/png",
					},
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "maskable-icon-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
		}),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		babel({ presets: [reactCompilerPreset()] }),
	],

	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});

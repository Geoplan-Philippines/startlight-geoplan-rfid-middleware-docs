// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	redirects: {
		'/contract/product-endpoint': '/contract/source-data',
	},
	integrations: [
		starlight({
			title: 'Geoplan RFID Middleware',
			description: 'ETP POS and Samooha master-data integration reference for the Geoplan RFID middleware.',
			tagline: 'Provider master-data integration reference',
			logo: {
				src: './src/assets/geoplan-logo.png',
				alt: 'Geoplan',
			},
			favicon: '/favicon.png',
			lastUpdated: true,
			credits: false,
			sidebar: [
				{
					label: 'Start here',
					items: [{ label: 'Overview', link: '/' }],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'ETP POS', slug: 'etp-pos', badge: { text: 'Draft', variant: 'caution' } },
						{ label: 'Samooha', slug: 'samooha', badge: { text: 'Draft', variant: 'caution' } },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Source access & limits', slug: 'contract/access' },
						{ label: 'Source data intake', slug: 'contract/source-data' },
					],
				},
			],
		}),
	],
});

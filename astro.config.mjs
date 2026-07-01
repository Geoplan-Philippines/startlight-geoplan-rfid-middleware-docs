// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	redirects: {
		'/contract/product-endpoint': '/master-data-sync',
		'/contract/source-data': '/master-data-sync',
		'/contract/access': '/master-data-sync',
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
					items: [
						{ label: 'Overview', link: '/' },
						{ label: 'Authentication', slug: 'authentication' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Master Data Sync', slug: 'master-data-sync' },
						{ label: 'Exception handling', slug: 'exceptions' },
						{ label: 'EPC Scan Processing', slug: 'epc-scan-processing' }
					],
				},
				{
					label: 'Providers',
					items: [
						{ label: 'ETP POS', slug: 'etp-pos' },
						{ label: 'Samooha', slug: 'samooha' },
					],
				},
			],
		}),
	],
});

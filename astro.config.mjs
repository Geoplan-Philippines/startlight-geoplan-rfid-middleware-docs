// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Geoplan RFID Middleware',
			description: 'ETP POS and Samooha RFID scan integration reference for the Geoplan middleware.',
			tagline: 'RFID scan integration reference',
			logo: {
				src: './src/assets/geoplan-logo.png',
				alt: 'Geoplan',
			},
			favicon: '/favicon.png',
			lastUpdated: true,
			credits: false,
			components: {
				PageTitle: './src/components/PageTitle.astro',
			},
			sidebar: [
				{
					label: 'Start here',
					items: [{ label: 'Overview', link: '/' }],
				},
				{
					label: 'ON Principal',
					items: [{ label: 'Master Data Sync', slug: 'on-principal/master-data-sync' }],
				},
				{
					label: 'Samooha',
					items: [
						{ label: 'Overview', slug: 'samooha' },
						{ label: 'Authentication', slug: 'samooha/authentication' },
						{ label: 'Master Data', slug: 'samooha/master-data' },
						{ label: 'Scan Activities', slug: 'samooha/scan-activities' },
						{ label: 'Scan Sessions', slug: 'samooha/scan-sessions' },
						{ label: 'Errors & Retries', slug: 'samooha/errors-and-retries' },
					],
				},
				{
					label: 'Integrations',
					items: [{ label: 'ETP POS', slug: 'etp-pos' }],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Scan Activities', slug: 'scan-activities' },
						{ label: 'EPC Scan Processing', slug: 'epc-scan-processing' },
						{ label: 'RFID Readers', slug: 'rfid-readers' },
						{ label: 'Exception Handling', slug: 'exceptions' },
					],
				},
				{
					label: 'Other systems',
					items: [
						{ label: 'Qlik', slug: 'qlik' },
						{ label: 'SAP (Proposed)', slug: 'sap' },
					],
				},
			],
		}),
	],
});

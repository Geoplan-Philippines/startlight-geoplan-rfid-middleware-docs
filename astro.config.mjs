// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Geoplan RFID Middleware',
			description: 'Integration reference for the Geoplan RFID middleware.',
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
						{ label: 'Transaction Documents', slug: 'samooha/transaction-documents' },
						{ label: 'Scan Activities', slug: 'samooha/scan-activities' },
						{ label: 'Errors & Retries', slug: 'samooha/errors-and-retries' },
					],
				},
				{
					label: 'ETP POS',
					items: [{ label: 'Overview', slug: 'etp-pos' }],
				},
				{
					label: 'SAP',
					items: [{ label: 'Overview', slug: 'sap' }],
				},
			],
		}),
	],
});

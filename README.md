# Geoplan RFID integration docs

Starlight documentation for engineers integrating with the Geoplan RFID middleware.

## Content map

- `/` - start here
- `/on-principal/master-data-sync/` - ON Principal section
- `/samooha/` - Samooha integration overview
- `/samooha/authentication/` - Samooha access
- `/samooha/master-data/` - Samooha product master sync
- `/samooha/scan-activities/` - fixed activity IDs
- `/samooha/scan-sessions/` - draft Samooha session contract and limitations
- `/samooha/errors-and-retries/` - HTTP status reference

Providers expose their existing master data. Geoplan owns adaptation.

## Development

Install dependencies:

```sh
npm install
```

Start Astro in background mode:

```sh
npm run dev -- --background
```

Manage the background server:

```sh
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

Build the production site:

```sh
npm run build
```

## Assets

Source images used by Astro live in `src/assets/` for optimization and fingerprinting. Static favicon output lives in `public/`.

# Geoplan RFID integration docs

Starlight documentation for ETP POS and Samooha engineers integrating product master data with the Geoplan RFID middleware.

Current published scope: **master-data sync only**.

## Content map

- `/` — integration overview and architecture
- `/etp-pos/` — ETP POS source ownership, access, and Geoplan mapping boundary
- `/samooha/` — Samooha source ownership, access, and Geoplan mapping boundary
- `/contract/access/` — provider-specific source access and operational limits
- `/contract/source-data/` — provider-native data intake and Geoplan adapter responsibilities

Providers keep their existing master-data shapes. Shared guidance describes the adapter boundary; it does not define a schema that ETP POS or Samooha must implement.

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

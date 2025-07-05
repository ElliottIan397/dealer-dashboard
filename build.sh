#!/bin/bash

# Force resolution to fix puppeteer-core conflict
npx npm-force-resolutions

# Install with conflict bypass
npm install --legacy-peer-deps

# Run standard Next.js build
npm run build

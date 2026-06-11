import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '../public/app-config.js');

const defaultApiBaseUrl = 'https://bingsphere-backend.onrender.com/api/';
const configuredApiBaseUrl = (process.env.API_BASE_URL || defaultApiBaseUrl).trim();
const normalizedApiBaseUrl = configuredApiBaseUrl.endsWith('/')
  ? configuredApiBaseUrl
  : `${configuredApiBaseUrl}/`;

const fileContents = `window.__APP_CONFIG__ = ${JSON.stringify(
  {
    API_BASE_URL: normalizedApiBaseUrl,
  },
  null,
  2,
)};\n`;

fs.writeFileSync(outputPath, fileContents, 'utf8');

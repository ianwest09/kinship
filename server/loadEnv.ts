/**
 * Side-effect module that loads a local `.env` file, if one exists.
 *
 * This MUST be the first import in every server entrypoint (`server/index.ts`,
 * `api/index.ts`) because `kinshipQlooEngine.ts` reads `process.env` at module
 * evaluation time. Importing it later would be too late.
 *
 * Node's `process.loadEnvFile()` does not overwrite variables that are already
 * present in the environment, so platform-injected values (e.g. Vercel's
 * encrypted env vars) always take precedence over a local `.env`.
 *
 * On Vercel and in production there is normally no `.env` file, so this module
 * is a no-op there.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(here, '../.env');

type LoadEnvFileFn = (path?: string) => void;
const loadEnvFile = (process as unknown as { loadEnvFile?: LoadEnvFileFn }).loadEnvFile;

if (typeof loadEnvFile === 'function' && fs.existsSync(envPath)) {
  try {
    loadEnvFile(envPath);
  } catch {
    // A malformed or unreadable .env must never prevent the server from starting.
  }
}

export {};

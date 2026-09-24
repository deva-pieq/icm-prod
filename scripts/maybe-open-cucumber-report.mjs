#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

function hydrateOpenFlagFromEnvFile() {
  if (process.env.OPEN_CUCUMBER_REPORT !== undefined && process.env.OPEN_CUCUMBER_REPORT !== '') {
    return;
  }
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!existsSync(envPath)) return;
    const text = readFileSync(envPath, 'utf8');
    const m = text.match(/^\s*OPEN_CUCUMBER_REPORT\s*=\s*(.*?)\s*$/m);
    if (m) {
      let v = m[1].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env.OPEN_CUCUMBER_REPORT = v;
    }
  } catch {
    // ignore
  }
}

hydrateOpenFlagFromEnvFile();

const raw = String(process.env.OPEN_CUCUMBER_REPORT || '').toLowerCase();
const enabled = raw === '1' || raw === 'true' || raw === 'yes';
if (!enabled) {
  process.exit(0);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openScript = path.join(__dirname, 'open-cucumber-report.mjs');
const r = spawnSync(process.execPath, [openScript], { stdio: 'inherit' });
process.exit(r.status ?? 1);

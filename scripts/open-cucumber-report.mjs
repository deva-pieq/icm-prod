#!/usr/bin/env node
/**
 * Opens cucumber-report/index.html in the default browser (macOS / Linux / Windows).
 * Run from the project root that contains cucumber-report/ (same cwd as playwright test).
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

const index = path.join(process.cwd(), 'cucumber-report', 'index.html');
if (!existsSync(index)) {
  console.error(`No Cucumber report at ${index}. Run tests first.`);
  process.exit(1);
}

const abs = path.resolve(index);
console.log(`Opening Cucumber report: ${abs}`);

if (process.platform === 'win32') {
  execFileSync('cmd', ['/c', 'start', '', abs], { stdio: 'ignore' });
} else {
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
  execFileSync(opener, [abs], { stdio: 'inherit' });
}

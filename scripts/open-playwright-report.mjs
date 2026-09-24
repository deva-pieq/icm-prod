#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

const cwd = process.cwd();
const defaultReportDir = path.join(cwd, 'playwright-report');
const index = path.join(defaultReportDir, 'index.html');

if (!existsSync(index)) {
  console.error(`No Playwright report at ${index}. Run tests first, then: yarn report:open`);
  process.exit(1);
}

console.log(`Opening Playwright report: ${path.resolve(index)}`);

execFileSync('npx', ['playwright', 'show-report', defaultReportDir], {
  stdio: 'inherit',
  shell: true,
});

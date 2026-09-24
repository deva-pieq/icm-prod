import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';
import { ZipArchive } from 'archiver';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
} from '@playwright/test/reporter';

type OutcomeCounts = {
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
};

type CaseRef = {
  /** e.g. T001-SMK-OPS */
  id: string;
  /** Scenario description after the id */
  description: string;
  /** Optional one-line reason (Playwright first error or OpenCode). */
  reason?: string;
};

type FeatureStats = {
  name: string;
  counts: OutcomeCounts;
  failedCases: CaseRef[];
  flakyCases: CaseRef[];
};

type RunStats = {
  features: FeatureStats[];
  grand: OutcomeCounts;
};

/** OpenCode (or CI) one-liners keyed by case id. */
type OpencodeOneliners = {
  flaky?: Record<string, string>;
  failed?: Record<string, string>;
};

/**
 * Sends a Playwright run summary to Slack via a Bot token (chat.postMessage),
 * attaches index.html (and optional zip) on the *same* message via chat.update
 * + file_ids. Failed/flaky Test IDs stay on that message; OpenCode investigation
 * reasons are posted later as a thread reply (see ci-post-slack-summary.mjs).
 *
 * Summary is grouped by Feature (from playwright-report/index.html when
 * available, otherwise from the in-memory suite).
 *
 * Safe by design — this reporter never throws and never changes the process
 * exit code, so it cannot disturb an existing (successful or failing) run:
 *   - If SLACK_BOT_TOKEN / SLACK_CHANNEL_ID are unset, it silently skips.
 *   - Any network / API error is caught and logged as a warning only.
 *
 * Config via .env (already loaded by playwright.config.ts):
 *   SLACK_BOT_TOKEN            xoxb-... bot token (needs chat:write, files:write scopes)
 *   SLACK_CHANNEL_ID           e.g. C0123ABCXYZ (bot must be invited to it)
 *   SLACK_DISABLED             1 / true / yes — skip Slack entirely (useful while debugging)
 *   SLACK_NOTIFY_ON_FAILURE_ONLY  1 = only post when there are failures
 *   SLACK_UPLOAD_ZIP           1 = zip playwright-report into previousReports/playwright-report-{ts}.zip
 *                              (kept locally; also uploaded to Slack when files:write is granted)
 *                              Zip runs only when Slack reporting is active (token+channel set,
 *                              SLACK_DISABLED off) AND this flag is enabled.
 *   REPORT_TAG                override the auto tag (default "<folder> <env>", e.g. "xwell preprod")
 *   REPORT_ENV                override the env label (default derived from BASE_URL host)
 *   REPORT_BASE_URL           if reports are hosted, base URL used to build a clickable html link
 *   REPORT_DIR                path to the Playwright HTML report folder (default "playwright-report")
 *   PREVIOUS_REPORTS_DIR      local archive folder for zips (default "previousReports")
 *
 * Side outputs under `.ci/` (for OpenCode CI follow-up):
 *   slack-thread.json         channel + ts + flaky/failed case lists
 *   run-outcomes.json         grand counts + flaky/failed ids (`needsOpencode`)
 * Reads `.ci/opencode-oneliners.json` when present to attach one-line reasons:
 *   { "flaky": { "T001": "…" }, "failed": { "T002": "…" } }
 */
export default class SlackReporter implements Reporter {
  private suite: Suite | undefined;
  private startedAt = 0;

  /** Slack only posts at onEnd. Returning false lets Playwright keep a stdout reporter. */
  printsToStdio(): boolean {
    return false;
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.suite = suite;
    this.startedAt = Date.now();
  }

  async onEnd(result: FullResult): Promise<void> {
    try {
      const reportDir = process.env.REPORT_DIR?.trim() || 'playwright-report';
      const indexPath = path.resolve(reportDir, 'index.html');
      const hasIndex = fs.existsSync(indexPath);

      // Prefer in-memory suite (includes first-fail reasons for flaky/failed).
      // Fall back to HTML report when the suite is empty.
      const fromSuite = this.parseStatsFromSuite();
      const stats =
        fromSuite.features.length > 0
          ? fromSuite
          : (hasIndex ? this.parseStatsFromHtmlReport(indexPath) : undefined) ?? fromSuite;

      // Always persist outcomes for CI OpenCode (even when Slack is skipped).
      this.writeRunOutcomes(stats);

      if (/^(1|true|yes)$/i.test(process.env.SLACK_DISABLED ?? '')) {
        console.log('[slack] SLACK_DISABLED is set — skipping notification.');
        return;
      }

      const token = process.env.SLACK_BOT_TOKEN?.trim();
      const channel = process.env.SLACK_CHANNEL_ID?.trim();
      if (!token || !channel) {
        console.log('[slack] SLACK_BOT_TOKEN / SLACK_CHANNEL_ID not set — skipping notification.');
        return;
      }

      const failureOnly = /^(1|true|yes)$/i.test(process.env.SLACK_NOTIFY_ON_FAILURE_ONLY ?? '');
      if (failureOnly && stats.grand.failed === 0 && stats.grand.flaky === 0) {
        console.log(
          '[slack] No failures/flakes and SLACK_NOTIFY_ON_FAILURE_ONLY is set — skipping.',
        );
        return;
      }

      // Merge OpenCode one-liners when CI already wrote them (e.g. re-post / local replay).
      this.applyOpencodeOneliners(stats, this.readOpencodeOneliners());

      const runId = this.readRunId();
      const durationSec = Math.round((Date.now() - this.startedAt) / 1000);
      const ok = result.status === 'passed';
      const emoji = ok ? ':large_green_circle:' : ':red_circle:';
      const baseUrl = process.env.BASE_URL ?? '';
      const tag = this.buildTag(baseUrl);

      const zipEnabled = /^(1|true|yes)$/i.test(process.env.SLACK_UPLOAD_ZIP ?? '');

      // Always write the zip locally when enabled (kept on disk — not deleted after upload).
      let zipPath: string | undefined;
      if (zipEnabled) {
        zipPath = await this.createReportZip(reportDir);
      }

      const canUploadFiles = await this.botHasFilesWrite(token);
      const uploaded: { index: boolean; zip: boolean } = { index: false, zip: false };

      const reportLine = this.buildReportLine({
        runId,
        hasIndex,
        zipPath,
        canUploadFiles,
      });

      const headline = `${emoji} *[${tag}]* Playwright run`;
      const blocks = this.buildMessageBlocks({
        headline,
        stats,
        reportLine,
        baseUrl,
        durationSec,
      });

      const grandTotal = this.totalOf(stats.grand);
      const flakyBit =
        stats.grand.flaky > 0 ? `, ${stats.grand.flaky} flaky` : '';
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel,
          text: `[${tag}] ${ok ? 'PASSED' : result.status.toUpperCase()}: ${stats.grand.passed}/${grandTotal} passed, ${stats.grand.failed} failed${flakyBit}`,
          blocks,
        }),
      });

      const json = (await res.json()) as { ok: boolean; error?: string; ts?: string };
      if (!json.ok) {
        console.warn(`[slack] chat.postMessage failed: ${json.error ?? 'unknown error'}`);
        return;
      }
      console.log('[slack] Notification sent.');

      if (json.ts) {
        this.writeSlackThreadHandle({ channel, ts: json.ts, stats });
      }

      if (!canUploadFiles) {
        console.warn(
          '[slack] Bot token is missing files:write — skipping Slack file uploads. ' +
            'Add files:write in the Slack app OAuth scopes and reinstall the app. ' +
            (zipPath ? `Local zip kept at: ${zipPath}` : ''),
        );
        return;
      }

      if (!json.ts) {
        console.warn('[slack] No message ts — cannot attach files to the summary message.');
        return;
      }

      const fileIds: string[] = [];

      if (hasIndex) {
        try {
          const fileId = await this.slackUploadFilePrivate({
            token,
            filePath: indexPath,
            filename: 'index.html',
          });
          fileIds.push(fileId);
          uploaded.index = true;
          console.log('[slack] index.html uploaded (pending attach).');
        } catch (err) {
          console.warn(`[slack] index.html upload failed: ${(err as Error).message}`);
        }
      } else {
        console.warn(`[slack] "${indexPath}" not found — skipping index.html upload.`);
      }

      if (zipPath) {
        try {
          const fileId = await this.slackUploadFilePrivate({
            token,
            filePath: zipPath,
          });
          fileIds.push(fileId);
          uploaded.zip = true;
          console.log(
            `[slack] Zip uploaded (pending attach, ${path.basename(zipPath)}). Local copy kept at: ${zipPath}`,
          );
        } catch (err) {
          console.warn(
            `[slack] Zip upload failed: ${(err as Error).message}. Local zip kept at: ${zipPath}`,
          );
        }
      }

      if (fileIds.length > 0) {
        try {
          await this.attachFilesToMessage({
            token,
            channel,
            ts: json.ts,
            fileIds,
          });
          console.log(
            `[slack] Attachments on summary message: index=${uploaded.index} zip=${uploaded.zip}`,
          );
        } catch (err) {
          console.warn(`[slack] Failed to attach files to message: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      console.warn(`[slack] Notification skipped due to error: ${(err as Error).message}`);
    }
  }

  /**
   * Parse feature-grouped stats from playwright-report/index.html
   * (embedded zip → report.json).
   */
  private parseStatsFromHtmlReport(indexPath: string): RunStats | undefined {
    try {
      const html = fs.readFileSync(indexPath, 'utf8');
      const match = html.match(
        /<template id="playwrightReportBase64">data:application\/zip;base64,([A-Za-z0-9+/=\s]+)<\/template>/,
      );
      if (!match?.[1]) {
        console.warn('[slack] index.html has no embedded report zip — falling back to suite.');
        return undefined;
      }

      const zipBuf = Buffer.from(match[1].replace(/\s+/g, ''), 'base64');
      const reportJsonBuf = this.readZipEntry(zipBuf, 'report.json');
      if (!reportJsonBuf) {
        console.warn('[slack] report.json not found in embedded zip — falling back to suite.');
        return undefined;
      }

      const report = JSON.parse(reportJsonBuf.toString('utf8')) as {
        files?: Array<{
          tests?: Array<{
            title: string;
            outcome: 'expected' | 'unexpected' | 'flaky' | 'skipped';
            path?: string[];
          }>;
        }>;
      };

      const byFeature = new Map<string, FeatureStats>();
      for (const file of report.files ?? []) {
        for (const test of file.tests ?? []) {
          const featureName = (test.path?.[0] ?? 'Unknown feature').trim() || 'Unknown feature';
          this.accumulateTest(byFeature, featureName, test.outcome, test.title);
        }
      }

      return this.finalizeRunStats(byFeature);
    } catch (err) {
      console.warn(
        `[slack] Failed to parse index.html report: ${(err as Error).message} — falling back to suite.`,
      );
      return undefined;
    }
  }

  /** Fallback: group suite tests by Feature title (playwright-bdd path). */
  private parseStatsFromSuite(): RunStats {
    const byFeature = new Map<string, FeatureStats>();
    for (const test of this.suite?.allTests() ?? []) {
      const featureName = this.featureNameFromTest(test);
      const reason = this.firstErrorReason(test);
      this.accumulateTest(byFeature, featureName, test.outcome(), test.title, reason);
    }
    return this.finalizeRunStats(byFeature);
  }

  private featureNameFromTest(test: TestCase): string {
    // titlePath: [project?, ...suites, testTitle] — feature is the last suite.
    const titles = test.titlePath();
    if (titles.length >= 2) {
      return titles[titles.length - 2]!.trim() || 'Unknown feature';
    }
    return test.parent?.title?.trim() || 'Unknown feature';
  }

  /** First non-empty error message from attempts (useful for flaky first-fail). */
  private firstErrorReason(test: TestCase): string | undefined {
    for (const result of test.results ?? []) {
      for (const err of result.errors ?? []) {
        const line = this.oneLineReason(err.message ?? err.value ?? '');
        if (line) return line;
      }
    }
    return undefined;
  }

  private oneLineReason(raw: string): string {
    const cleaned = raw
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/\r/g, '')
      .trim();
    if (!cleaned) return '';
    const first = cleaned.split('\n').find((l) => l.trim()) ?? '';
    return first.trim().slice(0, 160);
  }

  private accumulateTest(
    byFeature: Map<string, FeatureStats>,
    featureName: string,
    outcome: 'expected' | 'unexpected' | 'flaky' | 'skipped',
    title: string,
    reason?: string,
  ): void {
    let feature = byFeature.get(featureName);
    if (!feature) {
      feature = {
        name: featureName,
        counts: { passed: 0, failed: 0, flaky: 0, skipped: 0 },
        failedCases: [],
        flakyCases: [],
      };
      byFeature.set(featureName, feature);
    }

    switch (outcome) {
      case 'expected':
        feature.counts.passed += 1;
        break;
      case 'unexpected':
        feature.counts.failed += 1;
        feature.failedCases.push(this.parseCaseRef(title, reason));
        break;
      case 'flaky':
        feature.counts.flaky += 1;
        feature.flakyCases.push(this.parseCaseRef(title, reason));
        break;
      case 'skipped':
        feature.counts.skipped += 1;
        break;
      default:
        break;
    }
  }

  private finalizeRunStats(byFeature: Map<string, FeatureStats>): RunStats {
    const features = [...byFeature.values()].sort((a, b) => a.name.localeCompare(b.name));
    const grand: OutcomeCounts = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
    for (const f of features) {
      grand.passed += f.counts.passed;
      grand.failed += f.counts.failed;
      grand.flaky += f.counts.flaky;
      grand.skipped += f.counts.skipped;
    }
    return { features, grand };
  }

  /** "T003-ADV-SP — Verify …" → { id, description, reason? } */
  private parseCaseRef(title: string, reason?: string): CaseRef {
    const m = title.match(/^(\S+)\s*[—–-]\s*(.+)$/);
    const base = m
      ? { id: m[1]!, description: m[2]!.trim() }
      : { id: title.trim(), description: '' };
    return reason ? { ...base, reason } : base;
  }

  private formatCounts(counts: OutcomeCounts): string {
    const total = this.totalOf(counts);
    return (
      `*Total:* ${total}   ` +
      `:white_check_mark: ${counts.passed}   ` +
      `:x: ${counts.failed}   ` +
      `:warning: ${counts.flaky} flaky   ` +
      `:fast_forward: ${counts.skipped} skipped`
    );
  }

  private totalOf(counts: OutcomeCounts): number {
    return counts.passed + counts.failed + counts.flaky + counts.skipped;
  }

  private formatCaseLine(c: CaseRef, includeReason = false): string {
    const head = c.description ? `${c.id}: ${c.description}` : c.id;
    return includeReason && c.reason ? `${head}\n    → ${c.reason}` : head;
  }

  private formatFeatureBlock(feature: FeatureStats): string {
    // Main message: case ids only — reasons go in the thread reply.
    const lines = [`*Feature:* ${feature.name}`, this.formatCounts(feature.counts)];
    if (feature.failedCases.length > 0) {
      lines.push('*Failed Cases*');
      for (const c of feature.failedCases) lines.push(this.formatCaseLine(c, false));
    }
    if (feature.flakyCases.length > 0) {
      lines.push('*Flaky Cases*');
      for (const c of feature.flakyCases) lines.push(this.formatCaseLine(c, false));
    }
    return lines.join('\n');
  }

  private buildMessageBlocks(opts: {
    headline: string;
    stats: RunStats;
    reportLine: string;
    baseUrl: string;
    durationSec: number;
  }): Array<Record<string, unknown>> {
    const { headline, stats, reportLine, baseUrl, durationSec } = opts;
    const blocks: Array<Record<string, unknown>> = [
      { type: 'section', text: { type: 'mrkdwn', text: headline } },
    ];

    // Slack allows max 50 blocks; keep headroom for grand total / report / meta.
    const maxFeatureBlocks = 40;
    for (const feature of stats.features.slice(0, maxFeatureBlocks)) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: this.truncateMrkdwn(this.formatFeatureBlock(feature)) },
      });
    }
    if (stats.features.length > maxFeatureBlocks) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `_…and ${stats.features.length - maxFeatureBlocks} more feature(s)_`,
        },
      });
    }

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Grand Total*\n${this.formatCounts(stats.grand)}`,
      },
    });

    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: reportLine } });

    const meta = [
      baseUrl ? `*Env:* ${baseUrl}` : '',
      `*Duration:* ${durationSec}s`,
    ]
      .filter(Boolean)
      .join('   ');
    if (meta) {
      blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: meta }] });
    }

    return blocks;
  }

  /** Slack section mrkdwn max is 3000 chars. */
  private truncateMrkdwn(text: string, max = 2900): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max - 20)}\n_…truncated_`;
  }

  /**
   * Read a single entry from a standard (non-ZIP64) zip buffer.
   * Playwright HTML report zip is small and uses store/deflate only.
   */
  private readZipEntry(zip: Buffer, entryName: string): Buffer | undefined {
    let offset = 0;
    while (offset + 30 <= zip.length) {
      const sig = zip.readUInt32LE(offset);
      if (sig !== 0x04034b50) break; // local file header

      const flags = zip.readUInt16LE(offset + 6);
      const compression = zip.readUInt16LE(offset + 8);
      const compSize = zip.readUInt32LE(offset + 18);
      const nameLen = zip.readUInt16LE(offset + 26);
      const extraLen = zip.readUInt16LE(offset + 28);
      const name = zip.subarray(offset + 30, offset + 30 + nameLen).toString('utf8');
      const dataStart = offset + 30 + nameLen + extraLen;

      // Bit 3: sizes follow in data descriptor — uncommon in PW reports.
      if (flags & 0x8) {
        return this.readZipEntryViaTemp(zip, entryName);
      }

      const data = zip.subarray(dataStart, dataStart + compSize);
      if (name === entryName || name.endsWith(`/${entryName}`)) {
        if (compression === 0) return Buffer.from(data);
        if (compression === 8) return zlib.inflateRawSync(data);
        throw new Error(`Unsupported zip compression method: ${compression}`);
      }
      offset = dataStart + compSize;
    }
    return undefined;
  }

  /** Rare fallback when zip uses data descriptors. */
  private readZipEntryViaTemp(zip: Buffer, entryName: string): Buffer | undefined {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-slack-report-'));
    try {
      const zipPath = path.join(tmp, 'report.zip');
      fs.writeFileSync(zipPath, zip);
      execSync(`tar -xf "${zipPath}" -C "${tmp}"`, { stdio: 'ignore' });
      const target = path.join(tmp, entryName);
      if (!fs.existsSync(target)) return undefined;
      return fs.readFileSync(target);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  /** Zips reportDir into previousReports/playwright-report-{timestamp}.zip and keeps it. */
  private async createReportZip(reportDir: string): Promise<string | undefined> {
    const absReportDir = path.resolve(reportDir);
    if (!fs.existsSync(absReportDir)) {
      console.warn(`[slack] Report dir "${absReportDir}" not found — skipping zip.`);
      return undefined;
    }

    const archiveDir = path.resolve(
      process.env.PREVIOUS_REPORTS_DIR?.trim() || 'previousReports',
    );
    fs.mkdirSync(archiveDir, { recursive: true });

    const zipName = `playwright-report-${this.humanTimestamp()}.zip`;
    const zipPath = path.join(archiveDir, zipName);

    try {
      await this.zipDirectory(absReportDir, zipPath);
      const sizeKb = Math.round(fs.statSync(zipPath).size / 1024);
      console.log(`[slack] Zip saved locally: ${zipPath} (${sizeKb} KB)`);
      return zipPath;
    } catch (err) {
      console.warn(`[slack] Zip create failed: ${(err as Error).message}`);
      fs.rmSync(zipPath, { force: true });
      return undefined;
    }
  }

  /**
   * Writes channel + message ts (+ case lists) for CI OpenCode / thread replies.
   * Never throws.
   */
  private writeSlackThreadHandle(opts: {
    channel: string;
    ts: string;
    stats: RunStats;
  }): void {
    try {
      const outDir = path.resolve('.ci');
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, 'slack-thread.json');
      const { flaky, failed } = this.collectCaseLists(opts.stats);
      fs.writeFileSync(
        outPath,
        JSON.stringify(
          {
            channel: opts.channel,
            ts: opts.ts,
            flakyCount: opts.stats.grand.flaky,
            failedCount: opts.stats.grand.failed,
            flaky,
            failed,
          },
          null,
          2,
        ),
        'utf8',
      );
      console.log(`[slack] Thread handle written: ${outPath}`);
    } catch (err) {
      console.warn(`[slack] Failed to write thread handle: ${(err as Error).message}`);
    }
  }

  /** Persist flaky/failed ids for OpenCode summarize (`.ci/run-outcomes.json`). */
  private writeRunOutcomes(stats: RunStats): void {
    try {
      const outDir = path.resolve('.ci');
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, 'run-outcomes.json');
      const { flaky, failed } = this.collectCaseLists(stats);
      fs.writeFileSync(
        outPath,
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            grand: stats.grand,
            flaky,
            failed,
            needsOpencode: stats.grand.failed > 0 || stats.grand.flaky > 0,
          },
          null,
          2,
        ),
        'utf8',
      );
      console.log(
        `[slack] Run outcomes written: ${outPath} (flaky=${flaky.length}, failed=${failed.length})`,
      );
    } catch (err) {
      console.warn(`[slack] Failed to write run outcomes: ${(err as Error).message}`);
    }
  }

  private collectCaseLists(stats: RunStats): {
    flaky: CaseRef[];
    failed: CaseRef[];
  } {
    const flaky: CaseRef[] = [];
    const failed: CaseRef[] = [];
    for (const f of stats.features) {
      for (const c of f.flakyCases) flaky.push({ ...c, description: c.description || f.name });
      for (const c of f.failedCases) failed.push({ ...c, description: c.description || f.name });
    }
    return { flaky, failed };
  }

  /** Read `.ci/opencode-oneliners.json` when present (written by OpenCode CI step). */
  private readOpencodeOneliners(): OpencodeOneliners | undefined {
    try {
      const p = path.resolve('.ci', 'opencode-oneliners.json');
      if (!fs.existsSync(p)) return undefined;
      const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as OpencodeOneliners;
      return raw;
    } catch (err) {
      console.warn(`[slack] Failed to read opencode oneliners: ${(err as Error).message}`);
      return undefined;
    }
  }

  /** Overlay OpenCode one-line reasons onto flaky/failed case refs. */
  private applyOpencodeOneliners(stats: RunStats, oneliners?: OpencodeOneliners): void {
    if (!oneliners) return;
    const flakyMap = oneliners.flaky ?? {};
    const failedMap = oneliners.failed ?? {};
    let applied = 0;
    for (const f of stats.features) {
      for (const c of f.flakyCases) {
        const r = flakyMap[c.id]?.trim();
        if (r) {
          c.reason = this.oneLineReason(r);
          applied += 1;
        }
      }
      for (const c of f.failedCases) {
        const r = failedMap[c.id]?.trim();
        if (r) {
          c.reason = this.oneLineReason(r);
          applied += 1;
        }
      }
    }
    if (applied > 0) {
      console.log(`[slack] Applied ${applied} OpenCode one-liner reason(s).`);
    }
  }

  /** True when the bot token includes files:write (required for uploads). */
  private async botHasFilesWrite(token: string): Promise<boolean> {
    try {
      const res = await fetch('https://slack.com/api/auth.test', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const scopes = (res.headers.get('x-oauth-scopes') ?? '').split(',').map((s) => s.trim());
      return scopes.includes('files:write');
    } catch {
      return false;
    }
  }

  private buildReportLine(opts: {
    runId: string;
    hasIndex: boolean;
    zipPath?: string;
    canUploadFiles: boolean;
  }): string {
    const { runId, hasIndex, zipPath, canUploadFiles } = opts;
    if (canUploadFiles && (hasIndex || zipPath)) {
      const parts = [
        hasIndex ? '`index.html`' : '',
        zipPath ? `\`${path.basename(zipPath)}\`` : '',
      ].filter(Boolean);
      return `*HTML report:* attached (${parts.join(' + ')})`;
    }
    if (zipPath) {
      return `*HTML report:* local zip \`${path.basename(zipPath)}\` (Slack upload needs \`files:write\`)`;
    }
    if (hasIndex) {
      return `*HTML report:* \`${path.resolve('playwright-report', 'index.html')}\` (Slack upload needs \`files:write\`)`;
    }
    return `*HTML report:* ${this.buildReportLink(runId)}`;
  }

  /** Zips a directory's contents into outZipPath. */
  private zipDirectory(sourceDir: string, outZipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outZipPath);
      // archiver v8 is ESM-only: use ZipArchive (no default `archiver('zip')` export).
      const archive = new ZipArchive({ zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err: Error) => reject(err));

      archive.pipe(output);
      archive.directory(sourceDir, false);
      void archive.finalize();
    });
  }

  /**
   * Uploads a file to Slack (hosted, not yet shared to a channel) and returns file_id.
   * Use attachFilesToMessage to put the file(s) on the summary message.
   */
  private async slackUploadFilePrivate(opts: {
    token: string;
    filePath: string;
    filename?: string;
  }): Promise<string> {
    const { token, filePath } = opts;
    const filename = opts.filename ?? path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    const urlRes = await fetch('https://slack.com/api/files.getUploadURLExternal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams({
        filename,
        length: String(fileBuffer.byteLength),
      }),
    });
    const urlJson = (await urlRes.json()) as {
      ok: boolean;
      upload_url?: string;
      file_id?: string;
      error?: string;
    };
    if (!urlJson.ok || !urlJson.upload_url || !urlJson.file_id) {
      const err = urlJson.error ?? 'unknown error';
      const hint =
        err === 'missing_scope'
          ? ' (bot needs files:write — add the scope in the Slack app and reinstall to the workspace)'
          : '';
      throw new Error(`files.getUploadURLExternal failed: ${err}${hint}`);
    }

    const uploadRes = await fetch(urlJson.upload_url, {
      method: 'POST',
      body: fileBuffer,
    });
    if (!uploadRes.ok) {
      throw new Error(`Upload to Slack URL failed: ${uploadRes.status} ${uploadRes.statusText}`);
    }

    // Complete without channel_id — file stays private until attached via chat.update.
    const completeRes = await fetch('https://slack.com/api/files.completeUploadExternal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        files: [{ id: urlJson.file_id, title: filename }],
      }),
    });
    const completeJson = (await completeRes.json()) as { ok: boolean; error?: string };
    if (!completeJson.ok) {
      throw new Error(`files.completeUploadExternal failed: ${completeJson.error ?? 'unknown error'}`);
    }
    return urlJson.file_id;
  }

  /** Attach already-uploaded file IDs onto an existing chat message (same bubble). */
  private async attachFilesToMessage(opts: {
    token: string;
    channel: string;
    ts: string;
    fileIds: string[];
  }): Promise<void> {
    const { token, channel, ts, fileIds } = opts;
    const res = await fetch('https://slack.com/api/chat.update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel,
        ts,
        file_ids: fileIds,
      }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      throw new Error(`chat.update (file_ids) failed: ${json.error ?? 'unknown error'}`);
    }
  }

  /** e.g. "2026-07-24_14-30-05" */
  private humanTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
    );
  }

  private buildTag(baseUrl: string): string {
    const override = process.env.REPORT_TAG?.trim();
    if (override) return override;
    const folder = path.basename(process.cwd());
    const env = this.envLabel(baseUrl);
    return env ? `${folder} ${env}` : folder;
  }

  private envLabel(baseUrl: string): string {
    const override = process.env.REPORT_ENV?.trim();
    if (override) return override;
    try {
      if (baseUrl) {
        const host = new URL(baseUrl).hostname;
        const first = host.split('.')[0];
        if (first && first !== 'www') return first;
      }
    } catch {
      /* ignore */
    }
    return 'local';
  }

  /** Fallback link used only when index.html isn't found. */
  private buildReportLink(runId: string): string {
    const rel = path.join('reports', 'runs', runId || 'latest', 'playwright-report', 'index.html');
    const base = process.env.REPORT_BASE_URL?.trim();
    if (base && runId) {
      const url = `${base.replace(/\/+$/, '')}/${runId}/playwright-report/index.html`;
      return `<${url}|Open report>`;
    }
    return `\`${path.resolve(process.cwd(), rel)}\``;
  }

  private readRunId(): string {
    try {
      const fromEnv = process.env.REPORT_RUN_ID?.trim();
      if (fromEnv) return fromEnv;
      const idFile = path.join(process.cwd(), '.report-run-id');
      if (fs.existsSync(idFile)) return fs.readFileSync(idFile, 'utf8').trim();
    } catch {
      /* ignore */
    }
    return '';
  }
}

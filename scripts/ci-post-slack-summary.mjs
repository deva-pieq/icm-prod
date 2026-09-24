#!/usr/bin/env node
/**
 * Posts an OpenCode (or other) failure/flaky summary to Slack as a thread reply.
 * Also updates the parent Slack message with flaky/failed one-liners when
 * `.ci/opencode-oneliners.json` is present.
 *
 * Reads:
 *   - .ci/slack-thread.json  { channel, ts, flaky, failed }  (optional — falls back to SLACK_CHANNEL_ID)
 *   - summary file path from argv[2] or .ci/opencode-summary.md
 *   - .ci/opencode-oneliners.json  { flaky: { id: reason }, failed: { id: reason } }
 *   - SLACK_BOT_TOKEN
 *
 * Never exits non-zero (warn-only), matching SlackReporter safety.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const THREAD_FILE = path.resolve(ROOT, '.ci', 'slack-thread.json');
const ONELINERS_FILE = path.resolve(ROOT, '.ci', 'opencode-oneliners.json');
const DEFAULT_SUMMARY = path.resolve(ROOT, '.ci', 'opencode-summary.md');
const SECTION_MAX = 2900;

function truncateMrkdwn(text, max = SECTION_MAX) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 20)}\n_…truncated_`;
}

/** Split long markdown into Slack section-sized chunks. */
function chunkText(text, max = SECTION_MAX) {
  const chunks = [];
  let rest = text.trim();
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max);
    if (cut < max * 0.5) cut = max;
    chunks.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks.length ? chunks : ['_(empty summary)_'];
}

function oneLine(raw) {
  return String(raw ?? '')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\r/g, '')
    .trim()
    .split('\n')
    .find((l) => l.trim())
    ?.trim()
    .slice(0, 160) ?? '';
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(`[ci-slack-summary] Bad JSON ${filePath}: ${(err && err.message) || err}`);
    return null;
  }
}

/**
 * Prefer structured oneliners JSON; else scrape from markdown / embedded JSON.
 * @returns {{ flaky: Record<string, string>, failed: Record<string, string> }}
 */
function loadOneliners(summaryText) {
  const fromFile = readJson(ONELINERS_FILE);
  if (fromFile && (fromFile.flaky || fromFile.failed)) {
    return {
      flaky: normalizeMap(fromFile.flaky),
      failed: normalizeMap(fromFile.failed),
    };
  }

  const fromEmbedded = extractEmbeddedOneliners(summaryText);
  if (
    Object.keys(fromEmbedded.flaky).length ||
    Object.keys(fromEmbedded.failed).length
  ) {
    return fromEmbedded;
  }

  /** @type {Record<string, string>} */
  const flaky = {};
  /** @type {Record<string, string>} */
  const failed = {};
  let bucket = /** @type {'flaky' | 'failed' | null} */ (null);
  for (const line of summaryText.split(/\r?\n/)) {
    if (/^\s*#{1,3}\s*flaky/i.test(line) || /^\s*\*?\*?flaky\b/i.test(line)) {
      bucket = 'flaky';
      continue;
    }
    if (/^\s*#{1,3}\s*failed/i.test(line) || /^\s*\*?\*?failed\b/i.test(line)) {
      bucket = 'failed';
      continue;
    }
    const m = line.match(/^\s*[-*]?\s*`?([A-Za-z0-9][\w.-]*)`?\s*[:—–-]\s*(.+)$/);
    if (!m || !bucket) continue;
    const id = m[1];
    const reason = oneLine(m[2]);
    if (!id || !reason) continue;
    if (bucket === 'flaky') flaky[id] = reason;
    else failed[id] = reason;
  }
  return { flaky, failed };
}

/** Pull `{ "flaky": {...}, "failed": {...} }` out of a markdown/code fence if present. */
function extractEmbeddedOneliners(summaryText) {
  /** @type {{ flaky: Record<string, string>, failed: Record<string, string> }} */
  const empty = { flaky: {}, failed: {} };
  const fence = summaryText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [];
  if (fence?.[1]) candidates.push(fence[1]);
  const brace = summaryText.match(/\{[\s\S]*"flaky"[\s\S]*"failed"[\s\S]*\}/);
  if (brace?.[0]) candidates.push(brace[0]);
  for (const raw of candidates) {
    try {
      const parsed = JSON.parse(raw.trim());
      if (parsed && (parsed.flaky || parsed.failed)) {
        return {
          flaky: normalizeMap(parsed.flaky),
          failed: normalizeMap(parsed.failed),
        };
      }
    } catch {
      /* try next */
    }
  }
  return empty;
}

function normalizeMap(obj) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    const reason = oneLine(v);
    if (k && reason) out[k] = reason;
  }
  return out;
}

function formatOnelinerSection(title, map) {
  const entries = Object.entries(map);
  if (!entries.length) return '';
  const lines = [`*${title} (${entries.length})*`];
  for (const [id, reason] of entries) {
    lines.push(`• \`${id}\` — ${reason}`);
  }
  return lines.join('\n');
}

async function postMessage(token, body) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return /** @type {{ ok: boolean; error?: string; ts?: string }} */ (await res.json());
}

async function main() {
  if (/^(1|true|yes)$/i.test(process.env.SLACK_DISABLED ?? '')) {
    console.log('[ci-slack-summary] SLACK_DISABLED — skipping.');
    return;
  }

  const token = process.env.SLACK_BOT_TOKEN?.trim();
  if (!token) {
    console.warn('[ci-slack-summary] SLACK_BOT_TOKEN not set — skipping.');
    return;
  }

  const summaryPath = path.resolve(process.argv[2] || DEFAULT_SUMMARY);
  if (!fs.existsSync(summaryPath)) {
    console.warn(`[ci-slack-summary] Summary file missing: ${summaryPath}`);
    return;
  }

  let summary = fs.readFileSync(summaryPath, 'utf8').trim();
  if (!summary) {
    console.warn('[ci-slack-summary] Summary file empty — skipping.');
    return;
  }

  /** @type {{ channel?: string; ts?: string; flaky?: unknown[]; failed?: unknown[] }} */
  let thread = {};
  if (fs.existsSync(THREAD_FILE)) {
    try {
      thread = JSON.parse(fs.readFileSync(THREAD_FILE, 'utf8'));
    } catch (err) {
      console.warn(`[ci-slack-summary] Bad thread file: ${(err && err.message) || err}`);
    }
  }

  const channel = (thread.channel || process.env.SLACK_CHANNEL_ID || '').trim();
  if (!channel) {
    console.warn('[ci-slack-summary] No Slack channel (thread file or SLACK_CHANNEL_ID) — skipping.');
    return;
  }

  const oneliners = loadOneliners(summary);
  // Persist scraped oneliners so a SlackReporter re-post can pick them up.
  if (Object.keys(oneliners.flaky).length || Object.keys(oneliners.failed).length) {
    try {
      fs.mkdirSync(path.dirname(ONELINERS_FILE), { recursive: true });
      fs.writeFileSync(ONELINERS_FILE, JSON.stringify(oneliners, null, 2), 'utf8');
      console.log(
        `[ci-slack-summary] Wrote oneliners (flaky=${Object.keys(oneliners.flaky).length}, failed=${Object.keys(oneliners.failed).length}).`,
      );
    } catch (err) {
      console.warn(`[ci-slack-summary] Could not write oneliners file: ${(err && err.message) || err}`);
    }
  }

  const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : '';

  const flakySection = formatOnelinerSection('Flaky tests (OpenCode)', oneliners.flaky);
  const failedSection = formatOnelinerSection('Failed tests (OpenCode)', oneliners.failed);

  const headerParts = [
    '*OpenCode failure / flaky summary*',
    runUrl ? `<${runUrl}|GitHub Actions run>` : '',
    '_Download `smoke-failure-artifacts` from the run for traces/screenshots._',
  ].filter(Boolean);

  const blocks = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: truncateMrkdwn(headerParts.join('\n')) },
    },
  ];

  if (flakySection) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: truncateMrkdwn(flakySection) },
    });
  }
  if (failedSection) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: truncateMrkdwn(failedSection) },
    });
  }

  blocks.push({ type: 'divider' });

  const chunks = chunkText(summary);
  for (const chunk of chunks.slice(0, 8)) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: truncateMrkdwn(chunk) },
    });
  }
  if (chunks.length > 8) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `_…${chunks.length - 8} more chunk(s) omitted_` }],
    });
  }

  const payload = {
    channel,
    text: 'OpenCode failure / flaky summary',
    blocks,
  };
  if (thread.ts) {
    payload.thread_ts = thread.ts;
  }

  const json = await postMessage(token, payload);
  if (!json.ok) {
    console.warn(`[ci-slack-summary] chat.postMessage failed: ${json.error ?? 'unknown'}`);
    return;
  }
  console.log(
    `[ci-slack-summary] Posted${thread.ts ? ' as thread reply' : ' as new message'} (ts=${json.ts}).`,
  );
}

main().catch((err) => {
  console.warn(`[ci-slack-summary] Skipped due to error: ${(err && err.message) || err}`);
});

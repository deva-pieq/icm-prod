import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';

const GHERKIN = /^(Given|When|Then|And|But)\b/;
const BAR_WIDTH = 24;

/** 3-line block PIEQ — 4/3/4/4 letter cells. */
const PIEQ_BANNER = [
  '█▀▀█ ▀█▀ █▀▀▀ █▀▀█',
  '█▄▄▀  █  █▀▀  █  █',
  '█    ▀▀▀ ▀▀▀▀ ▀▀█▄',
];

/**
 * Live stdout reporter: Gherkin step lines during the run.
 * ASCII progress bar prints after each test ends (not between steps).
 */
export default class ProgressReporter implements Reporter {
  private total = 0;
  private startedAt = 0;
  private finishedIds = new Set<string>();
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private flaky = 0;

  printsToStdio(): boolean {
    return true;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.total = suite.allTests().length;
    this.startedAt = Date.now();
    const workers = config.workers ?? 1;
    this.writeBanner(workers);
  }

  onTestBegin(test: TestCase, result: TestResult): void {
    const retry = result.retry > 0 ? `  (retry ${result.retry})` : '';
    this.writeLine(`RUN   ${workerTag(result)} ${test.title}${retry}`);
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
    if (!isGherkinStep(step)) return;
    const icon = step.error ? 'FAIL' : 'PASS';
    this.writeLine(
      `  ${icon}  ${workerTag(result)} ${step.title}  (${formatDuration(step.duration)})`,
    );
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const isFinal =
      result.status === 'passed' ||
      result.status === 'skipped' ||
      result.status === 'interrupted' ||
      result.retry >= test.retries;

    this.writeLine(
      `${statusLabel(result.status)}  ${workerTag(result)} ${test.title}  (${formatDuration(result.duration)})`,
    );

    if (!isFinal || this.finishedIds.has(test.id)) return;

    this.finishedIds.add(test.id);
    if (result.status === 'skipped') this.skipped += 1;
    else if (test.outcome() === 'flaky') this.flaky += 1;
    else if (result.status === 'passed') this.passed += 1;
    else this.failed += 1;

    this.writeLine(this.barText());
  }

  onStdOut(chunk: string | Buffer): void {
    this.writeChunk(chunk);
  }

  onStdErr(chunk: string | Buffer): void {
    this.writeChunk(chunk);
  }

  onEnd(result: FullResult): void {
    this.writeLine('');
    this.writeLine(
      `Done  ${result.status}  ${formatDuration(Date.now() - this.startedAt)}  ` +
        `pass:${this.passed} fail:${this.failed} flaky:${this.flaky} skip:${this.skipped}`,
    );
  }

  private writeChunk(chunk: string | Buffer): void {
    const text = String(chunk);
    const lines = text.split(/\r?\n/);
    const endsWithNl = /\r?\n$/.test(text);
    const last = endsWithNl ? lines.slice(0, -1) : lines;
    for (const line of last) {
      if (line.length) this.writeLine(line);
    }
  }

  private writeLine(line: string): void {
    process.stdout.write(`${line}\n`);
  }

  private barText(): string {
    const done = this.finishedIds.size;
    const pct = this.total === 0 ? 0 : Math.round((done / this.total) * 100);
    const filled = this.total === 0 ? 0 : Math.round((done / this.total) * BAR_WIDTH);
    const bar = `[${'='.repeat(filled)}${'-'.repeat(BAR_WIDTH - filled)}]`;
    const brand = useColor() ? `${C.cyan}PIEQ${C.reset}  ` : 'PIEQ  ';
    return (
      `${brand}${bar}  ${done}/${this.total}  ${pct}%  ` +
      `pass:${this.passed} fail:${this.failed} flaky:${this.flaky} skip:${this.skipped}  ` +
      `${formatDuration(Date.now() - this.startedAt)}`
    );
  }

  private writeBanner(workers: number): void {
    const paint = (line: string) =>
      useColor() ? `${C.cyan}${line}${C.reset}` : line;
    this.writeLine('');
    for (const line of PIEQ_BANNER) this.writeLine(paint(line));
    const sub =
      `ICM  ·  ${envLabel()}  ·  ${this.total} tests  ·  ` +
      `${workers} worker${workers === 1 ? '' : 's'}`;
    this.writeLine(useColor() ? `${C.dim}${sub}${C.reset}` : sub);
    this.writeLine('');
  }
}

const C = {
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
};

function useColor(): boolean {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  return Boolean(process.stdout.isTTY) || /^(1|true|yes)$/i.test(process.env.GITHUB_ACTIONS ?? '');
}

function envLabel(): string {
  const override = process.env.REPORT_ENV?.trim();
  if (override) return override;
  try {
    const host = new URL(process.env.BASE_URL ?? '').hostname;
    const first = host.split('.')[0];
    if (first && first !== 'www') return first;
  } catch {
    /* ignore */
  }
  return 'local';
}

function isGherkinStep(step: TestStep): boolean {
  return step.category === 'test.step' && GHERKIN.test(step.title.trim());
}

function workerTag(result: TestResult): string {
  return `[w${result.parallelIndex}]`;
}

function statusLabel(status: TestResult['status']): string {
  switch (status) {
    case 'passed':
      return 'PASS';
    case 'failed':
    case 'timedOut':
      return 'FAIL';
    case 'skipped':
      return 'SKIP';
    case 'interrupted':
      return 'INT ';
    default:
      return '    ';
  }
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${String(rem).padStart(2, '0')}s`;
}

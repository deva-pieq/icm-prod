import 'dotenv/config';
const imap = require('imap-simple') as typeof import('imap-simple');
const { simpleParser } = require('mailparser');

(async () => {
  const targets = process.argv.slice(2).length ? process.argv.slice(2) : [];
  const c = await imap.connect({
    imap: {
      user: process.env.GMAIL_USER,
      password: process.env.GMAIL_APP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    },
  });
  await c.openBox('INBOX');
  const since = new Date(Date.now() - 96 * 3600e3);
  const msgs = await c.search(['ALL', ['SINCE', since.toISOString().slice(0, 10)]], {
    bodies: [''],
    markSeen: false,
  });
  console.log(`Total recent messages: ${msgs.length}`);
  for (const m of [...msgs].reverse()) {
    const full = m.parts.find((p: any) => p.which === '');
    if (!full?.body) continue;
    const p = await simpleParser(full.body);
    const to = Array.isArray(p.to) ? p.to.map((a: any) => a.text).join(',') : (p.to?.text || '');
    const cc = Array.isArray(p.cc) ? p.cc.map((a: any) => a.text).join(',') : (p.cc?.text || '');
    if (targets.length && !targets.some((t) => (to + cc).toLowerCase().includes(t.toLowerCase()))) continue;
    console.log(
      `TO=${to} | CC=${cc} | FROM=${JSON.stringify(p.from)} | SUBJ=${JSON.stringify(p.subject)} | ${p.date?.toISOString()}`,
    );
  }
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
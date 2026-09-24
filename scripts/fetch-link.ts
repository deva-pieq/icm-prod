import 'dotenv/config';
const imap = require('imap-simple') as typeof import('imap-simple');
const { simpleParser } = require('mailparser');
const { JSDOM } = require('jsdom');

(async () => {
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
  const since = new Date(Date.now() - 48 * 3600e3);
  const target = process.argv[2] || 'deva.r+prod+sl@pieq.ai';
  const msgs = await c.search(['ALL', ['SINCE', since.toISOString().slice(0, 10)]], {
    bodies: [''],
    markSeen: false,
  });
  for (const m of [...msgs].reverse()) {
    const full = m.parts.find((p: any) => p.which === '');
    if (!full?.body) continue;
    const p = await simpleParser(full.body);
    const to = Array.isArray(p.to) ? p.to.map((a: any) => a.text).join(',') : (p.to?.text || '');
    if (!to.toLowerCase().includes(target.toLowerCase())) continue;
    const dom = new JSDOM(p.html || '');
    for (const a of dom.window.document.querySelectorAll('a[href]')) {
      const h = a.getAttribute('href') || '';
      if (/action-token|awstrack|login-actions/i.test(h)) {
        console.log(h);
        await c.end();
        return;
      }
    }
  }
  await c.end();
  console.log('NONE');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
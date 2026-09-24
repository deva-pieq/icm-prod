import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/auth/LoginPage';
import {
  createAndActivateAgent,
  extractActivationLink,
} from './agentActivation';

test('extractActivationLink recovers full URL from QP-wrapped body', () => {
  // Mimics Gmail quoted-printable soft-wrap mid-URL (the previous failure mode)
  const qpWrapped = [
    'Click <a href="https://tn92l3sw.r.us-east-1.awstrack.me/L0/https:%2F%=',
    '2Fpreprod.auth.pieq.ai%2Frealms%2Fpieq-sso%2Flogin-actions%2Faction-token%3=',
    'Fkey=3DeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.e30.sig/1/010001aa-bb/sig=473">',
    'here</a>',
  ].join('\r\n');

  // After mailparser decode, href is contiguous — assert unwrap works on that form
  const decodedHtml =
    '<a href="https://tn92l3sw.r.us-east-1.awstrack.me/L0/https:%2F%2Fpreprod.auth.pieq.ai%2Frealms%2Fpieq-sso%2Flogin-actions%2Faction-token%3Fkey=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.e30.sig/1/010001aa-bb/sig=473">Click here</a>';

  const link = extractActivationLink(decodedHtml);
  expect(link).toBeTruthy();
  expect(link!).toContain('awstrack.me');
  expect(link!).toContain('action-token');
  expect(link!).toContain('key=');
  expect(link!.length).toBeGreaterThan(80);
  // Must NOT stop at soft-break residue
  expect(link!).not.toMatch(/%2F%=$/);

  // Fallback path: flattened QP text without HTML
  const fromQp = extractActivationLink(qpWrapped);
  expect(fromQp).toBeTruthy();
  expect(fromQp!).toContain('awstrack.me');
  expect(fromQp!).toContain('action-token');
});

test('create and activate agent end-to-end', async ({ page }) => {
  await page.goto(process.env.BASE_URL || 'https://preprod.app.pieq.ai/');

  const loginPage = new LoginPage(page);
  await loginPage.loginWithEmailPasswordToApp(
    process.env.E2E_EMAIL || 'deva.r+ag3@pieq.ai',
    process.env.E2E_PASSWORD || 'Test@123',
  );

  const agent = await createAndActivateAgent(page);
  console.log('🎉 Done! Agent created and activated:', agent);
  expect(agent.email).toContain('deva.r+test+a+');
});

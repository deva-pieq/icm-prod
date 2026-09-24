import type { Page } from '@playwright/test';
import { AgentFormPage } from '../../pages/agents/AgentFormPage';
import { AgentsPage } from '../../pages/agents/AgentsPage';
import {
  getSeedAgent,
  hasSeedAgent,
  setSeedAgent,
  setSeedAgentEditUrl,
  type SeedAgent,
} from './agentContext';

function uniqueSuffix(): string {
  return `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
}

function buildSeedAgent(): SeedAgent {
  const suffix = uniqueSuffix();
  const firstName = `LvlH${suffix.slice(-4)}`;
  const lastName = `Seed${suffix.slice(-4)}`;
  return {
    agentId: `9${suffix}`.slice(0, 10),
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    email: `lvlh.seed+${suffix}@pieq.ai`,
    npn: `8${suffix}`.slice(0, 10),
  };
}

/** Create one agent for the level-hierarchy module and capture its edit URL. Idempotent. */
export async function createSeedAgent(page: Page): Promise<SeedAgent> {
  if (hasSeedAgent()) return getSeedAgent();

  const agentsPage = new AgentsPage(page);
  const agentFormPage = new AgentFormPage(page);
  const data = buildSeedAgent();

  await agentsPage.openList();
  await agentsPage.openAdd();
  await agentFormPage.fillAllRequiredFields({
    agentId: data.agentId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    npn: data.npn,
    phone: `555${data.agentId.slice(-7)}`.slice(0, 10),
  });
  await agentFormPage.fillValidBankDetails();
  await agentFormPage.clickSave();
  await agentFormPage.clickConfirmSave({ captureToast: true });

  setSeedAgent(data);

  await agentsPage.openList();
  await agentsPage.searchGrid(data.email);
  await agentsPage.openEditByMatchingRow(data.displayName);
  setSeedAgentEditUrl(page.url());
  await agentsPage.openList();

  return data;
}

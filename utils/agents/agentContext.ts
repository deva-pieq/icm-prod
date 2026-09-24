export type SeedAgent = {
  agentId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  npn: string;
};

let seedAgent: SeedAgent | null = null;
let seedAgentEditUrl: string | null = null;
let licensingAgentEditUrl: string | null = null;

export function setSeedAgent(data: SeedAgent): void {
  seedAgent = data;
}

export function getSeedAgent(): SeedAgent {
  if (!seedAgent) {
    throw new Error(
      'Seed agent not prepared — run level-hierarchy Background "a unique seed agent exists for level hierarchy" first',
    );
  }
  return seedAgent;
}

export function hasSeedAgent(): boolean {
  return seedAgent !== null;
}

export function setSeedAgentEditUrl(url: string): void {
  seedAgentEditUrl = url;
}

export function getSeedAgentEditUrl(): string {
  if (!seedAgentEditUrl) {
    throw new Error('Seed agent edit URL not captured — create seed agent first');
  }
  return seedAgentEditUrl;
}

export function hasSeedAgentEditUrl(): boolean {
  return seedAgentEditUrl !== null;
}

export function clearAgentContext(): void {
  seedAgent = null;
  seedAgentEditUrl = null;
  licensingAgentEditUrl = null;
}

export function setLicensingAgentEditUrl(url: string): void {
  licensingAgentEditUrl = url;
}

export function getLicensingAgentEditUrl(): string | null {
  return licensingAgentEditUrl;
}

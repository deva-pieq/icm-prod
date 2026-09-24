import fs from 'node:fs';

const generatedFiles = new Set<string>();

export function registerGeneratedFile(absolutePath: string): void {
  generatedFiles.add(absolutePath);
}

export function deleteGeneratedFiles(): void {
  for (const filePath of generatedFiles) {
    try {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
    } catch {
      // ignore — file may already be gone or locked
    }
  }
  generatedFiles.clear();
}

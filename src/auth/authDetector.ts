import { execFile } from 'child_process';
import { getConfig } from '../config';

export type AuthResult =
  | { type: 'api_key'; apiKey: string }
  | { type: 'cli'; cliPath: string }
  | { type: 'none' };

export async function detectAuth(): Promise<AuthResult> {
  // Priority 1: Check for ANTHROPIC_API_KEY env var
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey.startsWith('sk-ant-api')) {
    return { type: 'api_key', apiKey };
  }

  // Priority 2: Check if claude CLI is installed and authenticated
  const cliPath = getConfig().cliPath;
  const cliAvailable = await checkCliAuth(cliPath);
  if (cliAvailable) {
    return { type: 'cli', cliPath };
  }

  return { type: 'none' };
}

function checkCliAuth(cliPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = execFile(
      cliPath,
      ['auth', 'status'],
      { timeout: 5000 },
      (error, stdout) => {
        if (error) {
          resolve(false);
          return;
        }
        // If the command succeeds, CLI is installed and authenticated
        resolve(true);
      }
    );
    proc.on('error', () => resolve(false));
  });
}

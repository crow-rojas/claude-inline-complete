import { AuthResult } from '../auth/authDetector';
import { ICompletionBackend } from './types';
import { DirectApiClient } from './directApiClient';
import { CliBridge } from './cliBridge';

export function createCompletionBackend(
  auth: AuthResult,
  cliTimeoutMs: number
): ICompletionBackend | null {
  switch (auth.type) {
    case 'api_key':
      return new DirectApiClient(auth.apiKey);
    case 'cli':
      return new CliBridge(auth.cliPath, cliTimeoutMs);
    case 'none':
      return null;
  }
}

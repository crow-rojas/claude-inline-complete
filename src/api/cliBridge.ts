import { spawn, ChildProcess } from 'child_process';
import { ICompletionBackend, CompletionRequest, CompletionResponse } from './types';

export class CliBridge implements ICompletionBackend {
  private cliPath: string;
  private timeoutMs: number;
  private activeProcesses: Set<ChildProcess> = new Set();

  constructor(cliPath: string, timeoutMs: number) {
    this.cliPath = cliPath;
    this.timeoutMs = timeoutMs;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // Build the full prompt with system + user + prefill
    const fullPrompt = [
      '<system>',
      request.systemPrompt,
      '</system>',
      '',
      request.prompt,
    ].join('\n');

    return new Promise<CompletionResponse>((resolve, reject) => {
      const args = [
        '-p', '-',
        '--model', request.model,
        '--output-format', 'text',
        '--no-session-persistence',
        '--max-turns', '1',
      ];

      const proc = spawn(this.cliPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: this.timeoutMs,
      });

      this.activeProcesses.add(proc);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      // Bridge abort signal to process kill
      const onAbort = () => {
        proc.kill('SIGTERM');
      };

      if (request.signal) {
        if (request.signal.aborted) {
          proc.kill('SIGTERM');
          resolve({ text: '' });
          return;
        }
        request.signal.addEventListener('abort', onAbort, { once: true });
      }

      proc.on('close', (code) => {
        this.activeProcesses.delete(proc);
        if (request.signal) {
          request.signal.removeEventListener('abort', onAbort);
        }

        if (request.signal?.aborted) {
          resolve({ text: '' });
          return;
        }

        // Extract text between <COMPLETION> tags if present
        const text = this.extractCompletion(stdout);
        resolve({ text });
      });

      proc.on('error', (err) => {
        this.activeProcesses.delete(proc);
        if (request.signal) {
          request.signal.removeEventListener('abort', onAbort);
        }

        if (err.message.includes('ETIMEDOUT') || err.message.includes('killed')) {
          resolve({ text: '' });
          return;
        }
        reject(err);
      });

      // Pipe prompt via stdin to avoid ARG_MAX limits
      proc.stdin.write(fullPrompt);
      proc.stdin.end();
    });
  }

  private extractCompletion(output: string): string {
    // Try to extract content between <COMPLETION> tags
    const match = output.match(/<COMPLETION>([\s\S]*?)<\/COMPLETION>/);
    if (match) {
      return match[1];
    }
    // Fallback: return trimmed output
    return output.trim();
  }

  dispose(): void {
    for (const proc of this.activeProcesses) {
      proc.kill('SIGTERM');
    }
    this.activeProcesses.clear();
  }
}

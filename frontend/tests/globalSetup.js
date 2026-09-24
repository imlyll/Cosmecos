import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../backend');

/** Boots the real API (in-memory MongoDB) once for the whole run and shares its URL via inject('backend'). */
export default async function setup({ provide }) {
  const child = spawn(process.execPath, ['src/scripts/test-server.js'], {
    cwd: backendDir,
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  const info = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Backend test server did not start in 90s')), 90_000);
    let buffer = '';
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      const line = buffer.split('\n').find((l) => l.startsWith('READY '));
      if (line) {
        clearTimeout(timer);
        resolve(JSON.parse(line.slice(6)));
      }
    });
    child.on('exit', (code) => reject(new Error(`Backend test server exited with code ${code}`)));
  });

  provide('backend', info);

  return () => {
    child.stdin.end();
    child.kill();
  };
}

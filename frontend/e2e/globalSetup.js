// Builds the app into dist-e2e (with a test Google client id), then boots the API (in-memory MongoDB,
// via backend/tests/server.js) and `vite preview` of that build.
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frontendDir = fileURLToPath(new URL('..', import.meta.url));
const serverScript = fileURLToPath(new URL('../../backend/tests/server.js', import.meta.url));
const vite = 'node_modules/vite/bin/vite.js';
// Must match GOOGLE_CLIENT_ID in backend/tests/server.js.
const GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

function waitFor(child, pattern) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      const match = buffer.match(pattern);
      if (match) resolve(match);
    });
    child.on('exit', (code) => reject(new Error(`Process exited with code ${code}: ${buffer}`)));
  });
}

export default async function setup() {
  const build = spawnSync(process.execPath, [vite, 'build', '--outDir', 'dist-e2e', '--emptyOutDir'], {
    cwd: frontendDir,
    env: { ...process.env, VITE_API_URL: '', VITE_GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID },
    stdio: 'inherit',
  });
  if (build.status !== 0) throw new Error('Build for the e2e tests failed');

  const api = spawn(process.execPath, [serverScript], {
    env: { ...process.env, AUDIT_MODE: 'test' },
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  const info = JSON.parse((await waitFor(api, /READY (.*)\n/))[1]);
  process.env.AUDIT_API = JSON.stringify(info);

  const web = spawn(process.execPath, [vite, 'preview', '--outDir', 'dist-e2e', '--port', '4173', '--strictPort'], {
    cwd: frontendDir,
    env: { ...process.env, VITE_PROXY_TARGET: info.url },
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  await waitFor(web, /4173/);

  return async () => {
    web.kill();
    api.stdin.end();
    api.kill();
  };
}

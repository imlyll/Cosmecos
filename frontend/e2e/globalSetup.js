// Boots the API (in-memory MongoDB, via backend/tests/server.js) and `vite preview` of the production build.
// Run `npm run build` first.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frontendDir = fileURLToPath(new URL('..', import.meta.url));
const serverScript = fileURLToPath(new URL('../../backend/tests/server.js', import.meta.url));

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
  const api = spawn(process.execPath, [serverScript], {
    env: { ...process.env, AUDIT_MODE: 'test' },
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  const info = JSON.parse((await waitFor(api, /READY (.*)\n/))[1]);
  process.env.AUDIT_API = JSON.stringify(info);

  const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '4173', '--strictPort'], {
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

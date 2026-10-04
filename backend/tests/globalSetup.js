const { spawn } = require('child_process');
const path = require('path');

function start(mode) {
  const child = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    env: { ...process.env, AUDIT_MODE: mode },
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  return new Promise((resolve, reject) => {
    let buf = '';
    child.stdout.on('data', (c) => {
      buf += c;
      const line = buf.split('\n').find((l) => l.startsWith('READY '));
      // The startup log goes along too, so tests can check what the server printed.
      if (line) resolve({ child, info: { ...JSON.parse(line.slice(6)), log: buf } });
    });
    child.on('exit', (code) => reject(new Error(`server (${mode}) exited ${code}`)));
  });
}

module.exports = async () => {
  const [test, prod, brevo] = await Promise.all([start('test'), start('production'), start('brevo')]);
  process.env.AUDIT_TEST = JSON.stringify(test.info);
  process.env.AUDIT_PROD = JSON.stringify(prod.info);
  process.env.AUDIT_BREVO = JSON.stringify(brevo.info);
  globalThis.__auditChildren = [test.child, prod.child, brevo.child];
};

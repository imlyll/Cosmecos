module.exports = async () => {
  for (const c of globalThis.__auditChildren || []) {
    c.stdin.end();
    c.kill();
  }
};

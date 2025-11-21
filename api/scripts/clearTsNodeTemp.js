const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = os.tmpdir();

try {
  const entries = fs.readdirSync(tmpDir);
  for (const name of entries) {
    if (name.startsWith('.ts-node') || name.startsWith('.ts-node-dev')) {
      const p = path.join(tmpDir, name);
      try {
        fs.rmSync(p, { recursive: true, force: true });
        console.log('Removed temp:', p);
      } catch (err) {
        // don't throw — just log and continue
        console.error('Failed to remove temp:', p, (err && err.message) || err);
      }
    }
  }
} catch (err) {
  console.error('Unable to scan temp dir:', tmpDir, (err && err.message) || err);
}

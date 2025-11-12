import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const raw = readFileSync(envPath, 'utf8');
for (const line of raw.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (match) {
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[match[1]]) {
      process.env[match[1]] = value;
    }
  }
}
if (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
}

const { adviseUAdminApi } = await import('../src/admin/api/adviseUAdminApi.js');

const proposals = await adviseUAdminApi.entities.Proposal.list('-created_at', 1);
console.log('proposals fetched', proposals.length);
if (!proposals.length) {
  console.log('No proposals found');
  process.exit(0);
}

const [first] = proposals;
console.log('updating proposal', first.id);

try {
  const updated = await adviseUAdminApi.entities.Proposal.update(first.id, {
    application_data: { debug: true },
  });
  console.log('update success', Object.keys(updated || {}));
} catch (err) {
  console.error('update failed', err);
  throw err;
}

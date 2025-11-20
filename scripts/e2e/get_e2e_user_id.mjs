import { readFileSync } from 'fs';

const rawEnv = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of rawEnv.split(/\r?\n/)) {
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

const { createClient } = await import('@supabase/supabase-js');

const url = process.env.VITE_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(url, serviceRole, { auth: { persistSession: false } });
const { data, error } = await adminClient.auth.admin.listUsers({ email: process.env.E2E_EMAIL });
if (error) {
  console.error('error', error);
} else {
  console.log('users', data?.users?.map((u) => ({ id: u.id, email: u.email })));
}

import { readFileSync } from 'fs';

const envRaw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envRaw.split(/\r?\n/)) {
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
const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await client
  .from('proposals')
  .select('*')
  .eq('advisor_id', process.env.E2E_ADVISOR_ID || '0b34589a-2c19-482a-985f-7ef08558684e')
  .order('created_at', { ascending: false });

if (error) {
  console.error(error);
} else {
  console.log(
    data?.map((row) => ({
      id: row.id,
      stage: row.stage,
      advisor_id: row.advisor_id,
      created_at: row.created_at,
      last_updated: row.last_updated,
      keys: Object.keys(row),
    })),
  );
}

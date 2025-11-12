import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.MIRA_VUS || 10),
  duration: __ENV.MIRA_DURATION || '2m',
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.MIRA_AGENT_URL; // e.g., https://<project>.functions.supabase.co/agent-chat
const TOKEN = __ENV.MIRA_AGENT_TOKEN; // service role or signed user JWT

export default function () {
  const payload = JSON.stringify({
    messages: [{ role: 'user', content: 'Hello Mira' }],
    mode: 'batch',
    metadata: { source: 'k6' },
  });
  const res = http.post(BASE_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: TOKEN ? `Bearer ${TOKEN}` : undefined,
    },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}


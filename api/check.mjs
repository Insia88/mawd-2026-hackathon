// 키가 살아 있는지 서비스별로 가장 가벼운 호출 하나씩 보낸다. 키 값은 출력하지 않는다.
// 실행: node check.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const env = {};
for (const line of readFileSync(join(here, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const checks = [
  {
    name: 'Liner',
    key: 'LINER_API_KEY',
    url: 'https://platform.liner.com/api/v1/credits/balance',
    headers: (k) => ({ 'X-API-KEY': k }),
    note: (j) => `잔액 $${j.balance_usd}`,
  },
  {
    name: 'VAPI',
    key: 'VAPI_API_KEY',
    url: 'https://api.vapi.ai/assistant?limit=1',
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
    note: (j) => `어시스턴트 ${Array.isArray(j) ? j.length : '?'}개 조회`,
  },
  {
    name: 'Stibee',
    key: 'STIBEE_API_KEY',
    url: 'https://api.stibee.com/v2/auth-check',
    headers: (k) => ({ AccessToken: k }),
    note: () => '인증 통과',
  },
  {
    name: 'Articul8 Bivia',
    key: 'ARTICUL8_API_KEY',
    url: 'https://api.articul8.ai/bivia/v1/models',
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
    note: () => '모델 목록 조회',
  },
];

for (const c of checks) {
  const k = env[c.key];
  if (!k) {
    console.log(`${c.name.padEnd(16)} 키 없음 (.env의 ${c.key}가 비어 있음)`);
    continue;
  }
  try {
    const res = await fetch(c.url, { headers: c.headers(k), signal: AbortSignal.timeout(20000) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    if (res.ok) console.log(`${c.name.padEnd(16)} 정상 (HTTP ${res.status}) ${json ? c.note(json) : ''}`);
    else console.log(`${c.name.padEnd(16)} 실패 (HTTP ${res.status}) ${text.slice(0, 120)}`);
  } catch (e) {
    console.log(`${c.name.padEnd(16)} 오류 ${e.message}`);
  }
}
